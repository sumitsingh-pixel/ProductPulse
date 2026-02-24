
import React from 'react';
import { ArrowRight, Target } from 'lucide-react';
import { KPI } from '../../types';

interface Props {
  kpis: KPI[];
  onToggle: (idx: number) => void;
  onConfirm: () => void;
  loading: boolean;
  domainName: string;
}

/**
 * Renders the AI-recommended KPIs for selection.
 * Highlights selected items with a teal glow theme.
 */
export const KPISelection: React.FC<Props> = ({ kpis, onToggle, onConfirm, loading, domainName }) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="text-center">
        <h2 className="text-4xl font-black text-white mb-3 tracking-tight">KPI Selection</h2>
        <p className="text-slate-400 font-medium">Calibrated for <span className="text-teal-400 font-bold uppercase tracking-widest text-xs px-2 py-1 bg-teal-500/10 rounded-lg border border-teal-500/20 ml-1">{domainName}</span></p>
      </div>
      
      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
        {kpis.map((kpi, idx) => (
          <div 
            key={idx} 
            onClick={() => onToggle(idx)} 
            className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${
              kpi.selected 
              ? 'bg-teal-500 border-teal-500 text-slate-900 shadow-2xl scale-[1.02]' 
              : 'glass-card border-white/5 text-white hover:border-teal-500/50'
            }`}
          >
            <div className={`absolute top-0 right-0 p-6 opacity-10 transition-transform ${kpi.selected ? 'scale-110' : 'scale-0'}`}>
              <Target className="w-12 h-12" />
            </div>
            <h4 className="font-black text-xl mb-4 pr-10 leading-tight tracking-tight">{kpi.kpi_name}</h4>
            <p className={`text-sm mb-8 leading-relaxed font-medium ${kpi.selected ? 'text-slate-800' : 'text-slate-400'}`}>
              {kpi.description}
            </p>
            <div className={`mt-auto space-y-3 pt-6 border-t ${kpi.selected ? 'border-slate-900/10' : 'border-white/5 text-slate-500'}`}>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span>Formula</span>
                <span className="font-bold opacity-80">{kpi.formula}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center pt-8">
        <button 
          onClick={onConfirm} 
          disabled={loading || !kpis.some(k => k.selected)} 
          className="px-16 py-5 bg-teal-500 text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-teal-500/20 flex items-center gap-3 hover:bg-teal-400 transition-all disabled:opacity-50"
        >
          {loading ? 'Synchronizing...' : 'Confirm Selection & AI Baseline'} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
