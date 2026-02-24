
import React from 'react';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { KPIDictionary } from '../../types';

// Fixed: Extended KPIDictionary instead of missing KPI type to ensure kpi_name and description are present
interface AnalyzedKPI extends KPIDictionary {
  current_value: string;
  trend: 'up' | 'down' | 'flat';
  status: 'good' | 'warning' | 'critical';
}

interface Props {
  stat: AnalyzedKPI;
}

/**
 * Renders a specialized KPI tile with status-based glow and trend indicators.
 * Used primarily in the GA4 DashboardView.
 */
export const KPIStatTile: React.FC<Props> = ({ stat }) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'good': return 'border-emerald-500/20 bg-slate-900/40';
      case 'warning': return 'border-amber-500/20 bg-slate-900/40';
      case 'critical': return 'border-rose-500/20 bg-slate-900/40';
      default: return 'border-slate-800 bg-slate-900/40';
    }
  };

  const getBadgeStyles = (status: string) => {
    switch (status) {
      case 'good': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'warning': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className={`p-6 rounded-[2rem] border shadow-2xl transition-all hover:shadow-teal-500/5 hover:-translate-y-1 glass-card ${getStatusStyles(stat.status)}`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getBadgeStyles(stat.status)}`}>
          {stat.status}
        </div>
        <div className={`${stat.trend === 'up' ? 'text-teal-400' : stat.trend === 'down' ? 'text-rose-400' : 'text-slate-500'}`}>
          {stat.trend === 'up' ? <TrendingUp className="w-5 h-5" /> : stat.trend === 'down' ? <TrendingDown className="w-5 h-5" /> : <TrendingDown className="w-5 h-5 rotate-90" />}
        </div>
      </div>
      
      <div className="space-y-1">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.kpi_name}</h4>
        <div className="text-3xl font-black text-white tracking-tighter">{stat.current_value}</div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-2">
        <Info className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" />
        <p className="text-[10px] text-slate-400 font-medium leading-tight">
          {stat.description}
        </p>
      </div>
    </div>
  );
};
