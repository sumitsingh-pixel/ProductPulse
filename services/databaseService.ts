
import { supabase } from '../supabaseClient';
import { ProjectContext, KPIDictionary, KPIThreshold, KPIFact, CSVUploadLog, JiraConnection, ReleaseReport, JiraCustomFieldMapping } from '../types';

/**
 * Executes a Supabase query with a safety timeout and retry logic.
 * Optimized to balance between fast-failing for UI snappiness and waiting for slow connections.
 */

async function safeQuery<T>(
  promiseFn: () => Promise<{data: T | null, error: any}>, 
  defaultVal: T, 
  context: string,
  retries: number = 2,
  timeoutMs: number = 12000 // Increased default base timeout to 12s
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    // Controller for the individual request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Note: We use the race approach for the timeout error message clarity
      const timeoutPromise = new Promise<{data: null, error: any}>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout: ${context} exceeded ${timeoutMs/1000}s limit.`)), timeoutMs);
      });

      const { data, error } = await Promise.race([promiseFn(), timeoutPromise]);
      clearTimeout(timeoutId);
      
      if (error) {
        console.warn(`[DB-Service] [${new Date().toISOString()}] Attempt ${attempt}/${retries} failed for ${context}:`, error.message);
        if (attempt === retries) return defaultVal;
        // Exponential backoff: 1s, 2s...
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        continue;
      }
      
      return data ?? defaultVal;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.message?.includes('Timeout');
      console.error(`[DB-Service] [${new Date().toISOString()}] Attempt ${attempt}/${retries} ${isTimeout ? 'timed out' : 'error'} in ${context}:`, err.message || err);
      
      if (attempt === retries) {
        console.error(`[DB-Service] All ${retries} attempts exhausted for ${context}. Returning fallback value.`);
        return defaultVal;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  return defaultVal;
}

export const databaseService = {
  // WORKSPACES
  async getWorkspaces(): Promise<ProjectContext[]> {
    const cachedRaw = localStorage.getItem('productpulse_workspaces_cache');
    const cachedData = cachedRaw ? JSON.parse(cachedRaw) : [];

    const fetchWorkspaces = async () => {
      // Increased timeout for initial workspace load to 15s to handle cold starts
      const data = await safeQuery(
        () => supabase.from('workspaces').select('*').order('created_at', { ascending: false }),
        null, 
        'Get Workspaces',
        3, // Increased retries for initial load
        15000 
      );

      if (data) {
        localStorage.setItem('productpulse_workspaces_cache', JSON.stringify(data));
        return data;
      }
      return cachedData;
    };

    // If we have cached data, return it immediately and refresh in background
    if (cachedData.length > 0) {
      fetchWorkspaces().catch(err => console.warn("[DB-Service] Background workspace refresh encountered issues (expected behavior if offline):", err));
      return cachedData;
    }

    return fetchWorkspaces();
  },

  async createWorkspace(workspace: Omit<ProjectContext, 'id'>): Promise<ProjectContext> {
    const { data: userData } = await supabase.auth.getUser();
    const payload = { ...workspace } as any;
    delete payload.id;
    const { data, error } = await supabase.from('workspaces').insert([{ ...payload, user_id: userData?.user?.id }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateWorkspace(id: string, updates: Partial<ProjectContext>) {
    const payload = { ...updates } as any;
    delete payload.id; 
    const { data, error } = await supabase.from('workspaces').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },


  async deleteWorkspace(id: string): Promise<void> {
  const { error } = await supabase.from('workspaces').delete().eq('id', id);
  if (error) throw error;
  
  // Clear cache after deletion
  const cachedRaw = localStorage.getItem('productpulse_workspaces_cache');
  if (cachedRaw) {
    const cached = JSON.parse(cachedRaw);
    const updated = cached.filter((w: ProjectContext) => w.id !== id);
    localStorage.setItem('productpulse_workspaces_cache', JSON.stringify(updated));
  }
},

  // JIRA CORE
  async getJiraConnection(): Promise<JiraConnection | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return safeQuery(
      () => supabase
        .from('jira_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      null,
      'Get Jira Connection',
      1,
      10000
    );
  },

  async saveJiraConnection(conn: Omit<JiraConnection, 'id' | 'user_id'>): Promise<JiraConnection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required for Jira synchronization.");

    const payload = { ...conn, user_id: user.id, is_active: true };
    const { data, error } = await supabase
      .from('jira_connections')
      .upsert(payload, { onConflict: 'user_id,jira_base_url,project_key' })
      .select()
      .single();
    
    if (error) {
      console.error("[DB-Service] Jira connection upsert failed:", error);
      throw error;
    }
    return data;
  },

  // JIRA MAPPINGS
  async saveCustomFieldMapping(mapping: Omit<JiraCustomFieldMapping, 'id'>): Promise<void> {
    const { error } = await supabase
      .from('jira_custom_field_mappings')
      .upsert(mapping, { onConflict: 'jira_connection_id,field_name' });
    
    if (error) {
      console.error("[DB-Service] Custom field mapping save failed:", error);
      throw error;
    }
  },

  async getCustomFieldMapping(connectionId: string, fieldName: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('jira_custom_field_mappings')
      .select('jira_field_id')
      .eq('jira_connection_id', connectionId)
      .eq('field_name', fieldName)
      .maybeSingle();
    
    if (error) return null;
    return data?.jira_field_id || null;
  },

  // RELEASE REPORTS
  async getReleaseReports(): Promise<ReleaseReport[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    return safeQuery(
      () => supabase
        .from('release_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      [],
      'Get Release Reports',
      1,
      10000
    );
  },

  async saveReleaseReport(report: Omit<ReleaseReport, 'id' | 'user_id'>): Promise<ReleaseReport> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Auth required");

    const payload = { ...report, user_id: user.id };
    const { data, error } = await supabase
      .from('release_reports')
      .insert([payload])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // TENANTS & FACTS
  async getAvailableTenants(): Promise<string[]> {
    const data = await safeQuery(
      () => supabase.from('kpi_daily_facts').select('tenant_id'), 
      [], 
      'Get Available Tenants',
      1,
      12000
    );
    return Array.from(new Set(data.filter(d => d.tenant_id).map(d => d.tenant_id)));
  },

  async getTenantFacts(tenantId: string): Promise<KPIFact[]> {
    return safeQuery(
      () => supabase.from('kpi_daily_facts').select('*').eq('tenant_id', tenantId).order('kpi_date', { ascending: true }),
      [],
      `Get Facts for Tenant: ${tenantId}`,
      1,
      15000
    );
  },

  async getFactsForRange(tenantId: string, days: number): Promise<KPIFact[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const dateStr = startDate.toISOString().split('T')[0];
    
    return safeQuery(
      () => supabase
        .from('kpi_daily_facts')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('kpi_date', dateStr)
        .order('kpi_date', { ascending: true }),
      [],
      `Get Facts for Range: ${tenantId}`,
      1,
      15000
    );
  },

  async bulkIngestFacts(facts: KPIFact[]): Promise<void> {
    const cleanFacts = facts.map(({ id, ...rest }) => rest);
    const { error } = await supabase.from('kpi_daily_facts').upsert(cleanFacts);
    if (error) throw error;
  },

  async getKPIDictionary(keys?: string[]): Promise<KPIDictionary[]> {
    return safeQuery(
      () => {
        let query = supabase.from('kpi_dictionary').select('*');
        if (keys && keys.length > 0) query = query.in('kpi_key', keys);
        return query;
      }, 
      [], 
      'Get Dictionary',
      1,
      12000
    );
  },

  async saveKPIDefinition(definition: KPIDictionary, tenantId: string): Promise<void> {
    const payload = { ...definition } as any;
    delete payload.id;
    const { error: dictError } = await supabase.from('kpi_dictionary').upsert(payload, { onConflict: 'kpi_key' });
    if (dictError) throw dictError;
  },

  async getTenantThresholds(tenantId: string): Promise<KPIThreshold[]> {
    return safeQuery(
      () => supabase.from('kpi_thresholds').select('*').eq('tenant_id', tenantId), 
      [], 
      'Get Thresholds',
      1,
      12000
    );
  },

  async saveThresholds(thresholds: KPIThreshold[]): Promise<void> {
    const cleanThresholds = thresholds.map((t: any) => {
      const { id, ...rest } = t;
      return rest;
    });
    const { error } = await supabase.from('kpi_thresholds').upsert(cleanThresholds, { onConflict: 'tenant_id,kpi_key' });
    if (error) throw error;
  },

  async logUpload(log: Omit<CSVUploadLog, 'id'>): Promise<void> {
    try {
      await supabase.from('csv_upload_log').insert([log]);
    } catch (err) {
      console.warn("[DB-Service] Non-critical logging failure.");
    }
  },

  async getCSVTemplateHeaders(): Promise<string[]> {
    const data = await safeQuery(
      () => supabase.from('csv_template_headers').select('column_name'), 
      [], 
      'Get Template Headers',
      1,
      10000
    );
    if (data.length > 0) return data.map(d => d.column_name);
    return ['tenant_id', 'site_id', 'kpi_date'];
  },
};
