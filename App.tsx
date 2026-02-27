
// import React, { useState, useEffect } from 'react';
// import { ProjectContext, ToolType, UserRole } from './types';
// import { TOOL_CARDS } from './constants';
// import { ProjectSetup } from './components/ProjectSetup';
// import { Layout } from './components/Layout';
// import { SEOAnalyzer } from './components/SEOAnalyzer';
// import { GA4Analytics } from './components/GA4Analytics';
// import { EpicPrioritizer } from './components/EpicPrioritizer';
// import { SentimentAnalyzer } from './components/SentimentAnalyzer';
// import { Auth } from './components/Auth';
// import { ProjectSelector } from './components/ProjectSelector';
// import { ChevronLeft, LogOut, Sparkles, ArrowRight, RefreshCw, ShieldAlert, HelpCircle } from 'lucide-react';
// import { supabase } from './supabaseClient';
// import { databaseService } from './services/databaseService';

// const App: React.FC = () => {
//   const [user, setUser] = useState<any>(null);
//   const [userRole, setUserRole] = useState<UserRole>(UserRole.EDITOR);
//   const [projects, setProjects] = useState<ProjectContext[]>([]);
//   const [activeProject, setActiveProject] = useState<ProjectContext | null>(null);
//   const [activeTool, setActiveTool] = useState<ToolType | null>(null);
//   const [showSetup, setShowSetup] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [showBypass, setShowBypass] = useState(false);
//   const [fetchError, setFetchError] = useState<string | null>(null);
//   const [notification, setNotification] = useState<string | null>(null);
//   const [ga4Status, setGa4Status] = useState<'active' | 'offline' | 'searching'>('offline');
//   const [isDemoMode, setIsDemoMode] = useState(false);

//   useEffect(() => {
//     let isInitialized = false;

//     const initialize = async () => {
//       if (isInitialized) return;
//       isInitialized = true;

//       try {
//         const { data: { session } } = await supabase.auth.getSession();
        
//         if (session?.user) {
//           setUser(session.user);
//           await fetchProjects();
//         } else {
//           setLoading(false);
//         }
//       } catch (err) {
//         console.error("[Auth] Initialization failed:", err);
//         setLoading(false);
//       }
//     };

//     initialize();

//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
//       if (session?.user) {
//         setUser(session.user);
//         if (event === 'SIGNED_IN') {
//            await fetchProjects();
//         }
//       } else if (event === 'SIGNED_OUT') {
//         setUser(null);
//         setProjects([]);
//         setFetchError(null);
//         setIsDemoMode(false);
//         setLoading(false);
//       }
//     });

//     const bypassTimer = setTimeout(() => setShowBypass(true), 4000);
//     const forceClearTimer = setTimeout(() => setLoading(false), 12000);

//     return () => {
//       subscription.unsubscribe();
//       clearTimeout(bypassTimer);
//       clearTimeout(forceClearTimer);
//     };
//   }, []);

//   const fetchProjects = async () => {
//     setFetchError(null);
//     try {
//       const data = await databaseService.getWorkspaces();
//       if (!data || data.length === 0) {
//         const cached = localStorage.getItem('productpulse_sim_data');
//         if (cached) {
//           setProjects(JSON.parse(cached));
//           setIsDemoMode(true);
//         } else {
//           setProjects([]);
//         }
//       } else {
//         setProjects(data);
//         setIsDemoMode(false);
//       }
//     } catch (err: any) {
//       setFetchError(err.message || "Failed to synchronize with strategic vault.");
//       const fallback = localStorage.getItem('productpulse_fallback_workspaces');
//       if (fallback) {
//         setProjects(JSON.parse(fallback));
//         setIsDemoMode(true);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInjectDemoData = (type: 'SaaS' | 'Mobile') => {
//     setLoading(true);
//     const demoProjects: ProjectContext[] = type === 'SaaS' ? [
//       {
//         id: 'demo-saas-1',
//         name: 'Enterprise CRM Engine',
//         type: 'SaaS',
//         description: 'Global rollout for B2B CRM ecosystem. Focus on churn reduction and expansion revenue.',
//         tenant_id: 'DEMO_TENANT_SAAS',
//         is_demo: true
//       }
//     ] : [
//       {
//         id: 'demo-mobile-1',
//         name: 'NeoFit Mobile App',
//         type: 'Mobile',
//         description: 'Native iOS/Android fitness ecosystem. High focus on daily active users and subscription conversion.',
//         tenant_id: 'DEMO_TENANT_MOBILE',
//         is_demo: true
//       }
//     ];

