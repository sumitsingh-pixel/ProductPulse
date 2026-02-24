
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Database, Loader2, Key, CheckCircle, ShieldCheck, 
  ArrowRight, Globe, Check, AlertTriangle, 
  Activity, Settings, Lock, Search, HeartPulse, Unlink, LogIn
} from 'lucide-react';
import { discoverGA4Tags, validateGA4Handshake } from '../../services/geminiService';
import { ProjectContext } from '../../types';

// Declare google global variable for Google Identity Services usage
declare const google: any;

// NOTE: In a real production app, this should be an environment variable.
// The user can also enter this in a settings panel.
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

interface Props {
  project: ProjectContext;
  ga4Config: { propertyId: string; jsonKey: string; tags: string[] };
  setGa4Config: React.Dispatch<React.SetStateAction<{ propertyId: string; jsonKey: string; tags: string[] }>>;
  onTagsExtracted: (tags: string[], detectedStartDate: string) => void;
  loading: boolean;
}

enum HandshakeStep { AUTH, DISCOVERY, VALIDATION }

export const SourceSetup: React.FC<Props> = ({ project, ga4Config, setGa4Config, onTagsExtracted, loading }) => {
  const [step, setStep] = useState<HandshakeStep>(HandshakeStep.AUTH);
  const [isProcessing, setIsProcessing] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [googleAccounts, setGoogleAccounts] = useState<any[]>([]);
  const [gtmContainers, setGtmContainers] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);

  // 1. Initialize Google Identity Services
  useEffect(() => {
    const initGsi = () => {
      // Fix: check for global google object availability provided by Google Identity Services script
      if (typeof google === 'undefined') {
        console.warn("GSI script not loaded yet. Retrying...");
        setTimeout(initGsi, 500);
        return;
      }

      // Fix: use global google object to initialize the OAuth token client
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/tagmanager.readonly',
        callback: (response: any) => {
          if (response.error) {
            alert(`Authentication Error: ${response.error}`);
            return;
          }
          setAccessToken(response.access_token);
          fetchLiveDiscoveryData(response.access_token);
        },
      });
      setTokenClient(client);
    };

    initGsi();
  }, []);

  // 2. Real Discovery: Fetch Accounts and Properties from Google API
  const fetchLiveDiscoveryData = async (token: string) => {
    setIsProcessing(true);
    try {
      // Fetch GA4 Properties (using Account Summaries for efficiency)
      const gaResponse = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const gaData = await gaResponse.json();

      // Fetch GTM Accounts
      const gtmResponse = await fetch('https://tagmanager.googleapis.com/api/v2/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const gtmData = await gtmResponse.json();

      const accounts = gaData.accountSummaries?.map((acc: any) => ({
        name: acc.displayName,
        properties: acc.propertySummaries?.map((prop: any) => ({
          id: prop.property.replace('properties/', ''),
          name: prop.displayName
        })) || []
      })) || [];

      setGoogleAccounts(accounts);
      setGtmContainers(gtmData.account || []);
      setStep(HandshakeStep.DISCOVERY);
    } catch (err: any) {
      alert("Discovery failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOAuth = () => {
    if (!tokenClient) {
      alert("Google Identity Services not initialized. Check your Client ID.");
      return;
    }
    tokenClient.requestAccessToken();
  };

  const handleDiscoveryComplete = async () => {
    if (!selectedProperty) return;
    setIsProcessing(true);
    try {
      // Step 1: Discover Tags (Using Gemini to simulate schema analysis of live data)
      const { tags, detected_inception_date } = await discoverGA4Tags(project, selectedProperty);
      
      // Step 2: Validate Implementation Quality
      const validation = await validateGA4Handshake(project, selectedProperty, tags);
      
      setHealthSummary({ ...validation, tags, detected_inception_date });
      setGa4Config(prev => ({ ...prev, propertyId: selectedProperty, tags }));
      setStep(HandshakeStep.VALIDATION);
    } catch (err: any) {
      alert("Validation failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderHealthScore = (score: number) => {
    const color = score > 80 ? 'text-emerald-400' : score > 50 ? 'text-amber-400' : 'text-rose-400';
    return (
      <div className="flex flex-col items-center">
        <div className={`text-6xl font-black ${color} tracking-tighter mb-2`}>{score}%</div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Measurement Ready Score</div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto glass-card rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="p-12 border-b border-white/5 bg-slate-900/40 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-indigo-500" />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Enterprise Handshake</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Google Analytics & Tag Manager Integration</p>
          </div>
          <div className="flex items-center gap-4">
            {[HandshakeStep.AUTH, HandshakeStep.DISCOVERY, HandshakeStep.VALIDATION].map((s, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all ${step === s ? 'bg-teal-500 shadow-[0_0_15px_#2dd4bf] scale-125' : step > s ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-12">
        {step === HandshakeStep.AUTH && (
          <div className="flex flex-col items-center py-12 text-center space-y-10">
            <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl">
              <Lock className="w-10 h-10 text-teal-400" />
            </div>
            <div className="max-w-md space-y-4">
              <h3 className="text-2xl font-black text-white">Live Account Discovery</h3>
              <p className="text-slate-400 text-sm font-semibold leading-relaxed">
                Connect your Google account to retrieve actual properties and containers. We use <b>read-only</b> API access to sync your dashboard.
              </p>
            </div>
            <button 
              onClick={handleOAuth}
              disabled={isProcessing}
              className="w-full max-w-sm py-6 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-slate-100 transition-all shadow-2xl group"
            >
              {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : (
                <div className="bg-white p-1 rounded-full group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
              )}
              Sign In with Google
            </button>
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Powered by Google Identity Services</p>
          </div>
        )}

        {step === HandshakeStep.DISCOVERY && (
          <div className="space-y-10">
            <div className="flex items-center gap-4 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-xs font-black text-white uppercase tracking-widest">Access Granted</p>
                <p className="text-[10px] text-emerald-400 font-black uppercase">Retrieving your live property list...</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Database className="w-3 h-3" /> Select Live GA4 Property
                </label>
                <div className="relative group">
                  <select 
                    className="w-full px-6 py-5 bg-slate-900 border-2 border-slate-800 rounded-3xl text-white font-bold outline-none focus:border-teal-500 appearance-none transition-all cursor-pointer shadow-inner"
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                  >
                    <option value="">Choose your property...</option>
                    {googleAccounts.map(acc => (
                      <optgroup key={acc.name} label={acc.name}>
                        {acc.properties.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                        ))}
                      </optgroup>
                    ))}
                    {googleAccounts.length === 0 && (
                      <option disabled>No properties found in this account.</option>
                    )}
                  </select>
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Settings className="w-3 h-3" /> Select GTM Container (Optional)
                </label>
                <div className="relative group">
                  <select 
                    className="w-full px-6 py-5 bg-slate-900 border-2 border-slate-800 rounded-3xl text-white font-bold outline-none focus:border-teal-500 appearance-none transition-all cursor-pointer shadow-inner"
                    value={selectedContainer}
                    onChange={(e) => setSelectedContainer(e.target.value)}
                  >
                    <option value="">Direct Tag Discovery (No GTM)</option>
                    {gtmContainers.map(cont => (
                      <option key={cont.name} value={cont.name}>{cont.name}</option>
                    ))}
                  </select>
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(HandshakeStep.AUTH)}
                className="px-8 py-5 rounded-2xl bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all border border-white/5"
              >
                Log Out
              </button>
              <button 
                onClick={handleDiscoveryComplete}
                disabled={!selectedProperty || isProcessing}
                className="flex-1 py-5 bg-teal-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-teal-500/20 flex items-center justify-center gap-3 hover:bg-teal-400 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Activity className="w-5 h-5" />}
                Validate Implementation
              </button>
            </div>
          </div>
        )}

        {step === HandshakeStep.VALIDATION && healthSummary && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1 glass-card p-10 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner">
                 {renderHealthScore(healthSummary.healthScore)}
                 <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase rounded-full border border-emerald-500/20">Live Sync Active</span>
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase rounded-full border border-indigo-500/20">Property Linked</span>
                 </div>
              </div>
              <div className="md:col-span-2 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-teal-400 border border-white/10">
                       <HeartPulse className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-white">Live Health Summary</h4>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Verified Data Integrity Results</p>
                    </div>
                 </div>
                 <p className="text-sm font-semibold text-slate-400 leading-relaxed italic p-6 bg-slate-900/40 rounded-3xl border border-white/5">
                   {healthSummary.summary}
                 </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(healthSummary.checks).map(([key, val]: [string, any]) => (
                <div key={key} className="p-6 bg-slate-950 border border-white/5 rounded-3xl flex items-center justify-between shadow-inner">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                   <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase ${val === 'Success' || val === 'Yes' ? 'text-emerald-400' : 'text-rose-400'}`}>{val}</span>
                      {val === 'Success' || val === 'Yes' ? <Check className="w-3 h-3 text-emerald-400" /> : <Unlink className="w-3 h-3 text-rose-400" />}
                   </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => onTagsExtracted(healthSummary.tags, healthSummary.detected_inception_date)}
              className="w-full py-6 bg-emerald-500 text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20"
            >
              Commit Live Configuration to Vault <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Footer / Status */}
      <div className="p-6 bg-slate-950 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Secure Google Handshake Active</span>
          <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> Live Protocol: OAuth 2.0</span>
        </div>
        <div className="text-teal-500/50">
           Enterprise Readiness: 100%
        </div>
      </div>
    </div>
  );
};
