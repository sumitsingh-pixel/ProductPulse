
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Upload, FileText, Play, CheckCircle2, AlertCircle, 
  BarChart, Globe, Smartphone, Monitor, Lock, 
  Download, ChevronDown, ChevronUp, ExternalLink, 
  Zap, Info, Clock, Loader2, FileSpreadsheet, FileBox, Activity
} from 'lucide-react';
import { generateLighthouseReport } from '../services/geminiService';
import { LighthouseReport, UserRole } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Props {
  role: UserRole;
}

export const SEOAnalyzer: React.FC<Props> = ({ role }) => {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [reports, setReports] = useState<LighthouseReport[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  const stages = [
    "Establishing handshake with simulation nodes...",
    "Scanning URL headers and security protocols...",
    "Analyzing Cumulative Layout Shift (CLS)...",
    "Measuring Largest Contentful Paint (LCP)...",
    "Synthesizing SEO recommendations...",
   
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % stages.length);
      }, 2000);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleRunScan = async () => {
    if (!urls || role === UserRole.VIEWER) return;
    setLoading(true);
    setReports([]); // Clear previous to show we're fresh
    try {
      const urlList = urls.split(',').map(u => u.trim()).filter(u => u);
      if (urlList.length === 0) {
        alert("Please provide at least one valid URL.");
        setLoading(false);
        return;
      }
      const results = await generateLighthouseReport(urlList);
      setReports(results);
    } catch (err) {
      console.error(err);
      alert(" audit failed. Please verify your connection to simulation nodes.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  const averages = useMemo(() => {
    if (reports.length === 0) return null;
    const desktop = reports.filter(r => r.device === 'Desktop');
    const mobile = reports.filter(r => r.device === 'Mobile');

    const calc = (arr: LighthouseReport[]) => {
      if (arr.length === 0) return { perf: 0, acc: 0, seo: 0, lcp: 0 };
      return {
        perf: Math.round(arr.reduce((s, r) => s + r.performance, 0) / arr.length),
        acc: Math.round(arr.reduce((s, r) => s + r.accessibility, 0) / arr.length),
        seo: Math.round(arr.reduce((s, r) => s + r.seo, 0) / arr.length),
        lcp: Math.round(arr.reduce((s, r) => s + r.lcp, 0) / arr.length),
      };
    };

    return {
      desktop: calc(desktop),
      mobile: calc(mobile)
    };
  }, [reports]);

  const exportCSV = () => {
    const headers = ['URL', 'Device', 'Performance', 'Accessibility', 'SEO', 'Best Practices', 'LCP (ms)', 'FCP (ms)', 'CLS', 'FID (ms)'];
    const rows = reports.map(r => [
      r.url, r.device, r.performance, r.accessibility, r.seo, r.bestPractices, r.lcp, r.fcp, r.cls, r.fid
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Lighthouse_Report_${new Date().getTime()}.csv`);
    link.click();
    setShowExportMenu(false);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reports);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lighthouse Audits");
    XLSX.writeFile(workbook, `SEO_Report_${new Date().getTime()}.xlsx`);
    setShowExportMenu(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(20);
    doc.text(" SEO & Lighthouse Audit", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = reports.map(r => [
      r.url,
      r.device,
      r.performance,
      r.accessibility,
      r.seo,
      r.lcp + 'ms'
    ]);

    doc.autoTable({
      startY: 40,
      head: [['URL', 'Device', 'Perf', 'Acc', 'SEO', 'LCP']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [45, 212, 191] }
    });

    doc.save(`ProductPulse_SEO_Audit_${new Date().getTime()}.pdf`);
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Search & Config Header */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
          {role === UserRole.VIEWER && (
            <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8 text-center">
              <div className="space-y-4">
                <div className="p-4 bg-slate-800 rounded-2xl mx-auto w-fit border border-white/10"><Lock className="w-10 h-10 text-teal-400" /></div>
                <h4 className="text-xl font-black text-white uppercase tracking-tighter">Strategic Lock Active</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">Editor privileges required to initialize new telemetry scans.</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-slate-800 rounded-2xl text-teal-400 border border-white/5"><Globe className="w-7 h-7" /></div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Audit Configuration</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Provide URLs for comprehensive Lighthouse mapping</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <textarea
                className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-800 bg-slate-900/50 text-white font-bold placeholder:text-slate-700 focus:border-teal-500 outline-none transition-all h-32 resize-none shadow-inner"
                placeholder="https://example.com, https://app.example.io"
                value={urls}
                onChange={e => setUrls(e.target.value)}
                disabled={role === UserRole.VIEWER}
              />
              <div className="absolute bottom-4 right-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {urls.split(',').filter(u => u.trim()).length} URLs detected
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleRunScan}
                disabled={loading || !urls.trim() || role === UserRole.VIEWER}
                className="flex-1 bg-teal-500 text-slate-950 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                Initiate Audit
              </button>
              
              <button className="px-10 py-5 glass-card border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                <Upload className="w-5 h-5" />
                Bulk CSV Upload
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border border-white/10 flex flex-col justify-center text-center space-y-6 relative overflow-hidden shadow-2xl group">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-teal-500/5 rounded-full group-hover:scale-110 transition-transform duration-1000" />
          <div className="w-20 h-20 bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto border border-white/5 shadow-2xl text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all">
            <BarChart className="w-10 h-10" />
          </div>
          <div className="space-y-2 relative z-10">
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter">AI Lighthouse Engine</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">WIP - Benchmarking capabilities with peers.</p>
          </div>
        </div>
      </div>

      {/* Loading State Overlay */}
      {loading && (
        <div className="py-20 flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
           <div className="relative">
             <div className="w-24 h-24 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin"></div>
             <Activity className="absolute inset-0 m-auto w-8 h-8 text-teal-400 animate-pulse" />
           </div>
           <div className="space-y-4">
              <h4 className="text-xl font-black text-white uppercase tracking-tighter"> Synthesis in Progress</h4>
              <div className="flex flex-col items-center gap-2">
                 <p className="text-xs font-black text-teal-500 uppercase tracking-[0.2em] animate-pulse">
                   {stages[loadingStage]}
                 </p>
                 <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-teal-500 transition-all duration-1000 ease-out" 
                      style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}
                    />
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && averages && reports.length > 0 && (
        <div className="grid md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-700">
          {/* Desktop Summary */}
          <div className="glass-card p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-8 relative overflow-hidden">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-800 rounded-xl text-indigo-400"><Monitor className="w-6 h-6" /></div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter">Desktop Average</h4>
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">Aggregated Data</span>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Perf', val: averages.desktop.perf },
                  { label: 'Acc', val: averages.desktop.acc },
                  { label: 'SEO', val: averages.desktop.seo },
                  { label: 'LCP', val: (averages.desktop.lcp / 1000).toFixed(1) + 's', isMetric: true }
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-slate-900/40 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black ${typeof stat.val === 'number' ? getScoreColor(stat.val).split(' ')[0] : 'text-white'}`}>{stat.val}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Mobile Summary */}
          <div className="glass-card p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-8 relative overflow-hidden">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-800 rounded-xl text-teal-400"><Smartphone className="w-6 h-6" /></div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter">Mobile Average</h4>
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">Aggregated Data</span>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Perf', val: averages.mobile.perf },
                  { label: 'Acc', val: averages.mobile.acc },
                  { label: 'SEO', val: averages.mobile.seo },
                  { label: 'LCP', val: (averages.mobile.lcp / 1000).toFixed(1) + 's', isMetric: true }
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-slate-900/40 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black ${typeof stat.val === 'number' ? getScoreColor(stat.val).split(' ')[0] : 'text-white'}`}>{stat.val}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {!loading && reports.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
          <div className="flex items-center justify-between px-4">
             <div>
               <h4 className="text-3xl font-black text-white tracking-tighter"> Audit Report</h4>
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                 <Clock className="w-3 h-3" /> Latest Scan: {new Date().toLocaleString()}
               </p>
             </div>

             <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-slate-700 transition-all border border-white/5 shadow-xl"
                >
                  <Download className="w-4 h-4" /> Export Report <ChevronDown className="w-4 h-4" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-3 w-56 glass-card rounded-2xl border border-white/10 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <button onClick={exportPDF} className="w-full text-left px-6 py-4 hover:bg-white/5 flex items-center gap-3 transition-colors">
                      <FileBox className="w-4 h-4 text-rose-500" />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Portable PDF</span>
                    </button>
                    <button onClick={exportExcel} className="w-full text-left px-6 py-4 hover:bg-white/5 flex items-center gap-3 transition-colors">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Excel Workbook</span>
                    </button>
                    <button onClick={exportCSV} className="w-full text-left px-6 py-4 hover:bg-white/5 flex items-center gap-3 transition-colors">
                      <FileText className="w-4 h-4 text-teal-500" />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Raw CSV Data</span>
                    </button>
                  </div>
                )}
             </div>
          </div>

          <div className="glass-card rounded-[3.5rem] border border-white/5 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/60 backdrop-blur-md">
                  <tr className="border-b border-white/10">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">URL & Device Context</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Perf</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acc</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">SEO</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">LCP</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reports.map((report, idx) => (
                    <React.Fragment key={idx}>
                      <tr className={`hover:bg-teal-500/[0.02] transition-colors group ${expandedUrl === `${report.url}-${report.device}` ? 'bg-teal-500/[0.05]' : ''}`}>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${report.device === 'Desktop' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-teal-500/10 text-teal-400'}`}>
                              {report.device === 'Desktop' ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white truncate max-w-[200px] sm:max-w-md tracking-tight">{report.url}</span>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{report.device} Telemetry</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto text-xs font-black shadow-xl ${getScoreColor(report.performance)}`}>
                            {report.performance}
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto text-xs font-black shadow-xl ${getScoreColor(report.accessibility)}`}>
                            {report.accessibility}
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto text-xs font-black shadow-xl ${getScoreColor(report.seo)}`}>
                            {report.seo}
                          </div>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-black ${report.lcp < 2500 ? 'text-emerald-400' : 'text-rose-400'}`}>{(report.lcp / 1000).toFixed(1)}s</span>
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Grounded</span>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <button 
                            onClick={() => setExpandedUrl(expandedUrl === `${report.url}-${report.device}` ? null : `${report.url}-${report.device}`)}
                            className="flex items-center gap-2 text-[10px] font-black text-teal-400 hover:text-white transition-all uppercase tracking-widest"
                          >
                            Details {expandedUrl === `${report.url}-${report.device}` ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>
                      {expandedUrl === `${report.url}-${report.device}` && (
                        <tr className="bg-slate-950/50 animate-in slide-in-from-top-4 duration-300">
                          <td colSpan={6} className="px-10 py-10">
                             <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                   <div className="flex items-center gap-3 mb-2">
                                      <Info className="w-5 h-5 text-teal-400" />
                                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Web Vitals Discovery</h5>
                                   </div>
                                   <div className="grid grid-cols-2 gap-4">
                                      {[
                                        { label: 'FCP', val: report.fcp + 'ms', desc: 'First Contentful Paint' },
                                        { label: 'FID', val: report.fid + 'ms', desc: 'First Input Delay' },
                                        { label: 'CLS', val: report.cls.toFixed(3), desc: 'Layout Shift' },
                                        { label: 'Practices', val: report.bestPractices + '%', desc: 'Best Practices Score' }
                                      ].map((v, i) => (
                                        <div key={i} className="p-4 bg-slate-900/80 rounded-2xl border border-white/5">
                                           <div className="flex items-center justify-between mb-1">
                                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{v.label}</span>
                                              <span className="text-[11px] font-black text-white">{v.val}</span>
                                           </div>
                                           <p className="text-[8px] text-slate-600 font-bold uppercase">{v.desc}</p>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                                <div className="space-y-6">
                                   <div className="flex items-center gap-3 mb-2">
                                      <Zap className="w-5 h-5 text-amber-400" />
                                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest"> Recommendations</h5>
                                   </div>
                                   <div className="space-y-3">
                                      {report.recommendations.map((rec, i) => (
                                        <div key={i} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                                           <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                           <p className="text-[11px] font-semibold text-slate-300 leading-relaxed italic">{rec}</p>
                                        </div>
                                      ))}
                                   </div>
                                   <button className="w-full py-4 bg-slate-800 text-teal-400 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-teal-500/10 hover:bg-teal-500 hover:text-slate-950 transition-all">
                                      Generate Jira Story for URL (WIP)
                                   </button>
                                </div>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State / Instructional */}
      {reports.length === 0 && !loading && (
        <div className="py-20 flex flex-col items-center text-center space-y-8 animate-in fade-in duration-1000">
           <div className="w-24 h-24 bg-slate-900 border border-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-700 shadow-2xl">
              <Zap className="w-12 h-12" />
           </div>
           <div className="space-y-2">
              <h4 className="text-xl font-black text-white uppercase tracking-tighter"> Mapping Inactive</h4>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Enter a project URL node to begin the multi-modal audit sequence.</p>
           </div>
        </div>
      )}
    </div>
  );
};
