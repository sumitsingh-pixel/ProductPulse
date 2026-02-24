
import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { 
  BarChart3, LineChart, PieChart, Sparkles, 
  Settings2, Activity, Calendar, Zap, 
  AlertCircle, ChevronRight, Loader2, Database
} from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { getChartConfigFromNL } from '../../services/geminiService';
import { ChartConfig, KPIFact } from '../../types';

Chart.register(...registerables);

interface Props {
  tenantId: string;
  availableMetrics: string[];
}

export const DynamicDashboard: React.FC<Props> = ({ tenantId, availableMetrics }) => {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [loading, setLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [manualConfig, setManualConfig] = useState<ChartConfig>({
    type: 'line',
    metrics: [availableMetrics[0] || 'sessions'],
    days: 30,
    title: 'Custom Metric Insight'
  });

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const fetchDataAndRender = async (config: ChartConfig) => {
    setLoading(true);
    try {
      const data = await databaseService.getFactsForRange(tenantId, config.days);
      renderChart(data, config);
    } catch (err) {
      console.error("Dashboard Render Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (facts: KPIFact[], config: ChartConfig) => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = facts.map(f => format(parseISO(f.kpi_date), 'MMM dd'));
    const datasets = config.metrics.map((metric, idx) => {
      const colors = [
        'rgba(45, 212, 191, 1)', // Teal
        'rgba(99, 102, 241, 1)', // Indigo
        'rgba(244, 63, 94, 1)',  // Rose
        'rgba(245, 158, 11, 1)',  // Amber
      ];

      return {
        label: metric.replace(/_/g, ' ').toUpperCase(),
        data: facts.map(f => f.kpis[metric] || 0),
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length].replace('1)', '0.1)'),
        borderWidth: 3,
        tension: 0.4,
        fill: config.type === 'line'
      };
    });

    chartInstance.current = new Chart(chartRef.current, {
      type: config.type,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#94A3B8', font: { weight: 'bold', size: 10 } }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { size: 12, weight: 'black' },
            bodyFont: { size: 12, weight: 'bold' },
            padding: 12,
            cornerRadius: 12,
            callbacks: {
              label: (context: any) => {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  const val = context.parsed.y;
                  if (label.toLowerCase().includes('revenue')) {
                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
                  } else if (label.toLowerCase().includes('rate')) {
                    label += val.toFixed(2) + '%';
                  } else {
                    label += val.toLocaleString();
                  }
                }
                return label;
              }
            }
          }
        },
        scales: config.type !== 'pie' ? {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748B', font: { size: 10, weight: 'bold' } }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { size: 10, weight: 'bold' } }
          }
        } : undefined
      }
    });
  };

  const handleAiGeneration = async () => {
    if (!aiQuery.trim()) return;
    setLoading(true);
    try {
      const config = await getChartConfigFromNL(aiQuery, availableMetrics);
      setManualConfig(config); // Update manual inputs to match AI for visibility
      await fetchDataAndRender(config);
    } catch (err) {
      console.error("AI Insight Generation Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataAndRender(manualConfig);
    return () => chartInstance.current?.destroy();
  }, [tenantId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Controls Panel */}
        <div className="w-full lg:w-96 glass-card p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
          <div className="flex p-1 bg-slate-900 rounded-2xl border border-white/5">
            <button 
              onClick={() => setMode('manual')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-teal-500 text-slate-950' : 'text-slate-500 hover:text-white'}`}
            >
              <Settings2 className="w-4 h-4" /> Manual
            </button>
            <button 
              onClick={() => setMode('ai')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'ai' ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              <Sparkles className="w-4 h-4" /> AI Generator
            </button>
          </div>

          {mode === 'manual' ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Visualization Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'line', icon: <LineChart className="w-4 h-4" /> },
                    { id: 'bar', icon: <BarChart3 className="w-4 h-4" /> },
                    { id: 'pie', icon: <PieChart className="w-4 h-4" /> }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setManualConfig({ ...manualConfig, type: t.id as any })}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-center ${manualConfig.type === t.id ? 'bg-teal-500/10 border-teal-500 text-teal-400' : 'bg-slate-800 border-white/5 text-slate-500 hover:border-white/20'}`}
                    >
                      {t.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Metrics</label>
                <div className="flex flex-wrap gap-2">
                  {availableMetrics.map(m => (
                    <button
                      key={m}
                      onClick={() => {
                        const metrics = manualConfig.metrics.includes(m)
                          ? manualConfig.metrics.filter(item => item !== m)
                          : [...manualConfig.metrics, m];
                        if (metrics.length > 0) setManualConfig({ ...manualConfig, metrics });
                      }}
                      className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border transition-all ${manualConfig.metrics.includes(m) ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-slate-800 text-slate-500 border-white/5'}`}
                    >
                      {m.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Time Horizon</label>
                <select 
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-white font-black text-xs uppercase outline-none focus:border-teal-500 appearance-none cursor-pointer"
                  value={manualConfig.days}
                  onChange={e => setManualConfig({ ...manualConfig, days: parseInt(e.target.value) })}
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={90}>Last 90 Days</option>
                </select>
              </div>

              <button 
                onClick={() => fetchDataAndRender(manualConfig)}
                disabled={loading}
                className="w-full py-5 bg-teal-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-teal-500/20 hover:bg-teal-400 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Activity className="w-5 h-5" />}
                Re-Synthesize View
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Natural Language Query</label>
                <textarea 
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-5 text-white font-bold text-xs outline-none focus:border-indigo-500 h-40 resize-none placeholder:text-slate-600"
                  placeholder="e.g. 'Show me a comparison of revenue and conversion rate for the last month as a line chart'"
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                />
              </div>

              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                  <Zap className="w-3 h-3" /> Grounding Engine
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
                  The model will select the most appropriate timeframe and chart type based on your intent.
                </p>
              </div>

              <button 
                onClick={handleAiGeneration}
                disabled={loading || !aiQuery.trim()}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                Generate AI Insight
              </button>
            </div>
          )}
        </div>

        {/* Visualization Canvas */}
        <div className="flex-1 glass-card p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                <Activity className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{manualConfig.title}</h3>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Real-time GA4 Telemetry
                </p>
              </div>
            </div>
            
            <div className="px-4 py-2 bg-slate-900 border border-white/5 rounded-full flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grounding Active</span>
            </div>
          </div>

          <div className="flex-1 relative">
            {loading && (
              <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                <div className="flex flex-col items-center gap-4">
                   <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                   <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest animate-pulse">Recalibrating Matrix...</span>
                </div>
              </div>
            )}
            <canvas ref={chartRef} />
          </div>

          <div className="mt-8 p-6 bg-slate-950/50 rounded-3xl border border-white/5 flex items-center gap-6">
            <div className="p-3 bg-slate-800 rounded-xl text-teal-400">
               <Database className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Source Lineage</p>
              <p className="text-[11px] text-slate-300 font-bold italic leading-relaxed">
                Visualizing <span className="text-teal-400 font-black">{manualConfig.metrics.length} metrics</span> over a <span className="text-teal-400 font-black">{manualConfig.days}-day</span> Data grounded in Supabase `kpi_daily_facts` node.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
