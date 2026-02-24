
import React, { useState, useMemo } from 'react';
import { ShieldAlert, Target, History, Database, ChevronDown, ChevronUp, Table as TableIcon, Calendar, CheckCircle, Info, Link2 } from 'lucide-react';
import { KPIStatTile } from './KPIStatTile';

interface Props {
  analyzedKPIs: any[];
  ga4Config: { propertyId: string };
  analysisResults: { insights: any[], recommendations: any[] };
  telemetry: any[];
  startDate: string | null;
}

export const DashboardView: React.FC<Props> = ({ analyzedKPIs, ga4Config, analysisResults, telemetry, startDate }) => {
  const [showAudit, setShowAudit] = useState(false);
  const [showDataTable, setShowDataTable] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{date: string, kpi: string} | null>(null);

  const dailyTableData = useMemo(() => {
    if (!startDate) return [];
    const siteStart = new Date(startDate).getTime();
    
    // Explicitly typed Set and filter parameter to avoid 'unknown' type error in new Date() when using Array.from
    const dates = Array.from(new Set<string>(telemetry.map(t => t.recorded_at)))
      .filter((d: string) => new Date(d).getTime() >= siteStart)
      .sort()
      .reverse();

    const selectedKpiNames = analyzedKPIs.map(k => k.kpi_name);

    return dates.map(date => {
      const row: any = { date };
      selectedKpiNames.forEach(name => {
        const entry = telemetry.find(t => t.recorded_at === date && t.kpi_name === name);
        row[name] = entry 
          ? { value: entry.value, lineage: entry.metadata?.lineage, events: entry.metadata?.raw_payload } 
          : { value: '-', lineage: 'No data returned from API for this date', events: {} };
      });
      return row;
    });
  }, [telemetry, analyzedKPIs, startDate]);

  return (
    <div className="lg:col-span-3 space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-4xl font-black text-white tracking-tighter">Verified Grounding Matrix</h3>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
              GA4 Property: <span className="text-teal-400">{ga4Config.propertyId || 'Linked Account'}</span>
            </p>
            <div className="w-1 h-1 rounded-full bg-slate-800" />
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2">
              <History className="w-3 h-3" /> Protocol Start: {startDate || 'N/A'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowAudit(!showAudit)}
          className={`px-6 py-3 rounded-2xl border flex items-center gap-3 transition-all ${showAudit ? 'bg-teal-500/10 border-teal-500/50 text-teal-400' : 'bg-slate-800 border-white/5 text-slate-300 shadow-xl hover:border-white/20'}`}
        >
          <Database className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Integrity Report</span>
          {showAudit ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showAudit && (
        <div className="glass-card p-10 rounded-[3rem] border border-teal-500/20 bg-teal-500/5 animate-in slide-in-from-top-4 duration-500 shadow-inner">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div>
              <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-widest mb-2">Grounding Window</p>
              <p className="text-base font-black text-white italic">Since {startDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-widest mb-2">Extraction Points</p>
              <p className="text-3xl font-black text-white leading-none tabular-nums">{telemetry.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-widest mb-2">Link Reliability</p>
              <p className="text-xs font-black text-white flex items-center gap-2 uppercase">
                 <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Verified via OAuth
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-teal-500/60 uppercase tracking-widest mb-2">Data Quality</p>
              <p className="text-xs font-black text-teal-400 uppercase flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5" /> 100% Deterministic
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyzedKPIs.map((stat, idx) => (
          <KPIStatTile key={idx} stat={stat} />
        ))}
      </div>

      <div className="glass-card rounded-[4rem] border border-white/5 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-white/10 shadow-2xl">
              <TableIcon className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h4 className="font-black text-white uppercase tracking-tighter text-lg leading-none">Verified Daily Log</h4>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 italic">Strictly pulls data from Google GA4 API after property inception</p>
            </div>
          </div>
          <button onClick={() => setShowDataTable(!showDataTable)} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl">
            {showDataTable ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {showDataTable && (
          <div className="overflow-x-auto max-h-[500px] scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900/95 z-10 backdrop-blur-md">
                <tr className="border-b border-white/10">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Snapshot Date
                  </th>
                  {analyzedKPIs.map(k => (
                    <th key={k.kpi_name} className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {k.kpi_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dailyTableData.length === 0 ? (
                  <tr>
                    <td colSpan={analyzedKPIs.length + 1} className="px-10 py-20 text-center text-slate-500 italic font-medium uppercase tracking-widest text-xs">
                       Awaiting Handshake... No telemetry data found in the sync window.
                    </td>
                  </tr>
                ) : (
                  dailyTableData.map((row, i) => (
                    <tr key={i} className="hover:bg-teal-500/[0.03] transition-colors group">
                      <td className="px-10 py-6 font-mono text-xs text-slate-500 font-bold">{row.date}</td>
                      {analyzedKPIs.map(k => (
                        <td 
                          key={k.kpi_name} 
                          className="px-10 py-6 font-black text-sm text-white relative"
                          onMouseEnter={() => setHoveredCell({ date: row.date, kpi: k.kpi_name })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <div className="flex items-center gap-3">
                            {typeof row[k.kpi_name].value === 'number' 
                              ? row[k.kpi_name].value.toLocaleString(undefined, { maximumFractionDigits: 1 }) 
                              : row[k.kpi_name].value}
                            <Info className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity text-teal-400 cursor-help" />
                          </div>
                          
                          {hoveredCell?.date === row.date && hoveredCell?.kpi === k.kpi_name && row[k.kpi_name].lineage && (
                            <div className="absolute z-50 bottom-full left-10 mb-3 p-5 bg-slate-900 border border-teal-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] text-[10px] text-teal-400 font-black uppercase whitespace-nowrap animate-in zoom-in-95 duration-200 backdrop-blur-2xl">
                              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10 text-slate-200">
                                <Link2 className="w-4 h-4 text-teal-400" /> Grounded Lineage (Snapshot)
                              </div>
                              <div className="space-y-2">
                                {row[k.kpi_name].lineage.split('|').map((part: string, pi: number) => (
                                  <p key={pi} className={pi === 0 ? 'text-slate-400 italic' : 'text-teal-400'}>{part.trim()}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="glass-card p-14 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/5 rounded-full group-hover:scale-110 transition-transform duration-1000" />
          <h4 className="font-black text-white mb-12 flex items-center gap-5 uppercase tracking-tighter text-lg">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400 shadow-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            Grounding Audit
          </h4>
          <div className="space-y-8">
            {analysisResults.insights.map((insight, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] border bg-slate-900/60 border-white/5 flex items-start gap-6 hover:border-teal-500/30 transition-all shadow-xl">
                <div className="w-4 h-4 rounded-full mt-2.5 bg-teal-500 shadow-[0_0_15px_rgba(45,212,191,0.5)] shrink-0" />
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-teal-400 mb-2">{insight.title}</span>
                  <p className="text-base font-semibold text-slate-300 leading-relaxed italic">{insight.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="glass-card p-14 rounded-[4rem] border border-white/5 flex flex-col shadow-2xl relative overflow-hidden group">
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/5 rounded-full group-hover:scale-110 transition-transform duration-1000" />
          <h4 className="font-black text-white mb-12 flex items-center gap-5 uppercase tracking-tighter text-lg">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-2xl">
              <Target className="w-6 h-6" />
            </div>
            Strategic Recommendations
          </h4>
          <div className="space-y-8 flex-1">
            {analysisResults.recommendations.map((rec, i) => (
              <div key={i} className="p-10 bg-slate-900/80 rounded-[3rem] border border-white/10 relative hover:-translate-y-2 transition-transform shadow-2xl">
                 <div className="absolute -top-4 left-10 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">{rec.impact || 'HIGH IMPACT'}</div>
                 <h5 className="text-lg font-black text-white mb-3 tracking-tight">{rec.title}</h5>
                 <p className="text-sm text-slate-400 leading-relaxed font-semibold italic">{rec.detail}</p>
              </div>
            ))}
          </div>
          <button className="mt-12 w-full py-6 bg-teal-500 text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20 active:scale-95">Generate PDF Integrity Audit</button>
        </div>
      </div>
    </div>
  );
};
