
import React, { useState } from 'react';
import { ProjectContext } from '../types';
import { Briefcase, ArrowRight, Layers } from 'lucide-react';

interface Props {
  onComplete: (context: ProjectContext) => void;
}

export const ProjectSetup: React.FC<Props> = ({ onComplete }) => {
  const [formData, setFormData] = useState<Omit<ProjectContext, 'id'>>({
    name: '',
    type: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.type && formData.description) {
      onComplete(formData as ProjectContext);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full glass-card rounded-[3.5rem] p-12 shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
        
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-slate-800 border border-white/10 rounded-2xl text-teal-400 shadow-2xl">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-2">Project Setup</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Initialize context</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Project Name</label>
            <input
              type="text"
              required
              className="w-full px-6 py-5 rounded-2xl border-2 border-slate-800 bg-slate-900/50 text-white font-bold placeholder:text-slate-700 focus:border-teal-500 focus:ring-0 outline-none transition-all shadow-inner"
              placeholder="Material Plus"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Project Archetype</label>
            <div className="relative">
              <select
                required
                className="w-full px-6 py-5 rounded-2xl border-2 border-slate-800 bg-slate-900/50 text-white font-bold focus:border-teal-500 focus:ring-0 outline-none transition-all appearance-none shadow-inner cursor-pointer"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="" className="text-slate-700">Select Project Archetype...</option>
                <option value="SaaS" className="text-slate-200">B2B SaaS Engine</option>
                <option value="Mobile" className="text-slate-200">Native Ecosystem</option>
                <option value="Internal" className="text-slate-200">Enterprise Protocol</option>
                <option value="Web" className="text-slate-200">Unified Web Surface</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700">
                <ArrowRight className="w-5 h-5 rotate-90" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Project Description</label>
            <textarea
              required
              rows={4}
              className="w-full px-6 py-5 rounded-2xl border-2 border-slate-800 bg-slate-900/50 text-white font-bold placeholder:text-slate-700 focus:border-teal-500 focus:ring-0 outline-none transition-all shadow-inner resize-none"
              placeholder="Define high-level objectives and constraints..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-teal-500 text-slate-900 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20 mt-4 group"
          >
            Create Project <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};
