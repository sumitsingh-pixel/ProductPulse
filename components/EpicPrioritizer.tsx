
import React, { useState, useRef } from 'react';
import { ProjectContext, EpicStory, UserRole } from '../types';
import { COMPLIANCE_OPTIONS } from '../constants';
import { getPrioritizedBacklog } from '../services/geminiService';
// Fix: Added missing icon imports (Loader2, Sparkles, X) from lucide-react
import { FileUp, ListTodo, Target, ShieldCheck, ExternalLink, Calculator, Layers, ArrowRight, Check, AlertCircle, Loader2, Sparkles, X } from 'lucide-react';

interface Props {
  project: ProjectContext;
  role: UserRole;
}

enum Step {
  CONTEXT,
  MARKET,
  ANALYSIS,
  RESULTS
}

export const EpicPrioritizer: React.FC<Props> = ({ project, role }) => {
  const [step, setStep] = useState<Step>(Step.CONTEXT);
  const [contextInfo, setContextInfo] = useState({
    domain: 'Enterprise B2B',
    goals: '',
    challenges: ''
  });
  const [marketInfo, setMarketInfo] = useState({
    isInternal: true,
    competitors: ['', '', ''],
    compliance: [] as string[]
  });
  const [method, setMethod] = useState<'RICE' | 'MoSCoW'>('MoSCoW');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{summary: string, prioritizedItems: any[]}>({ summary: '', prioritizedItems: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleCompliance = (id: string) => {
    setMarketInfo(prev => ({
      ...prev,
      compliance: prev.compliance.includes(id) 
        ? prev.compliance.filter(i => i !== id)
        : [...prev.compliance, id]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log(`[Prioritizer] Uploading backlog: ${file.name}`);
      // In a real flow, we would parse and populate the stories list
      // For this implementation, we proceed to run the AI engine
      handleRunPrioritization();
    }
  };

  const handleRunPrioritization = async () => {
    setLoading(true);
    try {
      // High-quality mock backlog if no file uploaded
      const mockStories: EpicStory[] = [
        { id: 'EPIC-1', title: 'User Authentication System', type: 'Epic', description: 'Enable secure login/logout and SSO' },
        { id: 'EPIC-2', title: 'Analytics Dashboard', type: 'Epic', description: 'Visualize real-time user data' },
        { id: 'EPIC-3', title: 'Payment Integration', type: 'Epic', description: 'Integrate Stripe and PayPal for checkout' },
        { id: 'STORY-4', title: 'Password Reset Flow', type: 'Story', description: 'Users should be able to reset forgotten passwords' },
        { id: 'STORY-5', title: 'Export to CSV', type: 'Story', description: 'Download analytics data locally' }
      ];

      const fullContext = JSON.stringify({ ...contextInfo, ...marketInfo });
      const prioritized = await getPrioritizedBacklog(project, mockStories, method, fullContext);
      setResults(prioritized);
      setStep(Step.RESULTS);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case Step.CONTEXT:
        return (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="glass-card p-12 rounded-[2.5rem] shadow-2xl border border-white/10">
              <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4 tracking-tight">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                  <Target className="w-7 h-7" />
                </div>
                Context Alignment
              </h2>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Product Domain</label>
                  <select 
                    value={contextInfo.domain}
                    onChange={e => setContextInfo({...contextInfo, domain: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-800 bg-slate-900/50 text-white font-bold focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="FinTech" className="bg-slate-900">FinTech</option>
                    <option value="HealthTech" className="bg-slate-900">HealthTech</option>
                    <option value="EdTech" className="bg-slate-900">EdTech</option>
                    <option value="E-commerce" className="bg-slate-900">E-commerce</option>
                    <option value="Enterprise B2B" className="bg-slate-900">Enterprise B2B</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Key Business Goals</label>
                  <textarea 
                    rows={3} 
                    value={contextInfo.goals}
                    onChange={e => setContextInfo({...contextInfo, goals: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-800 bg-slate-900/50 text-white font-bold focus:border-emerald-500 outline-none placeholder:text-slate-600 resize-none" 
                    placeholder="e.g. Increase user retention by 20% in Q3..." 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Key Challenges</label>
                  <textarea 
                    rows={3} 
                    value={contextInfo.challenges}
                    onChange={e => setContextInfo({...contextInfo, challenges: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-800 bg-slate-900/50 text-white font-bold focus:border-emerald-500 outline-none placeholder:text-slate-600 resize-none" 
                    placeholder="List top bottlenecks or dependencies..." 
                  />
                </div>
                <button 
                  onClick={() => setStep(Step.MARKET)}
                  className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/10 mt-4"
                >
                  Define Product Relevance <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );

      case Step.MARKET:
        return (
          <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
            <div className="glass-card p-12 rounded-[2.5rem] shadow-2xl border border-white/10">
              <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4 tracking-tight">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                Market Guardrails
              </h2>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Product Placement</label>
                  <div className="flex gap-6">
                    <button 
                      onClick={() => setMarketInfo({...marketInfo, isInternal: true})}
                      className={`flex-1 py-5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${marketInfo.isInternal ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-inner' : 'border-slate-800 text-slate-300 bg-slate-900/50 hover:bg-slate-800'}`}
                    >
                      Internal Product
                    </button>
                    <button 
                      onClick={() => setMarketInfo({...marketInfo, isInternal: false})}
                      className={`flex-1 py-5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all ${!marketInfo.isInternal ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-inner' : 'border-slate-800 text-slate-300 bg-slate-900/50 hover:bg-slate-800'}`}
                    >
                      Market Facing
                    </button>
                  </div>
                </div>

                {!marketInfo.isInternal && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Competitor Reference URLs (Max 3)</label>
                    <div className="space-y-3">
                      {marketInfo.competitors.map((c, i) => (
                        <div key={i} className="relative group">
                          <input 
                            type="text" 
                            className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-slate-800 bg-slate-900/50 text-white font-bold focus:border-emerald-500 outline-none shadow-sm transition-all" 
                            placeholder="https://competitor.com"
                            value={c}
                            onChange={e => {
                              const newC = [...marketInfo.competitors];
                              newC[i] = e.target.value;
                              setMarketInfo({...marketInfo, competitors: newC});
                            }}
                          />
                          <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Compliance Requirements</label>
                  <div className="grid grid-cols-2 gap-4">
                    {COMPLIANCE_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => toggleCompliance(opt.id)}
                        className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${marketInfo.compliance.includes(opt.id) ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-black shadow-sm' : 'border-slate-800 text-slate-300 bg-slate-900/50 hover:border-slate-700'}`}
                      >
                        <div className={`p-2 rounded-lg ${marketInfo.compliance.includes(opt.id) ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                          {opt.icon}
                        </div>
                        <span className="text-xs uppercase tracking-widest font-bold">{opt.name}</span>
                        {marketInfo.compliance.includes(opt.id) && <Check className="w-5 h-5 ml-auto text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setStep(Step.ANALYSIS)}
                  className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-500 shadow-xl shadow-emerald-500/10 mt-6"
                >
                  Configure Engine <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );

      case Step.ANALYSIS:
        return (
          <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right duration-500">
            <div className="glass-card p-12 rounded-[3rem] shadow-2xl border border-white/10">
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight text-center">Backlog Import</h2>
              <p className="text-slate-400 text-center font-medium mb-10 italic">Define strategy using MoSCoW or RICE framework</p>
              
              <div className="space-y-8">
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".csv,.json,.txt"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 rounded-[2.5rem] py-16 flex flex-col items-center justify-center bg-slate-900/40 hover:bg-slate-800/40 transition-all cursor-pointer group shadow-inner"
                >
                  <FileUp className="w-16 h-16 text-slate-600 mb-4 group-hover:scale-110 group-hover:text-emerald-400 transition-all" />
                  <p className="font-black text-white uppercase tracking-widest text-xs">Drop Backlog or JIRA Export</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">CSV, JSON, or Text Ingestion Protocol</p>
                </div>

                <div className="p-8 bg-slate-900/40 rounded-[2.5rem] border-2 border-slate-800">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">Prioritization Methodology</label>
                  <div className="grid grid-cols-2 gap-6">
                    <button 
                      onClick={() => setMethod('MoSCoW')}
                      className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${method === 'MoSCoW' ? 'border-emerald-500 bg-emerald-500/5 shadow-xl scale-105' : 'border-transparent bg-slate-800/40 hover:bg-slate-800'}`}
                    >
                      <Layers className={`w-10 h-10 ${method === 'MoSCoW' ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${method === 'MoSCoW' ? 'text-white' : 'text-slate-400'}`}>MoSCoW Model</span>
                    </button>
                    <button 
                      onClick={() => setMethod('RICE')}
                      className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${method === 'RICE' ? 'border-emerald-500 bg-emerald-500/5 shadow-xl scale-105' : 'border-transparent bg-slate-800/40 hover:bg-slate-800'}`}
                    >
                      <Calculator className={`w-10 h-10 ${method === 'RICE' ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${method === 'RICE' ? 'text-white' : 'text-slate-400'}`}>RICE Scoring</span>
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleRunPrioritization}
                  disabled={loading}
                  className="w-full bg-slate-100 text-slate-950 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-white transition-all shadow-2xl disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Calculator className="w-5 h-5" />}
                  Execute Strategic Engine
                </button>
              </div>
            </div>
          </div>
        );

      case Step.RESULTS:
        const mustHaves = results.prioritizedItems.filter(i => i.bucket?.startsWith('Must'));
        const shouldHaves = results.prioritizedItems.filter(i => i.bucket?.startsWith('Should'));
        const couldHaves = results.prioritizedItems.filter(i => i.bucket?.startsWith('Could'));
        const wontHaves = results.prioritizedItems.filter(i => i.bucket?.startsWith('Won\'t') || i.bucket?.startsWith('Wont'));

        return (
          <div className="space-y-12 animate-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tight uppercase">Prioritization Results</h2>
                <p className="text-sm text-slate-400 font-medium mt-1 uppercase tracking-widest">Model: <span className="text-emerald-400 font-black">{method} Methodology</span></p>
              </div>
              <button onClick={() => setStep(Step.ANALYSIS)} className="px-8 py-3 bg-slate-800 border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-300 hover:bg-slate-700 transition-all shadow-sm">Recalibrate Parameters</button>
            </div>

            {results.summary && (
              <div className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem] flex items-start gap-6">
                <AlertCircle className="w-8 h-8 text-indigo-400 shrink-0" />
                <div>
                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Strategic AI Summary</h4>
                   <p className="text-sm text-slate-300 font-medium leading-relaxed italic">{results.summary}</p>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-12">
               {/* Must Haves Column */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-rose-500/30 pb-4">
                     <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500"><ShieldCheck className="w-5 h-5" /></div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Must-Have <span className="text-[10px] text-slate-500 ml-2">Critical Path</span></h3>
                  </div>
                  <div className="space-y-4">
                    {mustHaves.length > 0 ? mustHaves.map((item, idx) => (
                      <div key={idx} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-rose-500/20 transition-all group">
                         <div className="flex justify-between items-start mb-3">
                            <h4 className="font-black text-white text-base group-hover:text-rose-400 transition-colors">{item.title}</h4>
                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-800 text-slate-500 rounded uppercase">{item.id}</span>
                         </div>
                         <p className="text-xs text-slate-400 font-medium leading-relaxed italic">{item.rationale}</p>
                      </div>
                    )) : <p className="text-xs text-slate-600 font-black uppercase text-center py-10 border border-dashed border-slate-800 rounded-2xl">No items prioritized here</p>}
                  </div>
               </div>

               {/* Should Haves Column */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-blue-500/30 pb-4">
                     <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Layers className="w-5 h-5" /></div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Should-Have <span className="text-[10px] text-slate-500 ml-2">Important</span></h3>
                  </div>
                  <div className="space-y-4">
                    {shouldHaves.length > 0 ? shouldHaves.map((item, idx) => (
                      <div key={idx} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all group">
                         <div className="flex justify-between items-start mb-3">
                            <h4 className="font-black text-white text-base group-hover:text-blue-400 transition-colors">{item.title}</h4>
                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-800 text-slate-500 rounded uppercase">{item.id}</span>
                         </div>
                         <p className="text-xs text-slate-400 font-medium leading-relaxed italic">{item.rationale}</p>
                      </div>
                    )) : <p className="text-xs text-slate-600 font-black uppercase text-center py-10 border border-dashed border-slate-800 rounded-2xl">No items prioritized here</p>}
                  </div>
               </div>

               {/* Could Haves Column */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-teal-500/30 pb-4">
                     <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400"><Sparkles className="w-5 h-5" /></div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Could-Have <span className="text-[10px] text-slate-500 ml-2">Nice-to-Have</span></h3>
                  </div>
                  <div className="space-y-4">
                    {couldHaves.length > 0 ? couldHaves.map((item, idx) => (
                      <div key={idx} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-teal-500/20 transition-all group">
                         <div className="flex justify-between items-start mb-3">
                            <h4 className="font-black text-white text-base group-hover:text-teal-400 transition-colors">{item.title}</h4>
                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-800 text-slate-500 rounded uppercase">{item.id}</span>
                         </div>
                         <p className="text-xs text-slate-400 font-medium leading-relaxed italic">{item.rationale}</p>
                      </div>
                    )) : <p className="text-xs text-slate-600 font-black uppercase text-center py-10 border border-dashed border-slate-800 rounded-2xl">No items prioritized here</p>}
                  </div>
               </div>

               {/* Wont Haves Column */}
               <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
                     <div className="p-2 bg-slate-800 rounded-lg text-slate-500"><X className="w-5 h-5" /></div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Won't-Have <span className="text-[10px] text-slate-500 ml-2">Out of Scope</span></h3>
                  </div>
                  <div className="space-y-4">
                    {wontHaves.length > 0 ? wontHaves.map((item, idx) => (
                      <div key={idx} className="glass-card p-6 rounded-2xl border border-white/5 opacity-60 hover:opacity-100 transition-all group">
                         <div className="flex justify-between items-start mb-3">
                            <h4 className="font-black text-white text-base group-hover:text-slate-400 transition-colors">{item.title}</h4>
                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-800 text-slate-500 rounded uppercase">{item.id}</span>
                         </div>
                         <p className="text-xs text-slate-400 font-medium leading-relaxed italic">{item.rationale}</p>
                      </div>
                    )) : <p className="text-xs text-slate-600 font-black uppercase text-center py-10 border border-dashed border-slate-800 rounded-2xl">No items prioritized here</p>}
                  </div>
               </div>
            </div>

            <div className="pt-10 flex justify-center">
               <button className="px-12 py-5 bg-teal-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-teal-400 transition-all">
                  <ExternalLink className="w-5 h-5" /> Export Strategic Mapping
               </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[70vh]">
      {loading && step !== Step.RESULTS && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center space-y-8 animate-in fade-in">
           <div className="relative">
             <div className="w-24 h-24 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
             <Calculator className="absolute inset-0 m-auto w-8 h-8 text-emerald-400 animate-pulse" />
           </div>
           <div className="text-center space-y-2">
             <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Strategic Engine Processing</h4>
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] animate-pulse">AI Agent: Agile Coach applying MoSCoW logic...</p>
           </div>
        </div>
      )}
      {renderStep()}
    </div>
  );
};
