
import React, { useState, useEffect } from 'react';
import { 
  FileUp, FileDown, AlertCircle, CheckCircle, Database, 
  Loader2, ArrowRight, ShieldCheck, Terminal, X, Plus, Activity
} from 'lucide-react';
import { databaseService } from '../services/databaseService';
import { KPIFact, KPIDictionary } from '../types';

interface Props {
  onComplete: (tenantId: string) => void;
  onCancel: () => void;
}

export const CSVUploader: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'upload' | 'validate' | 'discovery' | 'ingest'>('upload');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [missingKPIs, setMissingKPIs] = useState<string[]>([]);
  const [newDefinitions, setNewDefinitions] = useState<KPIDictionary[]>([]);
  const [targetTenant, setTargetTenant] = useState<string>('');

  const generateTemplate = async () => {
    setLoading(true);
    try {
      const coreHeaders = await databaseService.getCSVTemplateHeaders();
      const dictionary = await databaseService.getKPIDictionary();
      const kpiHeaders = dictionary.map(d => d.kpi_key);
      const csvContent = [...coreHeaders, ...kpiHeaders].join(',') + '\n';
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productpulse_telemetry_template_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      parseCSV(selected);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      let text = e.target?.result as string;
      
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }

      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        setErrors(["The file appears to be empty or contains only headers."]);
        return;
      }

      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';
      
      const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
      
      const dataRows = lines.slice(1).map((line) => {
        const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
        return headers.reduce((obj, header, i) => {
          if (header) {
            obj[header] = values[i] || '';
          }
          return obj;
        }, {} as any);
      }).filter(row => {
        const isHeader = row.kpi_date === 'kpi_date' || row.tenant_id === 'tenant_id';
        const hasData = Object.values(row).some(v => v !== '');
        return !isHeader && hasData;
      });

      if (dataRows.length === 0) {
        setErrors(["No valid data records found in the CSV (excluding headers)."]);
        setStep('upload');
        return;
      }

      setParsedRows(dataRows);
      validateData(headers, dataRows);
    };
    reader.readAsText(file);
  };

  const validateData = async (headers: string[], rows: any[]) => {
    const errs: string[] = [];
    const core = ['tenant_id', 'kpi_date'];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    core.forEach(c => {
      if (!headers.includes(c)) errs.push(`Missing required column: ${c}`);
    });

    if (errs.length > 0) {
      setErrors(errs);
      setStep('upload');
      return;
    }

    rows.forEach((row, idx) => {
      const lineNum = idx + 2;
      if (!row.tenant_id) errs.push(`Line ${lineNum}: Missing tenant_id.`);
      if (!row.kpi_date) {
        errs.push(`Line ${lineNum}: Missing kpi_date.`);
      } else if (!dateRegex.test(row.kpi_date)) {
        errs.push(`Line ${lineNum}: Invalid date format "${row.kpi_date}". Expected YYYY-MM-DD.`);
      }
    });

    const dates = rows.map(r => r.kpi_date);
    const uniqueDates = new Set(dates);
    if (uniqueDates.size !== dates.length) {
      errs.push("Integrity Failure: Multiple entries detected for the same date.");
    }

    if (errs.length > 0) {
      setErrors(errs);
      setStep('upload');
      return;
    }

    setErrors([]);
    setTargetTenant(rows[0].tenant_id);

    try {
      const dictionary = await databaseService.getKPIDictionary();
      const knownKeys = dictionary.map(d => d.kpi_key);
      const discovered = headers.filter(h => !core.includes(h) && h !== 'site_id');
      const missing = discovered.filter(d => !knownKeys.includes(d));

      if (missing.length > 0) {
        setMissingKPIs(missing);
        setNewDefinitions(missing.map(k => ({
          kpi_key: k, kpi_name: k, description: '', formula: '',
          input_metrics: '', owner: '', business_goal_relation: '', north_star_alignment: ''
        })));
        setStep('discovery');
      } else {
        setStep('validate');
      }
    } catch (err) {
      setErrors(["Failed to connect to dictionary for KPI validation."]);
      setStep('upload');
    }
  };

  const handleDiscoverySubmit = async () => {
    setLoading(true);
    try {
      for (const def of newDefinitions) {
        await databaseService.saveKPIDefinition(def, targetTenant);
      }
      setStep('validate');
    } catch (err: any) {
      setErrors([`Failed to save new definitions: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    setLoading(true);
    setProgress(0);
    let rowsProcessed = 0;
    const CHUNK_SIZE = 50;
    
    try {
      const coreHeaders = ['tenant_id', 'site_id', 'kpi_date'];
      const allFacts: KPIFact[] = parsedRows.map(row => {
        const kpis: Record<string, number> = {};
        Object.keys(row).forEach(key => {
          if (!coreHeaders.includes(key)) {
            const val = parseFloat(row[key]);
            kpis[key] = isNaN(val) ? 0 : val;
          }
        });
        return {
          tenant_id: row.tenant_id,
          site_id: row.site_id || null,
          kpi_date: row.kpi_date,
          source: 'CSV_UPLOAD', // Added to satisfy NOT NULL database constraint
          kpis
        };
      });

      console.log(`[CSV-Uploader] [Action] Starting chunked database synchronization for Tenant: ${targetTenant}`);
      
      const totalChunks = Math.ceil(allFacts.length / CHUNK_SIZE);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const chunk = allFacts.slice(start, end);
        
        await databaseService.bulkIngestFacts(chunk);
        
        rowsProcessed += chunk.length;
        const currentProgress = Math.round(((i + 1) / totalChunks) * 100);
        setProgress(currentProgress);
        
        console.log(`[CSV-Uploader] [Progress] Processed chunk ${i + 1}/${totalChunks} (${currentProgress}%)`);
      }
      
      console.log(`[CSV-Uploader] [Success] Records synchronized successfully: ${rowsProcessed}`);

      await databaseService.logUpload({
        file_name: file?.name || 'telemetry_snapshot.csv',
        rows_processed: rowsProcessed,
        rows_failed: 0,
        status: 'Success'
      });
      
      onComplete(targetTenant);
    } catch (err: any) {
      console.error(`[CSV-Uploader] [Error] Synchronization failed:`, err);
      const errorMessage = err.message || "Database connection protocol failure.";
      
      await databaseService.logUpload({
        file_name: file?.name || 'telemetry_snapshot.csv',
        rows_processed: 0,
        rows_failed: parsedRows.length,
        status: 'Failed',
        error_log: errorMessage
      });
      setErrors([`Synchronization Failure: ${errorMessage}`]);
      setStep('upload');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-4xl w-full glass-card rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
        
        {/* Header */}
        <div className="p-10 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-teal-500 rounded-2xl text-slate-950 shadow-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Telemetry Gateway</h2>
              <p className="text-[10px] text-teal-400 font-black uppercase tracking-[0.3em]">Vault Data Ingestion Protocol</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-3 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-12 space-y-10">
          
          {step === 'upload' && (
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
              <div className="grid md:grid-cols-2 gap-8">
                <button 
                  onClick={generateTemplate}
                  disabled={loading}
                  className="p-10 glass-card rounded-3xl border border-white/5 hover:border-teal-500/50 transition-all group flex flex-col items-center text-center gap-6"
                >
                  <FileDown className="w-12 h-12 text-teal-500 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="font-black text-white uppercase tracking-widest text-sm mb-2">Generate Template</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Schema includes all active KPI definitions from vault</p>
                  </div>
                </button>

                <label className="p-10 glass-card rounded-3xl border border-dashed border-slate-700 hover:border-teal-500/50 transition-all group flex flex-col items-center text-center gap-6 cursor-pointer">
                  <FileUp className="w-12 h-12 text-teal-500 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="font-black text-white uppercase tracking-widest text-sm mb-2">Upload Telemetry</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Drop CSV or click to select file</p>
                  </div>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {errors.length > 0 && (
                <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] flex items-start gap-6 animate-in slide-in-from-top duration-300">
                  <AlertCircle className="w-8 h-8 text-rose-500 shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-2">Integrity Failures Detected</p>
                    <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-hide">
                      {errors.map((e, i) => (
                        <div key={i} className="flex gap-2 text-[10px] text-slate-400 font-medium">
                          <span className="text-rose-500 font-black">•</span>
                          {e}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'discovery' && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
               <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center gap-6">
                 <Terminal className="w-10 h-10 text-amber-500 animate-pulse" />
                 <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">Protocol Divergence</h3>
                   <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">New KPI Keys discovered in CSV: {missingKPIs.join(', ')}</p>
                 </div>
               </div>
               
               <div className="max-h-[300px] overflow-y-auto space-y-6 pr-4 scrollbar-hide">
                  {newDefinitions.map((def, idx) => (
                    <div key={def.kpi_key} className="glass-card p-8 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-slate-800 text-teal-400 rounded text-[9px] font-black uppercase">{def.kpi_key}</span>
                        <input className="flex-1 bg-transparent border-b border-slate-800 text-white font-black text-xs uppercase outline-none focus:border-teal-500" placeholder="Display Name" value={def.kpi_name} onChange={e => {
                          const updated = [...newDefinitions];
                          updated[idx].kpi_name = e.target.value;
                          setNewDefinitions(updated);
                        }} />
                      </div>
                      <textarea className="w-full bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-white text-[10px] font-medium outline-none h-20" placeholder="Business Context / Goal alignment" value={def.business_goal_relation} onChange={e => {
                          const updated = [...newDefinitions];
                          updated[idx].business_goal_relation = e.target.value;
                          setNewDefinitions(updated);
                      }} />
                    </div>
                  ))}
               </div>

               <button onClick={handleDiscoverySubmit} className="w-full py-5 bg-teal-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-400">Expand Schema Definitions</button>
            </div>
          )}

          {step === 'validate' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center gap-6">
                <ShieldCheck className="w-12 h-12 text-emerald-500" />
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Integrity Confirmed</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Validated {parsedRows.length} telemetry snapshots for tenant: <span className="text-teal-400">{targetTenant}</span></p>
                </div>
              </div>

              {loading ? (
                <div className="p-10 glass-card rounded-[2.5rem] border border-white/5 space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-teal-500 uppercase tracking-[0.3em]">Synchronizing Strategic Vault</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-teal-500 shadow-[0_0_15px_#2dd4bf] transition-all duration-300 ease-out" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center italic">
                    {progress < 100 ? 'Encrypting and streaming data packets...' : 'Finalizing cryptographic handshake...'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="max-h-[250px] overflow-hidden rounded-3xl border border-white/5">
                    <table className="w-full text-left text-[10px] font-black uppercase">
                      <thead className="bg-slate-900 text-slate-500 border-b border-white/5">
                        <tr>
                          <th className="px-6 py-4">kpi_date</th>
                          <th className="px-6 py-4">site_id</th>
                          {Object.keys(parsedRows[0]).filter(k => !['tenant_id', 'site_id', 'kpi_date'].includes(k)).slice(0, 2).map(k => (
                            <th key={k} className="px-6 py-4">{k}</th>
                          ))}
                          <th className="px-6 py-4 text-teal-500">...</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {parsedRows.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            <td className="px-6 py-3">{row.kpi_date}</td>
                            <td className="px-6 py-3">{row.site_id}</td>
                            {Object.keys(row).filter(k => !['tenant_id', 'site_id', 'kpi_date'].includes(k)).slice(0, 2).map(k => (
                              <td key={k} className="px-6 py-3">{row[k]}</td>
                            ))}
                            <td className="px-6 py-3 text-teal-500">...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button 
                    onClick={handleIngest}
                    disabled={loading}
                    className="w-full py-6 bg-teal-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl hover:bg-teal-400 transition-all active:scale-95"
                  >
                    <Activity className="w-5 h-5" />
                    Synchronize Ingestion Pipeline
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Status */}
        <div className="p-6 bg-slate-950 border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.3em] text-slate-700">
          <span>Encryption Protocol: SHA-256</span>
          <span className="text-teal-500/50 italic">Strategic Engine Processing...</span>
        </div>
      </div>
    </div>
  );
};