//     setTimeout(() => {
//       setProjects(prev => [...demoProjects, ...prev]);
//       setIsDemoMode(true);
//       localStorage.setItem('productpulse_sim_data', JSON.stringify([...demoProjects, ...projects]));
//       setLoading(false);
//       setNotification(`Simulation Mode Activated: ${type} Ecosystem Deployed Locally.`);
//     }, 800);
//   };

//   const handleLogout = async () => {
//     setLoading(true);
//     try {
//       await supabase.auth.signOut();
//       setUser(null);
//       setActiveProject(null);
//       setActiveTool(null);
//       setGa4Status('offline');
//       setFetchError(null);
//       setIsDemoMode(false);
//       setShowSetup(false);
//     } catch (err) {
//       console.error("[Auth] Sign out error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateProject = async (newProject: Omit<ProjectContext, 'id'>) => {
//     setLoading(true);
//     try {
//       const savedProject = await databaseService.createWorkspace(newProject);
//       setProjects(prev => [savedProject, ...prev]);
//       setActiveProject(savedProject);
//       setShowSetup(false);
//       setIsDemoMode(false);
//     } catch (err) {
//       const localProject = { ...newProject, id: `local-${Date.now()}` } as ProjectContext;
//       setProjects(prev => [localProject, ...prev]);
//       setActiveProject(localProject);
//       setShowSetup(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleToolSelect = (toolId: ToolType) => {
//     setNotification(null);
//     setActiveTool(toolId);
//   };

//   const handleGA4Redirect = (message: string) => {
//     setActiveTool(null);
//     setNotification(message);
//     setTimeout(() => setNotification(null), 5000);
//   };

//   const handleRoleSelection = (role: UserRole) => {
//     setUserRole(role);
//   };

//   const getActiveToolName = () => {
//     if (!activeTool) return undefined;
//     const tool = TOOL_CARDS.find(t => t.id === activeTool);
//     return tool?.title;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] p-6 text-center">
//         <div className="flex flex-col items-center gap-8">
//           <div className="relative">
//             <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
//             <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-teal-400 animate-pulse" />
//           </div>
//           <div className="space-y-2">
//             <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.4em] animate-pulse italic">
//               Synchronizing Vault Access...
//             </p>
//           </div>
//           {showBypass && (
//             <div className="mt-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
//               <button
//                 onClick={() => setLoading(false)}
//                 className="flex items-center gap-2 text-[9px] font-black text-slate-500 hover:text-teal-400 transition-all uppercase tracking-widest border border-white/5 bg-white/5 px-6 py-3 rounded-2xl"
//               >
//                 <HelpCircle className="w-3.5 h-3.5" /> Force Workspace Entry
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return <Auth onRoleSelect={handleRoleSelection} />;
//   }

//   const renderDashboardContent = () => {
//     if (showSetup) {
//       return (
//         <div className="space-y-4">
//           <button
//             onClick={() => setShowSetup(false)}
//             className="flex items-center gap-2 text-[10px] font-black text-teal-500 hover:text-teal-300 transition-colors uppercase tracking-widest ml-6 pt-6"
//           >
//             <ChevronLeft className="w-4 h-4" /> Return to Vault
//           </button>
//           <ProjectSetup onComplete={handleCreateProject} />
//         </div>
//       );
//     }

