
import React from 'react';
import { ProjectContext, UserRole } from '../types';
// import { Briefcase, Plus, Calendar, ArrowRight, FolderOpen, FolderPlus, SearchX, Sparkles, LayoutDashboard, Globe, Smartphone } from 'lucide-react';
import { Briefcase, Plus, Calendar, ArrowRight, FolderOpen, FolderPlus, SearchX, Sparkles, LayoutDashboard, Globe, Smartphone, Trash2 } from 'lucide-react';

interface Props {
  projects: ProjectContext[];
  role: UserRole;
  onSelect: (project: ProjectContext) => void;
  onCreateNew: () => void;
  onInjectDemo?: (type: 'SaaS' | 'Mobile') => void;
  
}


export const ProjectSelector: React.FC<Props> = ({ projects, role, onSelect, onCreateNew, onInjectDemo }) => {
  if (projects.length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-20 flex flex-col items-center text-center space-y-12 animate-in fade-in duration-700">
        <div className="w-32 h-32 bg-slate-800/50 rounded-[3rem] flex items-center justify-center border border-white/5 shadow-2xl relative">
          <FolderPlus className="w-12 h-12 text-teal-500/50" />
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-teal-400 animate-pulse" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-white tracking-tighter">No Projects</h2>
          <p className="text-slate-400 font-medium text-lg max-w-xl mx-auto leading-relaxed">
            No active projects detected. Choose to initialize a new custom workspace or deploy a <span className="text-teal-400">Quick-Start Template</span> to explore the protocol.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
           <button 
             onClick={() => onInjectDemo?.('SaaS')}
             className="glass-card p-10 rounded-[3rem] border border-white/5 hover:border-teal-500/50 transition-all text-left group relative overflow-hidden"
           >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-teal-500/5 rounded-full group-hover:scale-150 transition-transform" />
              <div className="p-4 bg-slate-800 rounded-2xl text-teal-400 mb-6 w-fit group-hover:bg-teal-500 group-hover:text-slate-900 transition-all">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Deploy SaaS Ecosystem</h4>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Simulate a B2B SaaS environment with pre-configured GA4 KPIs and SEO audits.</p>
              <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-teal-500 uppercase tracking-widest group-hover:gap-4 transition-all">
                Quick Deploy <ArrowRight className="w-4 h-4" />
              </div>
           </button>

           <button 
             onClick={() => onInjectDemo?.('Mobile')}
             className="glass-card p-10 rounded-[3rem] border border-white/5 hover:border-indigo-500/50 transition-all text-left group relative overflow-hidden"
           >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full group-hover:scale-150 transition-transform" />
              <div className="p-4 bg-slate-800 rounded-2xl text-indigo-400 mb-6 w-fit group-hover:bg-indigo-500 group-hover:text-slate-900 transition-all">
                <Smartphone className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Mobile Growth Protocol</h4>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Targeted for App-first strategies focusing on retention and conversion funnels.</p>
              <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest group-hover:gap-4 transition-all">
                Quick Deploy <ArrowRight className="w-4 h-4" />
              </div>
           </button>
        </div>

        <div className="pt-8">
          <button
            onClick={onCreateNew}
            className="flex items-center justify-center gap-3 px-12 py-6 bg-teal-500 text-slate-900 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20 active:scale-95 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter">Proejct Dashboard</h2>
          <p className="text-slate-400 font-medium mt-3 text-lg">Select a Project from the list or Create New.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center justify-center gap-3 px-10 py-5 bg-teal-500 text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Create New Project
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {projects.map((p, idx) => (
          <button
            key={p.id || idx}
            onClick={() => onSelect(p)}
            className={`text-left glass-card p-10 rounded-[3.5rem] border-2 shadow-lg hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] hover:border-teal-500/30 hover:-translate-y-2 transition-all group flex flex-col h-full relative overflow-hidden ${p.is_demo ? 'border-teal-500/10' : 'border-white/5'}`}
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
               <FolderOpen className="w-32 h-32 -rotate-12" />
            </div>
            
            <div className="flex items-center justify-between mb-10">
              <div className={`p-4 rounded-2xl group-hover:bg-teal-500 group-hover:text-slate-900 transition-all shadow-2xl border border-white/5 ${p.is_demo ? 'bg-slate-800 text-teal-400' : 'bg-slate-800 text-slate-400'}`}>
                {p.type === 'Mobile' ? <Smartphone className="w-6 h-6" /> : <FolderOpen className="w-6 h-6" />}
              </div>
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.is_demo ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-slate-800/50 text-slate-500 border-white/5'}`}>
                {p.is_demo ? 'Simulation Node' :'*'}
              </div>
            </div>

            <div className="flex-1 relative z-10">
              <span className="text-[10px] font-black text-teal-500 uppercase tracking-[0.4em] mb-3 block">{p.type} Module</span>
              <h3 className="text-3xl font-black text-white leading-tight mb-4 group-hover:text-teal-400 transition-colors tracking-tight">{p.name}</h3>
              <p className="text-slate-400 font-semibold text-sm line-clamp-3 leading-relaxed mb-8">{p.description}</p>
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-teal-500 transition-colors">Open Project</span>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-2 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
