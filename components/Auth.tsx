import React, { useState } from 'react';
import { ShieldCheck, Loader2, UserCheck, Edit3 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

interface Props {
  onRoleSelect: (role: UserRole) => void;
}

export const Auth: React.FC<Props> = ({ onRoleSelect }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGuestLogin = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      onRoleSelect(UserRole.EDITOR);
    } catch (err: any) {
      setMessage(err.message || 'Guest protocol failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full glass-card rounded-[4rem] p-16 shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-slate-800 rounded-[2.5rem] border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <UserCheck className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-3">Product Pulse</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Product Toolkit</p>
        </div>

        <div className="space-y-8">
          <div className="p-8 rounded-[2rem] bg-teal-500/10 border-2 border-teal-500/20 text-center space-y-4">
             <div className="w-12 h-12 bg-slate-900 text-teal-400 rounded-xl flex items-center justify-center mx-auto shadow-xl">
               <Edit3 className="w-6 h-6" />
             </div>
           
          </div>

          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 py-6 px-8 bg-teal-500 text-slate-950 rounded-2xl hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            <span className="text-xs font-black uppercase tracking-widest">Continue to tool</span>
          </button>

          {message && (
            <p className="text-center text-[10px] font-black text-rose-400 uppercase tracking-widest animate-pulse">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