//     if (!activeProject) {
//       return (
//         <div className="space-y-8 pb-20">
//           {notification && (
//             <div className="max-w-4xl mx-auto px-4 mt-8">
//               <div className="p-6 bg-teal-500/10 border-2 border-teal-500/20 rounded-[2rem] flex items-center gap-6 shadow-2xl animate-in slide-in-from-top duration-300">
//                 <div className="p-4 bg-teal-500 rounded-2xl text-slate-900 shadow-xl"><Sparkles className="w-8 h-8" /></div>
//                 <div className="flex-1">
//                   <h4 className="text-white font-black uppercase text-xs tracking-widest mb-1">System Message</h4>
//                   <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase tracking-wider">{notification}</p>
//                 </div>
//                 <button onClick={() => setNotification(null)} className="text-[10px] font-black text-slate-500 uppercase hover:text-white">Dismiss</button>
//               </div>
//             </div>
//           )}
//           {fetchError && (
//             <div className="max-w-5xl mx-auto px-4 mt-8">
//               <div className="p-10 glass-card border-2 border-rose-500/30 rounded-[3rem] flex flex-col gap-8 shadow-2xl">
//                 <div className="flex items-start gap-6">
//                   <div className="p-5 bg-rose-500 rounded-[1.5rem] text-white shadow-2xl shrink-0"><ShieldAlert className="w-10 h-10" /></div>
//                   <div className="space-y-2">
//                     <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Connectivity Interruption</h4>
//                     <p className="text-sm text-slate-400 font-medium">Cloud sync failure. Using cached local storage.</p>
//                   </div>
//                 </div>
//                 <button onClick={fetchProjects} className="w-full py-4 bg-teal-500 text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
//                   <RefreshCw className="w-5 h-5" /> Force Vault Reconnect
//                 </button>
//               </div>
//             </div>
//           )}
//           <ProjectSelector 
//             projects={projects} 
//             role={userRole}
//             onSelect={setActiveProject} 
//             onCreateNew={() => setShowSetup(true)} 
//             onInjectDemo={handleInjectDemoData}
//           />
//         </div>
//       );
//     }

//     if (!activeTool) {
//       return (
//         <div className="space-y-16 py-12 animate-in fade-in duration-1000">
//           <div className="flex flex-col items-center text-center space-y-6">
//             <button
//               onClick={() => setActiveProject(null)}
//               className="flex items-center gap-3 text-[10px] font-black text-teal-400 hover:text-white transition-all uppercase tracking-[0.4em] bg-slate-800/80 px-6 py-3 rounded-full border border-white/5 hover:border-teal-500/50 shadow-2xl"
//             >
//               <ChevronLeft className="w-4 h-4" /> Switch Strategic Context
//             </button>
//             <h2 className="text-6xl font-black text-white tracking-tighter max-w-4xl leading-tight">Project Hub</h2>
//             <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed italic">
//               Active Module: <span className="text-teal-400 font-black px-3 py-1 bg-teal-500/10 rounded-xl border border-teal-500/20">{activeProject.name}</span>
//             </p>
//           </div>
//           <div className="grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto px-4 pb-20">
//             {TOOL_CARDS.map(tool => (
//               <button
//                 key={tool.id}
//                 onClick={() => handleToolSelect(tool.id as ToolType)}
//                 className="group flex flex-col text-left p-12 glass-card rounded-[4rem] border-2 border-white/5 shadow-2xl transition-all hover:shadow-[0_40px_100px_-30px_rgba(45,212,191,0.2)] hover:-translate-y-3 relative overflow-hidden"
//               >
//                 <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
//                 <div className="mb-8 p-6 bg-slate-800 rounded-3xl shadow-2xl border border-white/5 group-hover:bg-teal-500 group-hover:text-slate-900 transition-all w-fit relative z-10">
//                   {tool.icon}
//                 </div>
//                 <div className="relative z-10">
//                   <h3 className="text-3xl font-black text-white mb-4 leading-tight group-hover:text-teal-400 transition-colors tracking-tight">{tool.title}</h3>
//                   <p className="text-slate-400 font-semibold mb-10 leading-relaxed text-base group-hover:text-slate-300 transition-colors">{tool.description}</p>
//                   <div className="mt-auto flex items-center gap-4 text-xs font-black text-teal-500 uppercase tracking-[0.2em] group-hover:gap-6 transition-all">
//                     Initialize Workspace <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
//                   </div>
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="space-y-8 pb-20">
//         <div className="flex items-center justify-between glass-card px-8 py-4 rounded-[2rem] border border-white/5 shadow-2xl">
//           <button
//             onClick={() => {
//               setActiveTool(null);
//               setGa4Status('offline');
//             }}
//             className="flex items-center gap-3 text-xs font-black text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-[0.2em]"
//           >
//             <ChevronLeft className="w-5 h-5" /> Exit Workspace
//           </button>
          
