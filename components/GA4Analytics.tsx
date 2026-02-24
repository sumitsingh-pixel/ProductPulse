
import React, { useState, useEffect, useRef } from 'react';
import { ProjectContext, KPIDictionary, KPIThreshold, KPIFact, UserRole } from '../types';
import { databaseService } from '../services/databaseService';
import { getExecutiveAnalysis, chatWithKPIAgent } from '../services/geminiService';
import { 
  Loader2, Search, Database, AlertCircle, Plus, 
  Settings, CheckCircle, BarChart3, ArrowRight, ShieldCheck,
  Terminal, Activity, Sparkles, MessageSquare, Send, RefreshCw, ChevronLeft, ShieldAlert,
  FileUp, Zap, Globe, FileText, Link2, Unlink, Settings2, DatabaseZap
} from 'lucide-react';
import { KPIStatTile } from './ga4/KPIStatTile';
import { DashboardView } from './ga4/DashboardView';
import { IntelligenceCommand } from './ga4/IntelligenceCommand';
import { CSVUploader } from './CSVUploader';
import { DynamicDashboard } from './ga4/DynamicDashboard';
import { GA4DirectConnector } from './ga4/GA4DirectConnector';

enum Step { 
  TENANT_SELECT, 
  KPI_DISCOVERY, 
  AUTO_DEFINE, 
  THRESHOLD_CONFIG, 
  DASHBOARD, 
  ADVANCED_INSIGHTS,
  EMPTY_DATA_RECOVERY 
}

interface GA4AnalyticsProps {
  project: ProjectContext;
  role: UserRole;
  onStatusChange?: (status: 'active' | 'offline' | 'searching') => void;
  onRedirect?: (message: string) => void;
}

