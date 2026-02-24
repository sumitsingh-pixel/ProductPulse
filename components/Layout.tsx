
import React from 'react';
import { Package2, Wifi, WifiOff, AlertCircle, Link2, Unlink, LogOut, ChevronRight, Home, LayoutDashboard } from 'lucide-react';
import { UserRole } from '../types';

export interface LayoutProps {
  children: React.ReactNode;
  projectName?: string;
  activeToolName?: string;
  ga4Status?: 'active' | 'offline' | 'searching';
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onNavigateProject?: () => void;
  userRole?: UserRole;
  userEmail?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  projectName, 
  activeToolName,
  ga4Status = 'offline', 
  onLogout,
  onNavigateHome,
  onNavigateProject,
  userRole,
  userEmail
}) => {
  const hasApiKey = !!process.env.API_KEY && process.env.API_KEY !== 'undefined';

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 glass-card border-b border-white/5 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={onNavigateHome}>
              <div className="p-2 bg-teal-500 rounded-lg text-slate-900 shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform">
                <div className="p-0.5"><Package2 className="w-6 h-6" /></div>
              </div>
              <div>
                <h1 className="text-xl font-black text-white leading-none tracking-tight">Product Pulse</h1>
                <span className="text-[8px] text-teal-400 font-black tracking-[0.2em] uppercase mt-1 block">Strategic Engine</span>
              </div>
            </div>

            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center gap-3 ml-4">
              <div className="h-6 w-px bg-white/10 mx-2" />
              
              <button 
                onClick={onNavigateHome}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-widest"
              >
                <Home className="w-3.5 h-3.5" />
                Projects
              </button>

              {projectName && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <button 
                    onClick={onNavigateProject}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-200 hover:text-teal-400 transition-colors uppercase tracking-widest"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {projectName}
                  </button>
                </>
              )}

              {activeToolName && (projectName) && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">
                    {activeToolName}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-white/5">
              {hasApiKey ? (
                <>
                  <Wifi className="w-3 h-3 text-teal-500" />
                  <span className="text-[8px] font-black text-teal-500 uppercase tracking-widest">AI: Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-rose-500" />
                  <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">AI: Offline</span>
                </>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-white/5">
              {ga4Status === 'active' ? (
                <>
                  <Link2 className="w-3 h-3 text-emerald-500" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">GA4: Linked</span>
                </>
              ) : ga4Status === 'searching' ? (
                <>
                  <div className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">GA4: Sync</span>
                </>
              ) : (
                <>
                  <Unlink className="w-3 h-3 text-slate-500" />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">GA4: Void</span>
                </>
              )}
            </div>

            {userRole && (
              <div className="flex items-center gap-3 ml-4 bg-slate-800/50 border border-white/5 pl-4 pr-2 py-1.5 rounded-2xl">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-teal-500 uppercase tracking-widest leading-none mb-1">{userRole}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">{userEmail?.split('@')[0] || 'GUEST'}</span>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 bg-slate-700 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-xl"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      <main className="flex-1 container mx-auto py-12 px-4 md:px-6">
        {!hasApiKey && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top duration-300">
            <div className="p-2 bg-rose-500 rounded-lg text-white">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-rose-400 uppercase tracking-widest">Warning: AI Engine Offline</p>
              <p className="text-[10px] text-slate-400 font-medium">No API Key detected. Intelligence modules will operate in limited mode.</p>
            </div>
          </div>
        )}
        {children}
      </main>
      
      <footer className="py-8 border-t border-white/5 bg-slate-900/50 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
        &copy; 2024 Product Pulse &bull; Synthetic Intelligence Framework &bull; Gemini Powered
      </footer>
    </div>
  );
};