//           <div className="flex items-center gap-4">
//             <div className="flex flex-col items-end">
//               <span className="text-[9px] font-black text-teal-500 uppercase tracking-widest">{userRole} AUTHENTICATED</span>
//               <span className="text-xs font-black text-slate-200 uppercase tracking-widest">
//                 {user?.is_anonymous ? 'Node-Guest' : (user?.email?.split('@')[0])}
//               </span>
//             </div>
//             <div className="h-8 w-px bg-white/10 mx-2"></div>
//             <button
//               onClick={handleLogout}
//               className="p-3 bg-slate-800 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-xl border border-white/5"
//             >
//               <LogOut className="w-5 h-5" />
//             </button>
//           </div>
//         </div>
//         <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
//           {activeTool === ToolType.SEO_Lighthouse && <SEOAnalyzer role={userRole} />}
//           {activeTool === ToolType.GA4_KPI && (
//             <GA4Analytics 
//               project={activeProject} 
//               role={userRole}
//               onStatusChange={setGa4Status} 
//               onRedirect={handleGA4Redirect}
//             />
//           )}
//           {activeTool === ToolType.EPIC_PRIORITY && <EpicPrioritizer project={activeProject} role={userRole} />}
//           {activeTool === ToolType.SENTIMENT_ANALYSIS && <SentimentAnalyzer role={userRole} />}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <Layout 
//       projectName={activeProject?.name} 
//       activeToolName={getActiveToolName()}
//       ga4Status={ga4Status}
//       onLogout={handleLogout}
//       onNavigateHome={() => {
//         setActiveProject(null);
//         setActiveTool(null);
//         setShowSetup(false);
//       }}
//       onNavigateProject={() => {
//         setActiveTool(null);
//         setShowSetup(false);
//       }}
//       userRole={userRole}
//       userEmail={user?.email}
//     >
//       {renderDashboardContent()}
//     </Layout>
//   );
// };

// export default App;