export const GA4Analytics: React.FC<GA4AnalyticsProps> = ({ 
  project, 
  role, 
  onStatusChange, 
  onRedirect 
}) => {
  const [step, setStep] = useState<Step>(Step.TENANT_SELECT);
  const [tenants, setTenants] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState(project.tenant_id || '');
  const [facts, setFacts] = useState<KPIFact[]>([]);
  const [dictionary, setDictionary] = useState<KPIDictionary[]>([]);
  const [thresholds, setThresholds] = useState<KPIThreshold[]>([]);
  const [danglingKeys, setDanglingKeys] = useState<string[]>([]);
  const [currentDanglingKey, setCurrentDanglingKey] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showDirectConnector, setShowDirectConnector] = useState(false);

  const [newDef, setNewDef] = useState<KPIDictionary>({
    kpi_key: '', kpi_name: '', description: '', formula: '',
    input_metrics: '', owner: '', business_goal_relation: '', north_star_alignment: ''
  });
  
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const list = await databaseService.getAvailableTenants();
      setTenants(list);
      if (project.tenant_id) {
        handleTenantSelection(project.tenant_id);
      }
    } catch (err: any) { 
      setError(`Stream Connection Failed: ${err.message}`); 
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSelection = async (tid: string) => {
    setSelectedTenant(tid);
    setLoading(true);
    setError(null);
    onStatusChange?.('searching');
    
    try {
      const factData = await databaseService.getTenantFacts(tid);
      setFacts(factData);

      if (factData.length === 0) {
        setStep(Step.EMPTY_DATA_RECOVERY);
        onStatusChange?.('offline');
        return;
      }

      const detectedKeysSet = new Set<string>();
      factData.forEach(f => f.kpis && Object.keys(f.kpis).forEach(k => detectedKeysSet.add(k)));
      const detectedKeys = Array.from(detectedKeysSet);
      
      const dictData = await databaseService.getKPIDictionary(detectedKeys);
      setDictionary(dictData);

      const existingKeys = dictData.map(d => d.kpi_key);
      const missing = detectedKeys.filter(k => !existingKeys.includes(k));

      if (missing.length > 0) {
        setDanglingKeys(missing);
        setCurrentDanglingKey(missing[0]);
        setNewDef(prev => ({ ...prev, kpi_key: missing[0], kpi_name: '', description: '' }));
        setStep(Step.AUTO_DEFINE);
      } else {
        await loadThresholds(tid, dictData);
      }
      onStatusChange?.('active');
    } catch (err: any) { 
      setError(`Handshake Protocol Failed: ${err.message}`);
      onStatusChange?.('offline');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDefinition = async () => {
    if (!currentDanglingKey) return;
    setLoading(true);
    try {
      await databaseService.saveKPIDefinition(newDef, selectedTenant);
      const detectedKeysSet = new Set<string>();
      facts.forEach(f => f.kpis && Object.keys(f.kpis).forEach(k => detectedKeysSet.add(k)));
      const updatedDict = await databaseService.getKPIDictionary(Array.from(detectedKeysSet));
      setDictionary(updatedDict);

      const nextKeys = danglingKeys.filter(k => k !== currentDanglingKey);
      if (nextKeys.length > 0) {
        setDanglingKeys(nextKeys);
        setCurrentDanglingKey(nextKeys[0]);
        setNewDef({ ...newDef, kpi_key: nextKeys[0], kpi_name: '', description: '' });
      } else {
        await loadThresholds(selectedTenant, updatedDict);
      }
    } catch (err: any) { 
      setError(`Definition Failed: ${err.message}`); 
    } finally {
      setLoading(false);
    }
  };

  const loadThresholds = async (tid: string, dict: KPIDictionary[]) => {
    setLoading(true);
    try {
      const existing = await databaseService.getTenantThresholds(tid);
      const missing = dict.filter(d => !existing.some(e => e.kpi_key === d.kpi_key));

      const initial: KPIThreshold[] = [
        ...existing,
        ...missing.map(m => ({
          tenant_id: tid,
          kpi_key: m.kpi_key,
          // kpi_name: m.kpi_name,
          target_value: 0,
          warning_threshold: 0,
          failure_threshold: 0,
          threshold_type: '>' as const,
          alert_priority: 'Medium' as const,
          alert_frequency: 'Daily'
        }))
      ];
      setThresholds(initial);
      setStep(Step.THRESHOLD_CONFIG);
    } catch (err: any) { 
      setError(`Threshold Calibration Failed: ${err.message}`); 
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (skipSync = false) => {
    setLoading(true);
    setError(null);
    try {
      if (!skipSync) {
        await databaseService.saveThresholds(thresholds);
        try {
          await databaseService.updateWorkspace(project.id!, { tenant_id: selectedTenant });
        } catch (dbErr: any) {
          console.warn("DB Update suppressed:", dbErr);
        }
      }

      let analysis = { insights: [], recommendations: [] };
      try {
        analysis = await getExecutiveAnalysis(facts, dictionary, thresholds, project);
      } catch (aiErr) {
        console.warn("AI Analysis failed:", aiErr);
      }
      
      setAnalysisResults(analysis);
      setStep(Step.DASHBOARD);
    } catch (err: any) { 
      setError(`Final synchronization failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (msg?: string) => {
    const text = msg || chatInput;
    if (!text.trim()) return;
    const userMsg = { role: 'user' as const, text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    try {
      const context = `Tenant: ${selectedTenant}. Facts: ${JSON.stringify(facts.slice(-3))}. Dictionary: ${JSON.stringify(dictionary)}. Thresholds: ${JSON.stringify(thresholds)}`;
      const response = await chatWithKPIAgent(chatMessages, text, context);
      setChatMessages(prev => [...prev, { role: 'bot' as const, text: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'bot' as const, text: "Protocol error in AI stream." }]);
    }
  };

  const getSourceType = () => {
    if (!facts.length) return 'Not Connected';
    const source = facts[0].source;
    if (source === 'ga4') return 'GA4 Direct';
    if (source === 'CSV_UPLOAD') return 'CSV Manual';
    return 'Apps Script';
  };

  const renderPersistentBanner = () => {
    if (step === Step.TENANT_SELECT) return null;
    return (
      <div className="max-w-6xl mx-auto px-10 py-6 glass-card border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-500 mb-8">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-teal-500/10 rounded-2xl border border-teal-500/20 text-teal-400">
            <DatabaseZap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">{project.name}</h4>
              <span className="px-2 py-0.5 bg-slate-800 text-[8px] font-black text-slate-400 rounded border border-white/5 uppercase tracking-widest">{selectedTenant}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Active Source: <span className="text-teal-400">{getSourceType()}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStep(Step.TENANT_SELECT)}
            className="px-6 py-3 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Change Data Source
          </button>
          {getSourceType() === 'GA4 Direct' && (
            <button 
              onClick={() => setShowDirectConnector(true)}
              className="px-6 py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 transition-all flex items-center gap-2"
            >
              <Settings2 className="w-3.5 h-3.5" /> Configure Source
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading && step !== Step.DASHBOARD && step !== Step.ADVANCED_INSIGHTS) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
          <Loader2 className="w-20 h-20 text-teal-500 animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-teal-400 animate-pulse" />
        </div>
        <div className="text-center space-y-4">
          <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Processing Protocol Layer...</p>
          <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Awaiting Handshake Acknowledgement</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case Step.TENANT_SELECT:
        return (
          <div className="max-w-6xl mx-auto space-y-12 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Grounding Core Discovery</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em]">Select a GA4 Property</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
               <div className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8 flex flex-col justify-between group hover:border-emerald-500/20 transition-all">
                  <div className="space-y-4">
                     <div className="flex justify-between items-start">
                        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/5 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-all">
                           <Zap className="w-7 h-7" />
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase rounded-full border border-emerald-500/20 tracking-widest">Active ✓</span>
                           <span className="text-[7px] text-slate-500 font-black uppercase mt-1">Last Sync: 2h ago</span>
                        </div>
                     </div>
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight">DB via Script <span className="text-[10px] text-slate-500 block mt-1 tracking-widest">DEV only</span></h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed"></p>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">Select Active Dataset</label>
                    <div className="relative">
                      <select 
                        className="w-full px-8 py-5 bg-slate-900 border-2 border-slate-800 rounded-3xl text-white font-black text-[10px] uppercase tracking-widest outline-none focus:border-emerald-500 appearance-none shadow-inner cursor-pointer"
                        value={selectedTenant}
                        onChange={(e) => handleTenantSelection(e.target.value)}
                      >
                        <option value="">Scan available vaults...</option>
                        {tenants.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none w-5 h-5" />
                    </div>
                  </div>
               </div>

               <div className="glass-card p-10 rounded-[3rem] border border-dashed border-slate-800 space-y-8 flex flex-col justify-between group hover:border-teal-500/30 transition-all">
                  <div className="space-y-4">
                     <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-teal-400 border border-white/5 group-hover:bg-teal-500 group-hover:text-slate-900 transition-all">
                        <FileUp className="w-7 h-7" />
                     </div>
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight">Manual Import <span className="text-[10px] text-slate-500 block mt-1 tracking-widest">CSV Ingestion</span></h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed"></p>
                  </div>
                  <button 
                    onClick={() => setShowUploader(true)}
                    className="w-full py-5 bg-slate-800 text-white border border-white/5 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-teal-500 hover:text-slate-950 transition-all shadow-xl shadow-teal-500/5"
                  >
                    Upload Data <ArrowRight className="w-4 h-4" />
                  </button>
               </div>

               <div className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8 flex flex-col justify-between group hover:border-blue-500/30 transition-all bg-blue-500/[0.02]">
                  <div className="space-y-4">
                     <div className="flex justify-between items-start">
                        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-400 border border-white/5 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-2xl">
                           <Globe className="w-7 h-7" />
                        </div>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase rounded-full border border-blue-500/20 tracking-widest"></span>
                     </div>
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight">Direct Link <span className="text-[10px] text-blue-500/60 block mt-1 tracking-widest">GA4 integration</span></h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Directly pull live dimensions and metrics.</p>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setShowDirectConnector(true)}
                      className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/20"
                    >
                      Connect GA4 Account <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="absolute -bottom-10 left-0 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-[8px] font-black text-blue-400 uppercase bg-slate-900 px-3 py-1 rounded-full border border-blue-500/20">Using Simulation Nodes for BETA Stage</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        );

      case Step.EMPTY_DATA_RECOVERY:
        return (
          <div className="max-w-2xl mx-auto py-20 text-center space-y-12 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl text-rose-500">
              <ShieldAlert className="w-12 h-12" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">No Telemetry Detected</h2>
              <p className="text-slate-400 font-medium text-lg">
                The workspace for <span className="text-teal-400">{selectedTenant}</span> is currently empty. Initialize a data stream to proceed.
              </p>
            </div>
            <div className="grid gap-4">
              <button 
                onClick={() => setShowDirectConnector(true)}
                className="w-full p-8 glass-card border border-white/5 hover:border-blue-500/30 rounded-3xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all"><Globe className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-sm font-black text-white uppercase tracking-widest">Connect & Sync GA4</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Establish GA4 integration</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-700 group-hover:text-blue-400 group-hover:translate-x-2 transition-all" />
              </button>
              
              <button 
                onClick={() => setShowUploader(true)}
                className="w-full p-8 glass-card border border-white/5 hover:border-teal-500/30 rounded-3xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-teal-500/10 text-teal-400 rounded-2xl group-hover:bg-teal-500 group-hover:text-slate-900 transition-all"><FileUp className="w-6 h-6" /></div>
                  <div className="text-left">
                    <p className="text-sm font-black text-white uppercase tracking-widest">Upload CSV Instead</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Manual batch ingestion for this project</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-700 group-hover:text-teal-400 group-hover:translate-x-2 transition-all" />
              </button>

              <button 
                onClick={() => setStep(Step.TENANT_SELECT)}
                className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
              >
                Back to Data Source Selection
              </button>
            </div>
          </div>
        );

      case Step.AUTO_DEFINE:
        return (
          <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-right duration-500">
             <div className="flex items-center gap-6 p-8 bg-amber-500/10 border border-amber-500/20 rounded-[3rem] shadow-2xl">
               <Activity className="w-10 h-10 text-amber-500 animate-pulse" />
               <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">New KPI Detected</h3>
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Undefined metric found: <span className="text-white bg-slate-800 px-2 py-0.5 rounded ml-1">{currentDanglingKey}</span></p>
               </div>
             </div>
             <div className="glass-card p-12 rounded-[4rem] border border-white/5 grid md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <input className="w-full px-6 py-4 bg-slate-900 rounded-2xl border border-slate-800 text-white font-bold" value={newDef.kpi_name} onChange={e => setNewDef({...newDef, kpi_name: e.target.value})} placeholder="KPI Name" />
                  <textarea className="w-full px-6 py-4 bg-slate-900 rounded-2xl border border-slate-800 text-white font-bold h-24" value={newDef.business_goal_relation} onChange={e => setNewDef({...newDef, business_goal_relation: e.target.value})} placeholder="Business Goal Relation" />
               </div>
               <div className="space-y-6">
                  <textarea className="w-full px-6 py-4 bg-slate-900 rounded-2xl border border-slate-800 text-white font-bold h-24" value={newDef.description} onChange={e => setNewDef({...newDef, description: e.target.value})} placeholder="Description" />
                  <input className="w-full px-6 py-4 bg-slate-900 rounded-2xl border border-slate-800 text-white font-bold" value={newDef.owner} onChange={e => setNewDef({...newDef, owner: e.target.value})} placeholder="Owner" />
               </div>
               <button onClick={handleSaveDefinition} className="md:col-span-2 py-6 bg-teal-500 text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-teal-400">Define Protocol Metadata</button>
             </div>
          </div>
        );

      case Step.THRESHOLD_CONFIG:
        return (
          <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-4xl font-black text-white tracking-tighter">Threshold Calibration</h2>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">Setting guardrails</p>
                </div>
                <button onClick={() => handleFinalize()} className="px-10 py-5 bg-teal-500 text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 hover:bg-teal-400 transition-all">
                  Initialize Dashboard <ArrowRight className="w-5 h-5" />
                </button>
             </div>
             <div className="glass-card rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                   <thead className="bg-slate-900/50 border-b border-white/5">
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                         <th className="px-10 py-6">KPI Key</th>
                         <th className="px-10 py-6">Target</th>
                         <th className="px-10 py-6">Warning</th>
                         <th className="px-10 py-6">Failure</th>
                         <th className="px-10 py-6">Logic</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {thresholds.map((t, idx) => (
                        <tr key={t.kpi_key} className="hover:bg-teal-500/[0.02] transition-colors">
                           <td className="px-10 py-6 text-white font-black text-sm">{dictionary.find(d => d.kpi_key === t.kpi_key)?.kpi_name || t.kpi_key}</td>
                           <td className="px-10 py-6"><input type="number" className="w-24 bg-slate-950 border border-white/5 p-3 rounded-xl text-white text-xs font-black" value={t.target_value} onChange={e => setThresholds(thresholds.map((th, i) => i === idx ? {...th, target_value: parseFloat(e.target.value)} : th))} /></td>
                           <td className="px-10 py-6"><input type="number" className="w-24 bg-slate-950 border border-white/5 p-3 rounded-xl text-white text-xs font-black" value={t.warning_threshold} onChange={e => setThresholds(thresholds.map((th, i) => i === idx ? {...th, warning_threshold: parseFloat(e.target.value)} : th))} /></td>
                           <td className="px-10 py-6"><input type="number" className="w-24 bg-slate-950 border border-white/5 p-3 rounded-xl text-white text-xs font-black" value={t.failure_threshold} onChange={e => setThresholds(thresholds.map((th, i) => i === idx ? {...th, failure_threshold: parseFloat(e.target.value)} : th))} /></td>
                           <td className="px-10 py-6">
                              <select className="bg-slate-950 border border-white/5 p-3 rounded-xl text-white text-xs font-black" value={t.threshold_type} onChange={e => setThresholds(thresholds.map((th, i) => i === idx ? {...th, threshold_type: e.target.value as '>'|'<'} : th))}>
                                 <option value=">">Above Target</option><option value="<">Below Target</option>
                              </select>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        );

      case Step.DASHBOARD:
        const analyzed = dictionary.map(d => {
          const latestFact = facts[facts.length - 1]?.kpis?.[d.kpi_key] || 0;
          const prevFact = facts[facts.length - 2]?.kpis?.[d.kpi_key] || 0;
          const th = thresholds.find(t => t.kpi_key === d.kpi_key);
          let status: 'good' | 'warning' | 'critical' = 'good';
          if (th) {
            if (th.threshold_type === '>') {
              if (latestFact < th.failure_threshold) status = 'critical';
              else if (latestFact < th.warning_threshold) status = 'warning';
            } else {
              if (latestFact > th.failure_threshold) status = 'critical';
              else if (latestFact > th.warning_threshold) status = 'warning';
            }
          }
          return {
            ...d, current_value: latestFact.toLocaleString(),
            trend: latestFact > prevFact ? 'up' : latestFact < prevFact ? 'down' : 'flat' as const,
            status
          };
        });

        const legacyTelemetry = facts.flatMap(f => 
          Object.entries(f.kpis || {}).map(([k, v]) => ({
            kpi_name: dictionary.find(d => d.kpi_key === k)?.kpi_name || k,
            value: v, recorded_at: f.kpi_date,
            metadata: { lineage: `${f.source || 'Apps Script'} | ${f.source_id || 'v1'}` }
          }))
        );

        return (
          <div className="space-y-12">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-8 py-6 bg-slate-900/60 border border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-4">
                <Activity className="w-6 h-6 text-teal-400" />
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Operational Command</h2>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(Step.ADVANCED_INSIGHTS)} 
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/30 flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/20"
                >
                  <Zap className="w-4 h-4" /> Insight Engine
                </button>
                <button onClick={() => setStep(Step.THRESHOLD_CONFIG)} className="px-6 py-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center gap-2 transition-all"><RefreshCw className="w-4 h-4" /> Recalibrate</button>
              </div>
            </div>
            <div className="grid lg:grid-cols-4 gap-12">
              <DashboardView analyzedKPIs={analyzed} ga4Config={{ propertyId: selectedTenant }} analysisResults={analysisResults || { insights: [], recommendations: [] }} telemetry={legacyTelemetry} startDate={facts[0]?.kpi_date || null} />
              <IntelligenceCommand chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} handleSendMessage={handleSendMessage} chatEndRef={chatEndRef} />
            </div>
          </div>
        );

      case Step.ADVANCED_INSIGHTS:
        return (
          <div className="space-y-8">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-8 py-6 bg-slate-900/60 border border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-4">
                <Zap className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-black text-white uppercase tracking-tighter"> Intelligence Layer</h2>
              </div>
              <button 
                onClick={() => setStep(Step.DASHBOARD)} 
                className="px-6 py-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center gap-2 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Return to Command
              </button>
            </div>
            <DynamicDashboard 
              tenantId={selectedTenant} 
              availableMetrics={dictionary.map(d => d.kpi_key)} 
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {showUploader && (
        <CSVUploader 
          onComplete={(tid) => {
            setShowUploader(false);
            handleTenantSelection(tid);
          }}
          onCancel={() => setShowUploader(false)}
        />
      )}
      {showDirectConnector && (
        <GA4DirectConnector 
          onComplete={(tid) => {
            setShowDirectConnector(false);
            handleTenantSelection(tid);
          }}
          onCancel={() => setShowDirectConnector(false)}
        />
      )}
      {renderPersistentBanner()}
      {error && (
        <div className="max-w-4xl mx-auto p-8 bg-rose-500/10 border-2 border-rose-500/20 rounded-[3rem] flex items-center gap-6 animate-in slide-in-from-top duration-300 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <div className="flex-1">
            <h4 className="text-white font-black uppercase text-xs tracking-widest mb-1">System Sync Interrupted</h4>
            <p className="text-sm text-rose-400 font-bold">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-[10px] font-black text-slate-500 uppercase hover:text-white">Dismiss</button>
        </div>
      )}
      {renderStep()}
    </div>
  );
};
