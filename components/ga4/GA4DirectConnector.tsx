
// import React, { useState, useEffect } from 'react';
// import { 
//   Globe, Loader2, Key, CheckCircle, ShieldCheck, 
//   ArrowRight, Check, Activity, Lock, RefreshCw, X, 
//   ShieldAlert, LogIn, Database, Plus
// } from 'lucide-react';
// import { supabase } from '../../supabaseClient';

// interface Props {
//   onComplete: (tenantId: string) => void;
//   onCancel: () => void;
// }

// type ConnectorStep = 'auth' | 'properties' | 'sync_config' | 'syncing' | 'summary';

// interface Property {
//   propertyId: string;
//   propertyName: string;
//   accountId: string;
//   accountName: string;
// }

// export const GA4DirectConnector: React.FC<Props> = ({ onComplete, onCancel }) => {
//   const [step, setStep] = useState<ConnectorStep>('auth');
//   const [loading, setLoading] = useState(false);
//   const [isLoadingProperties, setIsLoadingProperties] = useState(false);
//   const [error, setError] = useState('');
  
//   const [tenantId, setTenantId] = useState('');
//   const [siteId, setSiteId] = useState('');
//   const [userEmail, setUserEmail] = useState('');
  
//   const [properties, setProperties] = useState<Property[]>([]);
//   const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
//   const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['sessions', 'activeUsers', 'totalRevenue', 'eventCount', 'conversions']);
//   const [dateRange, setDateRange] = useState(30);
  
//   const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, status: '' });
//   const [syncSummary, setSyncSummary] = useState({ added: 0, updated: 0 });

//   // useEffect(() => {
//   //   const urlParams = new URLSearchParams(window.location.search);
//   //   const code = urlParams.get('code');
//   //   const authError = urlParams.get('error');
    
//   //   if (authError) {
//   //     setError('Authentication failed: ' + authError);
//   //     setStep('auth');
//   //     return;
//   //   }
    
//   //   if (code && !sessionStorage.getItem('ga4_access_token')) {
//   //     handleOAuthCallback(code);
//   //   } else if (sessionStorage.getItem('ga4_access_token')) {
//   //     const storedEmail = sessionStorage.getItem('ga4_user_email');
//   //     if (storedEmail) setUserEmail(storedEmail);
//   //     fetchRealProperties();
//   //     setStep('properties');
//   //   }
//   // }, []);

// useEffect(() => {
//   console.log("Connector mounted → checking OAuth state");

//   const params = new URLSearchParams(window.location.search);
//   const oauthSuccess = params.get("oauth_success");

//   const token = sessionStorage.getItem("ga4_access_token");
//   const email = sessionStorage.getItem("ga4_user_email");

//   if (email) {
//     setUserEmail(email);
//   }

//   if (oauthSuccess === "true" || token) {
//     console.log("OAuth success detected → moving to properties");

//     setStep("properties");
//        fetchRealProperties();

//     // Clean URL so refresh doesn't re-trigger
//     window.history.replaceState({}, document.title, window.location.pathname);
//   }
// }, []);

  
//   const handleAuth = () => {
//     sessionStorage.removeItem('ga4_access_token');
//     sessionStorage.removeItem('ga4_refresh_token');
//     sessionStorage.removeItem('ga4_user_email');
//     window.location.href = '/api/auth/login';
//   };

//   const handleOAuthCallback = async (code: string) => {
//     try {
//       setLoading(true);
//       setError('');
      
//       const response = await fetch(`/api/auth/callback?code=${encodeURIComponent(code)}`);
      
//       if (!response.ok) {
//         throw new Error('OAuth Callback Failed');
//       }
      
//       const data = await response.json();
      
//       if (data.access_token) {
//         sessionStorage.setItem('ga4_access_token', data.access_token);
//         if (data.refresh_token) sessionStorage.setItem('ga4_refresh_token', data.refresh_token);
//         if (data.user_email) {
//           sessionStorage.setItem('ga4_user_email', data.user_email);
//           setUserEmail(data.user_email);
//         }
        
