
export enum ToolType {
  SEO_Lighthouse = 'SEO_Lighthouse',
  GA4_KPI = 'GA4_KPI',
  EPIC_PRIORITY = 'EPIC_PRIORITY',
  SENTIMENT_ANALYSIS = 'SENTIMENT_ANALYSIS'
}

export enum UserRole {
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

export interface ProjectContext {
  id?: string;
  name: string;
  type: string;
  description: string;
  tenant_id?: string;
  domain_name?: string;
  is_demo?: boolean;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie';
  metrics: string[];
  days: number;
  title: string;
}

export interface KPIDictionary {
  id?: string;
  kpi_key: string;
  kpi_name: string;
  description: string;
  formula: string;
  input_metrics: string;
  owner: string;
  business_goal_relation: string;
  north_star_alignment: string;
}

export interface KPIThreshold {
  tenant_id: string;
  kpi_key: string;
  kpi_name?: string;
  target_value: number;
  warning_threshold: number;
  failure_threshold: number;
  threshold_type: '>' | '<';
  alert_priority: 'High' | 'Medium' | 'Low';
  alert_frequency: string;
}

export interface KPIFact {
  id?: string;
  tenant_id: string;
  site_id?: string;
  kpi_date: string;
  source?: string;
  source_id?: string;
  kpis: Record<string, number>;
}

export interface CSVUploadLog {
  id?: string;
  file_name: string;
  rows_processed: number;
  rows_failed: number;
  status: 'Success' | 'Partial' | 'Failed';
  error_log?: string;
  created_at?: string;
}

export interface EpicStory {
  id: string;
  title: string;
  type: 'Epic' | 'Story';
  description: string;
  score?: number;
  bucket?: string;
}

export interface LighthouseReport {
  url: string;
  timestamp: string;
  device: 'Desktop' | 'Mobile';
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
  lcp: number; 
  fcp: number; 
  cls: number; 
  fid: number; 
  recommendations: string[];
}

export interface ReviewSource {
  id: string;
  name: string;
  url: string;
  count: number;
  detected: boolean;
  status: 'verified' | 'unverified' | 'error';
}

export interface MetricWithConfidence {
  value: number;
  confidence: number;
  dataPoints: number;
}

export interface SentimentAudit {
  url: string;
  timestamp: string;
  sources: ReviewSource[];
  metrics: {
    overallSatisfaction: MetricWithConfidence;
    taskCompletion: MetricWithConfidence;
    abandonmentRate: MetricWithConfidence;
    nps: MetricWithConfidence;
  };
  summary: {
    overview: string;
    keyFindings: string;
    overallImpression: string;
  };
  visuals: {
    desktopVsMobile: {
      metrics: string[];
      desktop: number[];
      mobile: number[];
    };
    issuePriority: {
      category: string;
      value: number;
      severity: 'critical' | 'high' | 'medium';
    }[];
    sentimentTrend: {
      date: string;
      score: number;
    }[];
  };
  usabilityParadox: string;
  wcagIssues: {
    standard: string;
    description: string;
  }[];
  iaIssues: string[];
  digitalEquityImpact: string;
  recommendations: {
    id: number;
    title: string;
    impact: 'High' | 'Medium' | 'Low';
    description: string;
    timeline: string;
    outcome: string;
  }[];
  verificationData: {
    source: string;
    rating: number;
    date: string;
    review: string;
    aiInterpretation: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
  quotes: {
    positive: { text: string; source: string }[];
    negative: { text: string; source: string }[];
  };
}

export interface JiraConnection {
  id?: string;
  user_id?: string;
  jira_base_url: string;
  jira_email: string;
  jira_api_token: string;
  project_key: string;
  connection_name?: string;
  is_active?: boolean;
}

export interface JiraCustomFieldMapping {
  id?: string;
  jira_connection_id: string;
  field_name: string;
  jira_field_id: string;
}

// Added ReleaseReport interface to fix missing export member error in databaseService.ts and ReleaseReporting.tsx
export interface ReleaseReport {
  id?: string;
  user_id?: string;
  fix_version_name: string;
  sprint_number: string;
  release_date: string;
  start_date: string;
  total_issues: number;
  total_story_points: number;
  issues_deployed: number;
  bugs_resolved: number;
  sanity_executers: string[];
  sanity_status: string;
  document_url: string;
  document_format: string;
  report_data: any;
  created_at?: string;
}

export type KPI = KPIDictionary & { selected?: boolean };