import React, { useState, useEffect } from 'react';
import { ProjectContext, ToolType, UserRole } from './types';
import { TOOL_CARDS } from './constants';
import { ProjectSetup } from './components/ProjectSetup';
import { Layout } from './components/Layout';
import { SEOAnalyzer } from './components/SEOAnalyzer';
import { GA4Analytics } from './components/GA4Analytics';
import { EpicPrioritizer } from './components/EpicPrioritizer';
import { SentimentAnalyzer } from './components/SentimentAnalyzer';
import { ReleaseReporting } from './components/ReleaseReporting';
import { Auth } from './components/Auth';
import { ProjectSelector } from './components/ProjectSelector';
import { ChevronLeft, LogOut, Sparkles, ArrowRight, RefreshCw, ShieldAlert, HelpCircle } from 'lucide-react';
import { supabase } from './supabaseClient';
import { databaseService } from './services/databaseService';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.EDITOR);
  const [projects, setProjects] = useState<ProjectContext[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectContext | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBypass, setShowBypass] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [ga4Status, setGa4Status] = useState<'active' | 'offline' | 'searching'>('offline');
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    let isInitialized = false;


          
    const initialize = async () => {
      if (isInitialized) return;
      isInitialized = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await fetchProjects();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("[Auth] Initialization failed:", err);
        setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN') {
           await fetchProjects();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProjects([]);
        setFetchError(null);
        setIsDemoMode(false);
        setLoading(false);
      }
    });

    const bypassTimer = setTimeout(() => setShowBypass(true), 4000);
    const forceClearTimer = setTimeout(() => setLoading(false), 12000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(bypassTimer);
      clearTimeout(forceClearTimer);
    };
  }, []);

  const fetchProjects = async () => {
    setFetchError(null);
    try {
      const data = await databaseService.getWorkspaces();
      if (!data || data.length === 0) {
        const cached = localStorage.getItem('productpulse_sim_data');
        if (cached) {
          setProjects(JSON.parse(cached));
          setIsDemoMode(true);
        } else {
          setProjects([]);
        }
      } else {
        setProjects(data);
        setIsDemoMode(false);
      }
    } catch (err: any) {
      setFetchError(err.message || "Failed to synchronize with strategic vault.");
      const fallback = localStorage.getItem('productpulse_fallback_workspaces');
      if (fallback) {
        setProjects(JSON.parse(fallback));
        setIsDemoMode(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInjectDemoData = (type: 'SaaS' | 'Mobile') => {
    setLoading(true);
    const demoProjects: ProjectContext[] = type === 'SaaS' ? [
      {
        id: 'demo-saas-1',
        name: 'Enterprise CRM Engine',
        type: 'SaaS',
        description: 'Global rollout for B2B CRM ecosystem. Focus on churn reduction and expansion revenue.',
        tenant_id: 'DEMO_TENANT_SAAS',
        is_demo: true
      }
    ] : [
      {
        id: 'demo-mobile-1',
        name: 'NeoFit Mobile App',
        type: 'Mobile',
        description: 'Native iOS/Android fitness ecosystem. High focus on daily active users and subscription conversion.',
        tenant_id: 'DEMO_TENANT_MOBILE',
        is_demo: true
      }
    ];

    setTimeout(() => {
      setProjects(prev => [...demoProjects, ...prev]);
      setIsDemoMode(true);
      localStorage.setItem('productpulse_sim_data', JSON.stringify([...demoProjects, ...projects]));
      setLoading(false);
      setNotification(`Simulation Mode Activated: ${type} Ecosystem Deployed Locally.`);
    }, 800);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setActiveProject(null);
      setActiveTool(null);
      setGa4Status('offline');
      setFetchError(null);
      setIsDemoMode(false);
      setShowSetup(false);
    } catch (err) {
      console.error("[Auth] Sign out error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (newProject: Omit<ProjectContext, 'id'>) => {
    setLoading(true);
    try {
      const savedProject = await databaseService.createWorkspace(newProject);
      setProjects(prev => [savedProject, ...prev]);
      setActiveProject(savedProject);
      setShowSetup(false);
      setIsDemoMode(false);
    } catch (err) {
      const localProject = { ...newProject, id: `local-${Date.now()}` } as ProjectContext;
      setProjects(prev => [localProject, ...prev]);
      setActiveProject(localProject);
      setShowSetup(false);
    } finally {
      setLoading(false);
    }
  };

        const handleDeleteProject = async (project: ProjectContext) => {
  setLoading(true);
  try {
    // If it's a real project (has id and not demo), delete from database
    if (project.id && !project.is_demo && !project.id.startsWith('local-')) {
      await databaseService.deleteWorkspace(project.id);
    }
    
    // Remove from local state
    setProjects(prev => prev.filter(p => p.id !== project.id));
    
    // If this was the active project, clear it
    if (activeProject?.id === project.id) {
      setActiveProject(null);
      setActiveTool(null);
    }
    
    setNotification(`Project "${project.name}" deleted successfully.`);
    setTimeout(() => setNotification(null), 3000);
  } catch (err: any) {
    console.error('Delete project error:', err);
    setNotification(`Failed to delete project: ${err.message}`);
    setTimeout(() => setNotification(null), 5000);
  } finally {
    setLoading(false);
  }
};
  const handleToolSelect = (toolId: ToolType) => {
    setNotification(null);
    setActiveTool(toolId);
  };

  const handleGA4Redirect = (message: string) => {
    setActiveTool(null);
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleRoleSelection = (role: UserRole) => {
    setUserRole(role);
  };

  const getActiveToolName = () => {
    if (!activeTool) return undefined;
    const tool = TOOL_CARDS.find(t => t.id === activeTool);
    return tool?.title;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] p-6 text-center">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-teal-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.4em] animate-pulse italic">
              Synchronizing Vault Access...
            </p>
          </div>
          {showBypass && (
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <button
                onClick={() => setLoading(false)}
                className="flex items-center gap-2 text-[9px] font-black text-slate-500 hover:text-teal-400 transition-all uppercase tracking-widest border border-white/5 bg-white/5 px-6 py-3 rounded-2xl"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Force Workspace Entry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onRoleSelect={handleRoleSelection} />;
  }

  const renderDashboardContent = () => {
    if (showSetup) {
      return (
        <div className="space-y-4">
          <button
            onClick={() => setShowSetup(false)}
            className="flex items-center gap-2 text-[10px] font-black text-teal-500 hover:text-teal-300 transition-colors uppercase tracking-widest ml-6 pt-6"
          >
            <ChevronLeft className="w-4 h-4" /> Return to Vault
          </button>
          <ProjectSetup onComplete={handleCreateProject} />
        </div>
      );
    }

    if (!activeProject) {
      return (
        <div className="space-y-8 pb-20">
          {notification && (
            <div className="max-w-4xl mx-auto px-4 mt-8">
              <div className="p-6 bg-teal-500/10 border-2 border-teal-500/20 rounded-[2rem] flex items-center gap-6 shadow-2xl animate-in slide-in-from-top duration-300">
                <div className="p-4 bg-teal-500 rounded-2xl text-slate-900 shadow-xl"><Sparkles className="w-8 h-8" /></div>
                <div className="flex-1">
                  <h4 className="text-white font-black uppercase text-xs tracking-widest mb-1">System Message</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase tracking-wider">{notification}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-[10px] font-black text-slate-500 uppercase hover:text-white">Dismiss</button>
              </div>
            </div>
          )}
          {fetchError && (
            <div className="max-w-5xl mx-auto px-4 mt-8">
              <div className="p-10 glass-card border-2 border-rose-500/30 rounded-[3rem] flex flex-col gap-8 shadow-2xl">
                <div className="flex items-start gap-6">
                  <div className="p-5 bg-rose-500 rounded-[1.5rem] text-white shadow-2xl shrink-0"><ShieldAlert className="w-10 h-10" /></div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Connectivity Interruption</h4>
                    <p className="text-sm text-slate-400 font-medium">Cloud sync failure. Using cached local storage.</p>
                  </div>
                </div>
                <button onClick={fetchProjects} className="w-full py-4 bg-teal-500 text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                  <RefreshCw className="w-5 h-5" /> Force Vault Reconnect
                </button>
              </div>
            </div>
          )}
          <ProjectSelector 
  projects={projects} 
  role={userRole}
  onSelect={setActiveProject} 
  onCreateNew={() => setShowSetup(true)} 
  onInjectDemo={handleInjectDemoData}
  onDelete={handleDeleteProject}
/>
        </div>
      );
    }

    if (!activeTool) {
      return (
        <div className="space-y-16 py-12 animate-in fade-in duration-1000">
          <div className="flex flex-col items-center text-center space-y-6">
            <button
              onClick={() => setActiveProject(null)}
              className="flex items-center gap-3 text-[10px] font-black text-teal-400 hover:text-white transition-all uppercase tracking-[0.4em] bg-slate-800/80 px-6 py-3 rounded-full border border-white/5 hover:border-teal-500/50 shadow-2xl"
            >
              <ChevronLeft className="w-4 h-4" /> Switch Strategic Context
            </button>
            <h2 className="text-6xl font-black text-white tracking-tighter max-w-4xl leading-tight">Project Hub</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed italic">
              Active Module: <span className="text-teal-400 font-black px-3 py-1 bg-teal-500/10 rounded-xl border border-teal-500/20">{activeProject.name}</span>
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto px-4 pb-20">
            {TOOL_CARDS.map(tool => (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id as ToolType)}
                className="group flex flex-col text-left p-12 glass-card rounded-[4rem] border-2 border-white/5 shadow-2xl transition-all hover:shadow-[0_40px_100px_-30px_rgba(45,212,191,0.2)] hover:-translate-y-3 relative overflow-hidden"
              >
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                <div className="mb-8 p-6 bg-slate-800 rounded-3xl shadow-2xl border border-white/5 group-hover:bg-teal-500 group-hover:text-slate-900 transition-all w-fit relative z-10">
                  {tool.icon}
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-black text-white mb-4 leading-tight group-hover:text-teal-400 transition-colors tracking-tight">{tool.title}</h3>
                  <p className="text-slate-400 font-semibold mb-10 leading-relaxed text-base group-hover:text-slate-300 transition-colors">{tool.description}</p>
                  <div className="mt-auto flex items-center gap-4 text-xs font-black text-teal-500 uppercase tracking-[0.2em] group-hover:gap-6 transition-all">
                    Initialize Workspace <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 pb-20">
        <div className="flex items-center justify-between glass-card px-8 py-4 rounded-[2rem] border border-white/5 shadow-2xl">
          <button
            onClick={() => {
              setActiveTool(null);
              setGa4Status('offline');
            }}
            className="flex items-center gap-3 text-xs font-black text-slate-400 hover:text-teal-400 transition-colors uppercase tracking-[0.2em]"
          >
            <ChevronLeft className="w-5 h-5" /> Exit Workspace
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-teal-500 uppercase tracking-widest">{userRole} AUTHENTICATED</span>
              <span className="text-xs font-black text-slate-200 uppercase tracking-widest">
                {user?.is_anonymous ? 'Node-Guest' : (user?.email?.split('@')[0])}
              </span>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            <button
              onClick={handleLogout}
              className="p-3 bg-slate-800 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-xl border border-white/5"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTool === ToolType.SEO_Lighthouse && <SEOAnalyzer role={userRole} />}
          {activeTool === ToolType.GA4_KPI && (
            <GA4Analytics 
              project={activeProject} 
              role={userRole}
              onStatusChange={setGa4Status} 
              onRedirect={handleGA4Redirect}
            />
          )}
          {activeTool === ToolType.EPIC_PRIORITY && <EpicPrioritizer project={activeProject} role={userRole} />}
          {activeTool === ToolType.SENTIMENT_ANALYSIS && <SentimentAnalyzer role={userRole} />}
          {activeTool === ToolType.RELEASE_REPORTING && <ReleaseReporting role={userRole} />}
        </div>
      </div>
    );
  };

  return (
    <Layout 
      projectName={activeProject?.name} 
      activeToolName={getActiveToolName()}
      ga4Status={ga4Status}
      onLogout={handleLogout}
      onNavigateHome={() => {
        setActiveProject(null);
        setActiveTool(null);
        setShowSetup(false);
      }}
      onNavigateProject={() => {
        setActiveTool(null);
        setShowSetup(false);
      }}
      userRole={userRole}
      userEmail={user?.email}
    >
      {renderDashboardContent()}
    </Layout>
  );
};

export default App;