//         window.history.replaceState({}, document.title, window.location.pathname);
//         await fetchRealProperties();
//         setStep('properties');
//       } else {
//         throw new Error('Access token not received');
//       }
//     } catch (err: any) {
//       setError(err.message);
//       setStep('auth');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchRealProperties = async () => {
//     setIsLoadingProperties(true);
//     setError('');
    
//     try {
//       const accessToken = sessionStorage.getItem('ga4_access_token');
//       if (!accessToken) throw new Error('Not authenticated');

//       const response = await fetch('/api/ga4/properties', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ accessToken })
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to fetch properties');
//       }

//       const data = await response.json();
      
//       if (data.properties && data.properties.length > 0) {
//         setProperties(data.properties);
//       } else {
//         setError('No GA4 properties found');
//       }
//     } catch (err: any) {
//       setError(err.message);
//       if (err.message.includes('401') || err.message.includes('token')) {
//         sessionStorage.clear();
//         setStep('auth');
//       }
//     } finally {
//       setIsLoadingProperties(false);
//     }
//   };

//   const handleStartSync = async () => {
//     if (!tenantId || !selectedProperty) return;
//     setStep('syncing');
//     setLoading(true);
//     setError('');
    
//     try {
//       const accessToken = sessionStorage.getItem('ga4_access_token');
//       if (!accessToken) throw new Error('Not authenticated');

//       const endDate = new Date().toISOString().split('T')[0];
//       const startDate = new Date();
//       startDate.setDate(startDate.getDate() - dateRange);
//       const startDateStr = startDate.toISOString().split('T')[0];

//       setSyncProgress({ current: 0, total: dateRange, status: 'Fetching from GA4...' });

//       const response = await fetch('/api/ga4/fetch-data', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           accessToken,
//           propertyId: selectedProperty.propertyId,
//           startDate: startDateStr,
//           endDate: endDate,
//           metrics: selectedMetrics
//         })
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to fetch data');
//       }

//       const { data: ga4Data } = await response.json();
      
//       if (!ga4Data || ga4Data.length === 0) {
//         throw new Error('No data returned');
//       }

//       let added = 0;
//       let updated = 0;

//       for (let i = 0; i < ga4Data.length; i++) {
//         const rawDate = ga4Data[i].kpi_date;
//         const formattedDate = `${rawDate.substring(0,4)}-${rawDate.substring(4,6)}-${rawDate.substring(6,8)}`;

//         const record = {
//           tenant_id: tenantId,
//           site_id: siteId || 'main',
//           source: 'ga4',
//           source_id: selectedProperty.propertyId,
//           kpi_date: formattedDate,
//           kpis: ga4Data[i].kpis
//         };

//         const { data: existing } = await supabase
//           .from('kpi_daily_facts')
//           .select('id')
//           .eq('tenant_id', tenantId)
//           .eq('kpi_date', formattedDate)
//           .maybeSingle();

//         await supabase.from('kpi_daily_facts').upsert(record, { onConflict: 'tenant_id,site_id,kpi_date' });
        
//         if (existing) updated++; else added++;

//         if (i % 5 === 0 || i === ga4Data.length - 1) {
//           setSyncProgress({ 
//             current: i + 1, 
//             total: ga4Data.length,
//             status: `Syncing ${i + 1}/${ga4Data.length} days` 
//           });
//         }
//       }

//       setSyncSummary({ added, updated });
//       setStep('summary');
//     } catch (err: any) {
//       setError(err.message);
//       setStep('sync_config');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 overflow-y-auto">
//       <div className="max-w-2xl w-full glass-card rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden">
//         <div className="p-10 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
//           <div className="flex items-center gap-5">
//             <div className="p-4 bg-blue-600 rounded-2xl text-white">
//               <Globe className="w-6 h-6" />
//             </div>
//             <div>
//               <h2 className="text-2xl font-black text-white tracking-tight">GA4 Direct Connector</h2>
//               <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Real-time Data Ingestion</p>
//             </div>
//           </div>
//           <button onClick={onCancel} className="p-3 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
//         </div>

