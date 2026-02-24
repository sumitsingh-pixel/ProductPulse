
import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { KPIThreshold } from '../../types';

interface Props {
  thresholds: KPIThreshold[];
  onUpdate: (idx: number, field: keyof KPIThreshold, val: any) => void;
  onFinalize: () => void;
  loading: boolean;
  domainName: string;
}

/**
 * A specialized data-grid for calibrating AI-suggested thresholds.
 * Essential for defining success/failure guardrails before dashboard generation.
 */
export const ThresholdEditor: React.FC<Props> = ({ thresholds, onUpdate, onFinalize, loading, domainName }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Threshold Definition</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Calibrating guardrails for <span className="text-teal-400 font-bold">{domainName}</span> architecture.</p>
        </div>
        <button 
          onClick={onFinalize} 
          disabled={loading} 
          className="px-8 py-4 bg-teal-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-teal-400 transition-all"
        >
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="w-4 h-4" />}
          Finalize Intelligence Dashboard
        </button>
      </div>
      
      <div className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-white/5">
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-8 py-6">Indicator</th>
                <th className="px-8 py-6">Target</th>
                <th className="px-8 py-6">Warning</th>
                <th className="px-8 py-6">Failure</th>
                <th className="px-8 py-6">Logic</th>
                <th className="px-8 py-6">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {thresholds.map((t, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6 text-white font-black text-sm">{t.kpi_name}</td>
                  <td className="px-8 py-6">
                    <input 
                      type="number" 
                      className="w-24 bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold text-xs" 
                      value={t.target_value} 
                      onChange={e => onUpdate(i, 'target_value', parseFloat(e.target.value))} 
                    />
                  </td>
                  <td className="px-8 py-6">
                    <input 
                      type="number" 
                      className="w-24 bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold text-xs" 
                      value={t.warning_threshold} 
                      onChange={e => onUpdate(i, 'warning_threshold', parseFloat(e.target.value))} 
                    />
                  </td>
                  <td className="px-8 py-6">
                    <input 
                      type="number" 
                      className="w-24 bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white font-bold text-xs" 
                      value={t.failure_threshold} 
                      onChange={e => onUpdate(i, 'failure_threshold', parseFloat(e.target.value))} 
                    />
                  </td>
                  <td className="px-8 py-6">
                    <select 
                      className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white text-xs" 
                      value={t.threshold_type} 
                      onChange={e => onUpdate(i, 'threshold_type', e.target.value as '>'|'<')}
                    >
                      <option value=">">Above</option>
                      <option value="<">Below</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      t.alert_priority === 'High' ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {t.alert_priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
