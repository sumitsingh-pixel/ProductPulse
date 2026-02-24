import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, Search, Loader2, Sparkles, AlertCircle, 
  TrendingUp, Activity, Smartphone, Monitor, 
  MessageCircle, BarChart, CheckCircle, Clock, 
  Download, ChevronRight, PieChart, Info,
  CheckCircle2, AlertTriangle, ShieldAlert, ShieldCheck,
  ArrowRight, FileText, Send, User, Quote, Zap,
  ExternalLink, Edit2, Plus, X, Star, Flag, Check, RotateCcw
} from 'lucide-react';
import { performSentimentAudit, detectReviewSources } from '../services/geminiService';
import { SentimentAudit, UserRole, ReviewSource, MetricWithConfidence } from '../types';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

Chart.register(...registerables);

interface Props {
  role: UserRole;
}

type FlowStep = 'input' | 'sources' | 'preview' | 'results';

export const SentimentAnalyzer: React.FC<Props> = ({ role }) => {
  const [url, setUrl] = useState('');
  const [flowStep, setFlowStep] = useState<FlowStep>('input');
  const [sources, setSources] = useState<ReviewSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<SentimentAudit | null>(null);
  const [activeTab, setActiveTab] = useState<'assessment' | 'visual' | 'action' | 'verification'>('assessment');
  const [error, setError] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  const radarChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const trendChartRef = useRef<HTMLCanvasElement>(null);
  
  const radarInstance = useRef<Chart | null>(null);
  const barInstance = useRef<Chart | null>(null);
  const trendInstance = useRef<Chart | null>(null);

  const handleStartDiscovery = async (url: string) => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const detected = await detectReviewSources(url);
      setSources(detected);
      setFlowStep('sources');
    } catch (err: any) {
      setError(err.message || "Discovery protocol failure.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await performSentimentAudit(url, sources);
      setAudit(result);
      setFlowStep('results');
      setActiveTab('assessment');
    } catch (err: any) {
      setError(err.message || "Audit engine failure.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSourceVerification = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'verified' ? 'unverified' : 'verified' } : s));
  };

  const updateSourceUrl = (id: string, newUrl: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, url: newUrl } : s));
    setEditingSourceId(null);
  };

  const addNewSource = () => {
    const id = `manual-${Date.now()}`;
    setSources([...sources, { id, name: 'Custom Source', url: '', count: 0, detected: false, status: 'unverified' }]);
    setEditingSourceId(id);
  };

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  useEffect(() => {
    if (activeTab === 'visual' && audit) {
      setTimeout(renderCharts, 100);
    }
  }, [activeTab, audit]);

  const renderCharts = () => {
    if (!audit || !radarChartRef.current || !barChartRef.current || !trendChartRef.current) return;

    radarInstance.current?.destroy();
    radarInstance.current = new Chart(radarChartRef.current, {
      type: 'radar',
      data: {
        labels: audit.visuals.desktopVsMobile.metrics,
        datasets: [
          { label: 'Desktop', data: audit.visuals.desktopVsMobile.desktop, borderColor: '#2DD4BF', backgroundColor: 'rgba(45, 212, 191, 0.2)' },
          { label: 'Mobile', data: audit.visuals.desktopVsMobile.mobile, borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.2)' }
        ]
      },
      options: { scales: { r: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { display: false } } }, plugins: { legend: { labels: { color: '#F8FAFC' } } } }
    });

    barInstance.current?.destroy();
    barInstance.current = new Chart(barChartRef.current, {
      type: 'bar',
      data: {
        labels: audit.visuals.issuePriority.map(i => i.category),
        datasets: [{ label: 'Severity', data: audit.visuals.issuePriority.map(i => i.value), backgroundColor: audit.visuals.issuePriority.map(i => i.severity === 'critical' ? '#EF4444' : i.severity === 'high' ? '#F59E0B' : '#EAB308') }]
      },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#F8FAFC' } } } }
    });

    trendInstance.current?.destroy();
    trendInstance.current = new Chart(trendChartRef.current, {
      type: 'line',
      data: {
        labels: audit.visuals.sentimentTrend.map(t => t.date),
        datasets: [{ label: 'Score', data: audit.visuals.sentimentTrend.map(t => t.score), borderColor: '#6366F1', tension: 0.4, fill: true, backgroundColor: 'rgba(99, 102, 241, 0.1)' }]
      },
      options: { 
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Score: ${ctx.raw} (AI Strategic Reconstruction)`
            }
          }
        }, 
        scales: { 
          y: { 
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#64748B' }
          },
          x: {
            ticks: { color: '#64748B' }
          }
        } 
      }
    });
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return 'text-emerald-400';
    if (conf >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const renderMetricCard = (label: string, metric: MetricWithConfidence, colorClass: string) => (
    <div className="glass-card p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col gap-4 group hover:-translate-y-2 transition-transform relative">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <div 
          className="px-2 py-1 rounded-lg bg-slate-900 border border-white/5 flex items-center gap-1.5 cursor-help"
          title="Confidence: An AI-derived reliability index based on data density and source variety."
        >
          <span className={`text-[8px] font-black uppercase ${getConfidenceColor(metric.confidence)}`}>CONF: {metric.confidence}%</span>
          <Info className="w-2.5 h-2.5 text-slate-700" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className={`text-4xl font-black ${colorClass}`}>{metric.value}{label === 'NPS' ? '' : '%'}</span>
        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest pb-1.5">{metric.dataPoints.toLocaleString()} Datapoints</span>
      </div>
      <button 
        onClick={() => setActiveTab('verification')}
        className="mt-2 text-[8px] font-black text-slate-500 hover:text-teal-400 uppercase tracking-widest flex items-center gap-1"
      >
        <Search className="w-2.5 h-2.5" /> View Analysis Traceability
      </button>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header Wizard Navigation */}
      {flowStep !== 'input' && (
        <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
          {[
            { id: 'input', label: 'URL Entry', step: 'input' },
            { id: 'sources', label: 'Verify Sources', step: 'sources' },
            { id: 'results', label: ' Audit', step: 'results' }
          ].map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                  flowStep === s.step ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-lg' : 
                  (idx < ['input', 'sources', 'results'].indexOf(flowStep) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-900 text-slate-600 border-white/5')
                }`}>
                  {idx < ['input', 'sources', 'results'].indexOf(flowStep) ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${flowStep === s.step ? 'text-teal-400' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
              {idx < 2 && <div className="w-12 h-px bg-white/5" />}
            </React.Fragment>
          ))}
        </div>
      )}

      {flowStep === 'input' && (
        <div className="glass-card p-12 rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden text-center max-w-4xl mx-auto">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
          <div className="flex flex-col items-center gap-6 mb-10">
            <div className="p-6 bg-slate-800 rounded-3xl text-teal-400 border border-white/5 shadow-2xl">
              <Globe className="w-12 h-12" />
            </div>
            <div>
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Sentiment Discovery</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1">AI based sentiment analysis</p>
            </div>
          </div>
          <div className="relative max-w-2xl mx-auto space-y-6">
            <div className="relative">
              <input 
                type="text" 
                className="w-full pl-16 pr-6 py-6 bg-slate-900 border-2 border-slate-800 rounded-[2rem] text-white font-bold text-lg outline-none focus:border-teal-500 transition-all shadow-inner"
                placeholder="https://www.materialplus.io"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 w-6 h-6" />
            </div>
            <button 
              onClick={() => handleStartDiscovery(url)}
              disabled={loading || !url.trim()}
              className="w-full py-6 bg-teal-500 text-slate-950 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-teal-500/20 hover:bg-teal-400 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              Initiate Scan
            </button>
          </div>
        </div>
      )}

      {flowStep === 'sources' && (
        <div className="space-y-10 animate-in slide-in-from-right duration-500">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight uppercase">Review Source Verification</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Verify the source</p>
              </div>
              <button onClick={addNewSource} className="px-6 py-3 bg-slate-800 text-teal-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center gap-2 hover:bg-teal-500 hover:text-slate-950 transition-all">
                <Plus className="w-4 h-4" /> Add Manually
              </button>
            </div>

            <div className="grid gap-4">
              {sources.map(source => (
                <div key={source.id} className="glass-card p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-teal-500/20 transition-all">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={`p-4 rounded-2xl ${source.detected ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-800 text-slate-600'}`}>
                      {source.name === 'App Store' ? <Smartphone className="w-6 h-6" /> : source.name === 'Play Store' ? <Activity className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-black text-white uppercase text-sm tracking-tight">{source.name}</h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${source.detected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                          {source.detected ? 'Auto-Detected' : 'Manual Entry'}
                        </span>
                      </div>
                      {editingSourceId === source.id ? (
                        <input 
                          autoFocus
                          className="mt-2 w-full bg-slate-950 border border-teal-500 p-2 rounded-lg text-xs text-white"
                          value={source.url}
                          onChange={(e) => setSources(prev => prev.map(s => s.id === source.id ? { ...s, url: e.target.value } : s))}
                          onBlur={() => setEditingSourceId(null)}
                          onKeyPress={(e) => e.key === 'Enter' && setEditingSourceId(null)}
                        />
                      ) : (
                        <p className="text-xs text-slate-500 font-bold truncate mt-1 italic pr-10">{source.url || 'No URL specified'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4 hidden md:block">
                      <p className="text-[10px] font-black text-white">{source.count.toLocaleString()} REVIEWS</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Available Volume</p>
                    </div>
                    <button onClick={() => setEditingSourceId(source.id)} className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => removeSource(source.id)} className="p-3 bg-slate-800 text-rose-400/50 hover:text-rose-400 rounded-xl transition-all border border-white/5"><X className="w-4 h-4" /></button>
                    <button 
                      onClick={() => toggleSourceVerification(source.id)}
                      className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${source.status === 'verified' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-500 border border-white/5 hover:border-teal-500/50'}`}
                    >
                      {source.status === 'verified' ? 'Verified' : 'Verify'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-10 glass-card rounded-[3.5rem] border border-indigo-500/20 bg-indigo-500/5 text-center space-y-6">
              <h4 className="text-xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-3">
                <ShieldCheck className="w-6 h-6 text-indigo-400" /> Accuracy Calibration
              </h4>
              <p className="text-sm text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                We've detected <span className="text-teal-400 font-black">{sources.reduce((a,b) => a + b.count, 0).toLocaleString()} potential reviews</span>. Initializing the audit will perform a deep sentiment scan across all verified nodes.
              </p>
              <button 
                onClick={handleRunAudit}
                disabled={loading || sources.filter(s => s.status === 'verified').length === 0}
                className="px-16 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-4 mx-auto disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Activity className="w-5 h-5" />}
                Execute Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {flowStep === 'results' && audit && (
        <div className="space-y-10 animate-in slide-in-from-bottom duration-1000">
          {/* Enhanced Tab Navigation */}
          <div className="flex p-2 bg-slate-900/60 border border-white/10 rounded-[2.5rem] backdrop-blur-xl sticky top-24 z-40 shadow-2xl max-w-4xl mx-auto overflow-x-auto scrollbar-hide">
            {[
              { id: 'assessment', label: 'Report', icon: <FileText className="w-4 h-4" /> },
              { id: 'visual', label: 'Visual Analysis', icon: <PieChart className="w-4 h-4" /> },
              { id: 'action', label: 'Action Plan', icon: <Zap className="w-4 h-4" /> },
              { id: 'verification', label: 'Verification', icon: <ShieldCheck className="w-4 h-4" /> }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-teal-500 text-slate-950 shadow-xl' : 'text-slate-500 hover:text-white'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'assessment' && (
            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
               {/* Summary Stats Row */}
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {renderMetricCard('Overall Satisfaction', audit.metrics.overallSatisfaction, 'text-teal-400')}
                  {renderMetricCard('Task Completion', audit.metrics.taskCompletion, 'text-indigo-400')}
                  {renderMetricCard('Abandonment', audit.metrics.abandonmentRate, 'text-rose-400')}
                  {renderMetricCard('NPS', audit.metrics.nps, 'text-amber-400')}
               </div>

               <div className="glass-card p-16 rounded-[4rem] border border-white/10 shadow-2xl space-y-16">
                  <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-teal-500 rounded-full" />
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">1. Executive Summary</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-10">
                        <div className="md:col-span-2 space-y-6">
                          <p className="text-base text-slate-300 font-bold leading-relaxed italic">{audit.summary.overview}</p>
                          <p className="text-base text-slate-300 font-medium leading-relaxed">{audit.summary.keyFindings}</p>
                        </div>
                        <div className="p-8 bg-slate-900/60 rounded-[2.5rem] border border-white/5 space-y-4 shadow-inner">
                          <h5 className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Overall Impression</h5>
                          <p className="text-sm font-black text-white tracking-tight leading-relaxed">{audit.summary.overallImpression}</p>
                        </div>
                    </div>
                  </section>
                  
                  <section className="space-y-8 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-500 rounded-full" />
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">2. Usability Paradox</h3>
                    </div>
                    <p className="text-base text-slate-400 font-semibold leading-relaxed p-10 bg-slate-900/40 rounded-[2.5rem] border border-white/5">
                      {audit.usabilityParadox}
                    </p>
                  </section>

                  <section className="space-y-8 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-rose-500 rounded-full" />
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">3. Accessibility (WCAG)</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                       {audit.wcagIssues.map((issue, i) => (
                         <div key={i} className="p-8 bg-slate-900 border border-white/5 rounded-3xl space-y-3">
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">{issue.standard}</span>
                            <p className="text-sm font-bold text-slate-300">{issue.description}</p>
                         </div>
                       ))}
                    </div>
                  </section>
               </div>
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
               <div className="grid lg:grid-cols-3 gap-8">
                  <div className="glass-card p-12 rounded-[4rem] border border-white/10 shadow-2xl space-y-8 flex flex-col h-[500px]">
                     <h4 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-indigo-400" /> Device Delta
                     </h4>
                     <div className="flex-1 flex items-center">
                        <canvas ref={radarChartRef} />
                     </div>
                  </div>
                  <div className="lg:col-span-2 glass-card p-12 rounded-[4rem] border border-white/10 shadow-2xl space-y-8 flex flex-col h-[500px]">
                     <h4 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <BarChart className="w-5 h-5 text-teal-400" /> Issues by Volume
                     </h4>
                     <div className="flex-1">
                        <canvas ref={barChartRef} />
                     </div>
                  </div>
               </div>
               <div className="glass-card p-12 rounded-[4rem] border border-white/10 shadow-2xl space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-indigo-400" />  Sentiment Trend
                    </h4>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-4 py-1.5 rounded-full border border-white/5">
                      Reconstructed 6-Month Timeline
                    </span>
                  </div>
                  <div className="h-[350px]">
                    <canvas ref={trendChartRef} />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
              <div className="grid md:grid-cols-3 gap-8">
                {audit.sources.map(source => (
                  <div key={source.id} className="glass-card p-8 rounded-3xl border border-white/5 flex items-center justify-between group">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase">{source.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{source.count.toLocaleString()} Datapoints</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">Audit Verification Panel</h4>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Cross-referencing AI interpretation against raw customer voice</p>
                  </div>
                  <div className="px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized Traceability
                  </div>
                </div>

                <div className="divide-y divide-white/5">
                  {audit.verificationData.map((v, i) => (
                    <div key={i} className="p-10 hover:bg-white/[0.02] transition-colors group relative overflow-hidden">
                      <div className="flex flex-col md:flex-row gap-10">
                        <div className="md:w-1/2 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-teal-400 uppercase tracking-[0.2em]">{v.source}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-800" />
                              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{v.date}</span>
                            </div>
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < v.rating ? 'fill-current' : 'opacity-20'}`} />)}
                            </div>
                          </div>
                          <p className="text-sm font-bold text-slate-300 leading-relaxed pr-6">"{v.review}"</p>
                        </div>

                        <div className="md:w-1/2 space-y-4 border-t md:border-t-0 md:border-l border-white/5 md:pl-10">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                              <Activity className="w-3 h-3" /> AI Interpretation
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${v.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                              {v.sentiment} sentiment
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold italic leading-relaxed">{v.aiInterpretation}</p>
                          <div className="flex gap-3 pt-2">
                             <button className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-all">
                               <Check className="w-3 h-3" /> Confirm Accurate
                             </button>
                             <button className="text-[9px] font-black text-slate-500 hover:text-rose-400 uppercase tracking-widest flex items-center gap-1.5 transition-all">
                               <Flag className="w-3 h-3" /> Flag Misinterpretation
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-10 bg-slate-900/40 text-center">
                  <button className="px-8 py-4 bg-slate-800 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all border border-white/5">
                    Load All Analyzed Traceability Packets
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Plan Tab */}
          {activeTab === 'action' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-right duration-500">
               {audit.recommendations.map(rec => (
                 <div key={rec.id} className="glass-card p-10 rounded-[3rem] border border-white/5 hover:border-teal-500/20 transition-all flex items-start gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-3xl font-black text-teal-400 shadow-2xl">{rec.id}</div>
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center justify-between">
                          <h4 className="text-2xl font-black text-white">{rec.title}</h4>
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${rec.impact === 'High' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'}`}>{rec.impact} Impact</span>
                       </div>
                       <p className="text-slate-400 leading-relaxed italic">{rec.description}</p>
                       <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest pt-4">
                          <div><span className="text-slate-600 block mb-1">Timeline</span> <span className="text-white">{rec.timeline}</span></div>
                          <div><span className="text-slate-600 block mb-1">Outcome</span> <span className="text-teal-400">{rec.outcome}</span></div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}

      {/* Persistent Empty State */}
      {flowStep === 'input' && !loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-8 opacity-40 grayscale">
           <div className="flex gap-6">
              <div className="p-4 bg-slate-800 rounded-2xl border border-white/5"><MessageCircle className="w-6 h-6" /></div>
              <div className="p-4 bg-slate-800 rounded-2xl border border-white/5"><TrendingUp className="w-6 h-6" /></div>
              <div className="p-4 bg-slate-800 rounded-2xl border border-white/5"><Monitor className="w-6 h-6" /></div>
           </div>
           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Awaiting Product Pulse Initiation</p>
        </div>
      )}

      {loading && (flowStep === 'results' || flowStep === 'sources') && (
        <div className="py-24 flex flex-col items-center justify-center space-y-8 animate-in fade-in">
           <div className="relative">
             <div className="w-24 h-24 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin"></div>
             <Activity className="absolute inset-0 m-auto w-8 h-8 text-teal-400 animate-pulse" />
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-xl font-black text-white uppercase tracking-tighter">Analyzing User Voices</h4>
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">Processing datapoints across clusters...</p>
           </div>
        </div>
      )}
    </div>
  );
};