//         <div className="p-12">
//           {error && (
//             <div className="mb-8 p-6 bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl flex items-start gap-4">
//                <ShieldAlert className="w-5 h-5 text-rose-500 mt-1 shrink-0" />
//                <p className="text-xs text-slate-300 font-bold">{error}</p>
//             </div>
//           )}

//           {step === 'auth' && (
//             <div className="flex flex-col items-center py-10 text-center space-y-8 animate-in fade-in">
//               <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl">
//                 <Lock className="w-10 h-10 text-blue-400" />
//               </div>
//               <h3 className="text-2xl font-black text-white uppercase tracking-tighter"> Authentication</h3>
//               <button onClick={handleAuth} className="w-full max-w-sm py-6 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-50 transition-all">
//                 {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <LogIn className="w-5 h-5" />}
//                 Sign In with Google
//               </button>
//             </div>
//           )}

//           {step === 'properties' && (
//             <div className="space-y-10 animate-in slide-in-from-right">
//               <div className="flex items-center justify-between p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
//                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">{userEmail}</p>
//                  <button onClick={() => setStep('auth')} className="text-[9px] text-slate-500 uppercase font-black hover:text-white">Switch Account</button>
//               </div>

//               <div className="space-y-4">
//                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select GA4 Property</label>
//                 {isLoadingProperties ? (
//                   <div className="w-full py-12 flex flex-col items-center gap-4"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
//                 ) : (
//                   <div className="grid gap-3 max-h-[300px] overflow-y-auto scrollbar-hide">
//                     {properties.map(p => (
//                       <button key={p.propertyId} onClick={() => setSelectedProperty(p)} className={`p-6 text-left rounded-3xl border-2 transition-all flex flex-col gap-1 ${selectedProperty?.propertyId === p.propertyId ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-slate-900 hover:border-white/20'}`}>
//                          <h4 className="font-black text-white text-sm uppercase">{p.propertyName}</h4>
//                          <p className="text-[9px] text-slate-500 font-bold">Account: {p.accountName}</p>
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <button onClick={() => setStep('sync_config')} disabled={!selectedProperty} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-500 disabled:opacity-30">
//                 Continue to Configuration
//               </button>
//             </div>
//           )}

//           {step === 'sync_config' && (
//             <div className="space-y-10 animate-in slide-in-from-right">
//               <div className="grid md:grid-cols-2 gap-8">
//                 <div className="space-y-4">
//                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"> Tenant ID</label>
//                   <input className="w-full px-6 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500" value={tenantId} onChange={e => setTenantId(e.target.value)} />
//                 </div>
//                 <div className="space-y-4">
//                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Site ID</label>
//                   <input className="w-full px-6 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500" value={siteId} onChange={e => setSiteId(e.target.value)} />
//                 </div>
//               </div>
//               <button onClick={handleStartSync} disabled={!tenantId} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-500">
//                 Initiate Data Sync
//               </button>
//             </div>
//           )}

//           {step === 'syncing' && (
//             <div className="py-20 flex flex-col items-center justify-center space-y-10">
//                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
//                <div className="text-center space-y-6 w-full max-w-sm">
//                  <h4 className="text-xl font-black text-white uppercase tracking-tighter">{syncProgress.status}</h4>
//                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
//                     <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }} />
//                  </div>
//                </div>
//             </div>
//           )}

//           {step === 'summary' && (
//             <div className="py-12 space-y-12 animate-in fade-in">
//               <div className="text-center space-y-4">
//                  <h3 className="text-3xl font-black text-white uppercase tracking-tight">Sync Complete</h3>
//                  <p className="text-slate-400">Successfully synchronized {syncSummary.added + syncSummary.updated} records.</p>
//               </div>
//               <button onClick={() => onComplete(tenantId)} className="w-full py-6 bg-emerald-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-widest">
//                 Proceed to Intelligence Command
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };
import React, { useState, useEffect } from 'react';
import { 
  Globe, Loader2, Key, CheckCircle, ShieldCheck, 
  ArrowRight, Check, Activity, Lock, RefreshCw, X, 
  ShieldAlert, LogIn, Database, Plus
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props {
  onComplete: (tenantId: string) => void;
  onCancel: () => void;
}

type ConnectorStep = 'auth' | 'properties' | 'sync_config' | 'syncing' | 'summary';

interface Property {
  propertyId: string;
  propertyName: string;
  accountId: string;
  accountName: string;
}

export const GA4DirectConnector: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<ConnectorStep>('auth');
  const [loading, setLoading] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [error, setError] = useState('');
  
  const [tenantId, setTenantId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['sessions', 'activeUsers', 'totalRevenue', 'eventCount', 'conversions']);
  const [dateRange, setDateRange] = useState(30);
  
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, status: '' });
  const [syncSummary, setSyncSummary] = useState({ added: 0, updated: 0 });

  // useEffect(() => {
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const code = urlParams.get('code');
  //   const authError = urlParams.get('error');
    
  //   if (authError) {
  //     setError('Authentication failed: ' + authError);
  //     setStep('auth');
  //     return;
  //   }
    
  //   if (code && !sessionStorage.getItem('ga4_access_token')) {
  //     handleOAuthCallback(code);
  //   } else if (sessionStorage.getItem('ga4_access_token')) {
  //     const storedEmail = sessionStorage.getItem('ga4_user_email');
  //     if (storedEmail) setUserEmail(storedEmail);
  //     fetchRealProperties();
  //     setStep('properties');
  //   }
  // }, []);

useEffect(() => {
  console.log("Connector mounted → checking OAuth state");

  const params = new URLSearchParams(window.location.search);
  const oauthSuccess = params.get("oauth_success");

  const token = sessionStorage.getItem("ga4_access_token");
  const email = sessionStorage.getItem("ga4_user_email");

  if (email) {
    setUserEmail(email);
  }

  if (oauthSuccess === "true" || token) {
    console.log("OAuth success detected → moving to properties");

    setStep("properties");
       fetchRealProperties();

    // Clean URL so refresh doesn't re-trigger
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}, []);

  const togglePropertySelection = (property: Property) => {
    setSelectedProperties(prev => {
      const isSelected = prev.some(p => p.propertyId === property.propertyId);
      if (isSelected) {
        return prev.filter(p => p.propertyId !== property.propertyId);
      } else {
        return [...prev, property];
      }
    });
  };

  
  const handleAuth = () => {
    sessionStorage.removeItem('ga4_access_token');
    sessionStorage.removeItem('ga4_refresh_token');
    sessionStorage.removeItem('ga4_user_email');
    window.location.href = '/api/auth/login';
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/auth/callback?code=${encodeURIComponent(code)}`);
      
      if (!response.ok) {
        throw new Error('OAuth Callback Failed');
      }
      
      const data = await response.json();
      
      if (data.access_token) {
        sessionStorage.setItem('ga4_access_token', data.access_token);
        if (data.refresh_token) sessionStorage.setItem('ga4_refresh_token', data.refresh_token);
        if (data.user_email) {
          sessionStorage.setItem('ga4_user_email', data.user_email);
          setUserEmail(data.user_email);
        }
        
        window.history.replaceState({}, document.title, window.location.pathname);
        await fetchRealProperties();
        setStep('properties');
      } else {
        throw new Error('Access token not received');
      }
    } catch (err: any) {
      setError(err.message);
      setStep('auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchRealProperties = async () => {
    setIsLoadingProperties(true);
    setError('');
    
    try {
      const accessToken = sessionStorage.getItem('ga4_access_token');
      if (!accessToken) throw new Error('Not authenticated');

      const response = await fetch('/api/ga4/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch properties');
      }

      const data = await response.json();
      
      if (data.properties && data.properties.length > 0) {
        setProperties(data.properties);
      } else {
        setError('No GA4 properties found');
      }
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('401') || err.message.includes('token')) {
        sessionStorage.clear();
        setStep('auth');
      }
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const handleStartSync = async () => {
    if (!tenantId || selectedProperties.length === 0) return;
    setStep('syncing');
    setLoading(true);
    setError('');
    
    try {
      const accessToken = sessionStorage.getItem('ga4_access_token');
      if (!accessToken) throw new Error('Not authenticated');

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      const startDateStr = startDate.toISOString().split('T')[0];

      let totalAdded = 0;
      let totalUpdated = 0;
      const totalDays = dateRange * selectedProperties.length;

      setSyncProgress({ current: 0, total: totalDays, status: `Fetching from ${selectedProperties.length} properties...` });

      // Loop through each selected property
      for (let propIndex = 0; propIndex < selectedProperties.length; propIndex++) {
        const property = selectedProperties[propIndex];
        
        setSyncProgress({ 
          current: propIndex * dateRange, 
          total: totalDays,
          status: `Property ${propIndex + 1}/${selectedProperties.length}: ${property.propertyName}` 
        });

        const response = await fetch('/api/ga4/fetch-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken,
            propertyId: property.propertyId,
            startDate: startDateStr,
            endDate: endDate,
            metrics: selectedMetrics
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Failed to fetch data for ${property.propertyName}:`, errorData.error);
          continue; // Skip this property and continue with others
        }

        const { data: ga4Data } = await response.json();
        
        if (!ga4Data || ga4Data.length === 0) {
          console.warn(`No data returned for ${property.propertyName}`);
          continue;
        }

        // Process data for this property
        for (let i = 0; i < ga4Data.length; i++) {
          const rawDate = ga4Data[i].kpi_date;
          const formattedDate = `${rawDate.substring(0,4)}-${rawDate.substring(4,6)}-${rawDate.substring(6,8)}`;

          // Check if record exists for this date and tenant
          const { data: existing } = await supabase
            .from('kpi_daily_facts')
            .select('id, kpis')
            .eq('tenant_id', tenantId)
            .eq('kpi_date', formattedDate)
            .maybeSingle();

          let finalKpis = { ...ga4Data[i].kpis };

          // If record exists, aggregate the metrics
          if (existing) {
            finalKpis = {
              ...existing.kpis,
              ...ga4Data[i].kpis,
              // Aggregate numeric values
              ...Object.keys(ga4Data[i].kpis).reduce((acc, key) => {
                const existingValue = existing.kpis[key] || 0;
                const newValue = ga4Data[i].kpis[key] || 0;
                acc[key] = existingValue + newValue; // Sum values from multiple properties
                return acc;
              }, {} as Record<string, number>)
            };
          }

          const record = {
            tenant_id: tenantId,
            site_id: siteId || 'multi_property',
            source: 'ga4',
            source_id: selectedProperties.map(p => p.propertyId).join(','), // Store all property IDs
            kpi_date: formattedDate,
            kpis: finalKpis
          };

          await supabase.from('kpi_daily_facts').upsert(record, { onConflict: 'tenant_id,site_id,kpi_date' });
          
          if (existing) totalUpdated++; else totalAdded++;

          const currentProgress = (propIndex * dateRange) + i + 1;
          if (i % 5 === 0 || i === ga4Data.length - 1) {
            setSyncProgress({ 
              current: currentProgress, 
              total: totalDays,
              status: `Property ${propIndex + 1}/${selectedProperties.length}: ${i + 1}/${ga4Data.length} days` 
            });
          }
        }
      }

      setSyncSummary({ added: totalAdded, updated: totalUpdated });
      setStep('summary');
    } catch (err: any) {
      setError(err.message);
      setStep('sync_config');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full glass-card rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-600 rounded-2xl text-white">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">GA4 Direct Connector</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Real-time Data Ingestion</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-3 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-12">
          {error && (
            <div className="mb-8 p-6 bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl flex items-start gap-4">
               <ShieldAlert className="w-5 h-5 text-rose-500 mt-1 shrink-0" />
               <p className="text-xs text-slate-300 font-bold">{error}</p>
            </div>
          )}

          {step === 'auth' && (
            <div className="flex flex-col items-center py-10 text-center space-y-8 animate-in fade-in">
              <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl">
                <Lock className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter"> Authentication</h3>
              <button onClick={handleAuth} className="w-full max-w-sm py-6 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-50 transition-all">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                Sign In with Google
              </button>
            </div>
          )}

          {step === 'properties' && (
            <div className="space-y-10 animate-in slide-in-from-right">
              <div className="flex items-center justify-between p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                 <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">{userEmail}</p>
                 <button onClick={() => setStep('auth')} className="text-[9px] text-slate-500 uppercase font-black hover:text-white">Switch Account</button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select GA4 Properties (Multi-select)</label>
                  <span className="text-[9px] text-teal-400 font-black">{selectedProperties.length} Selected</span>
                </div>
                {isLoadingProperties ? (
                  <div className="w-full py-12 flex flex-col items-center gap-4"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
                ) : (
                  <div className="grid gap-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                    {properties.map(p => {
                      const isSelected = selectedProperties.some(sp => sp.propertyId === p.propertyId);
                      return (
                        <button 
                          key={p.propertyId} 
                          onClick={() => togglePropertySelection(p)} 
                          className={`p-6 text-left rounded-3xl border-2 transition-all flex items-center gap-4 ${isSelected ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-slate-900 hover:border-white/20'}`}
                        >
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-white text-sm uppercase">{p.propertyName}</h4>
                            <p className="text-[9px] text-slate-500 font-bold">Account: {p.accountName}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <p className="text-[10px] text-amber-400 font-bold">💡 <span className="uppercase tracking-wider">Multi-Property Aggregation:</span> Metrics from all selected properties will be combined to give you collective insights.</p>
              </div>

              <button onClick={() => setStep('sync_config')} disabled={selectedProperties.length === 0} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-500 disabled:opacity-30">
                Continue with {selectedProperties.length} {selectedProperties.length === 1 ? 'Property' : 'Properties'}
              </button>
            </div>
          )}

          {step === 'sync_config' && (
            <div className="space-y-10 animate-in slide-in-from-right">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"> Tenant ID</label>
                  <input className="w-full px-6 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500" value={tenantId} onChange={e => setTenantId(e.target.value)} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Site ID</label>
                  <input className="w-full px-6 py-4 bg-slate-900 border-2 border-slate-800 rounded-2xl text-white font-bold outline-none focus:border-blue-500" value={siteId} onChange={e => setSiteId(e.target.value)} />
                </div>
              </div>
              <button onClick={handleStartSync} disabled={!tenantId} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-500">
                Initiate Data Sync
              </button>
            </div>
          )}

          {step === 'syncing' && (
            <div className="py-20 flex flex-col items-center justify-center space-y-10">
               <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
               <div className="text-center space-y-6 w-full max-w-sm">
                 <h4 className="text-xl font-black text-white uppercase tracking-tighter">{syncProgress.status}</h4>
                 <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }} />
                 </div>
               </div>
            </div>
          )}

          {step === 'summary' && (
            <div className="py-12 space-y-12 animate-in fade-in">
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <CheckCircle className="w-10 h-10 text-emerald-400" />
                 </div>
                 <h3 className="text-3xl font-black text-white uppercase tracking-tight">Sync Complete</h3>
                 <p className="text-slate-400">Successfully synchronized {syncSummary.added + syncSummary.updated} records from <span className="text-white font-bold">{selectedProperties.length} {selectedProperties.length === 1 ? 'property' : 'properties'}</span>.</p>
              </div>
              
              <div className="p-6 bg-slate-800/50 rounded-2xl space-y-3">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Properties Synced:</p>
                <div className="space-y-2">
                  {selectedProperties.map(p => (
                    <div key={p.propertyId} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-white font-bold">{p.propertyName}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-500/10 rounded-xl text-center">
                  <p className="text-2xl font-black text-blue-400">{syncSummary.added}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">New Records</p>
                </div>
                <div className="p-4 bg-teal-500/10 rounded-xl text-center">
                  <p className="text-2xl font-black text-teal-400">{syncSummary.updated}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Updated Records</p>
                </div>
              </div>
              
              <button onClick={() => onComplete(tenantId)} className="w-full py-6 bg-emerald-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all">
                Proceed to Intelligence Command
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
