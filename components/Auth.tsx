import React, { useState } from 'react';
import { ShieldCheck, Loader2, UserCheck, Edit3 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';

interface Props {
  onRoleSelect: (role: UserRole) => void;
}

export const Auth: React.FC<Props> = ({ onRoleSelect }) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setMessage(err.message || 'Google authentication failed.');
      setGoogleLoading(false);
    }
  };

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

        <div className="space-y-6">
          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-4 py-6 px-8 bg-white text-slate-900 rounded-2xl hover:bg-gray-50 transition-all shadow-2xl shadow-white/10 disabled:opacity-50 border border-white/20"
          >
            {googleLoading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="text-xs font-black uppercase tracking-widest">Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-slate-900 text-slate-500 uppercase tracking-widest font-bold">Or</span>
            </div>
          </div>

          {/* Guest Login Section */}
          <div className="p-8 rounded-[2rem] bg-teal-500/10 border-2 border-teal-500/20 text-center space-y-4">
            <div className="w-12 h-12 bg-slate-900 text-teal-400 rounded-xl flex items-center justify-center mx-auto shadow-xl">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Guest Access</h3>
              <p className="text-xs text-slate-400">Limited features, no data persistence</p>
            </div>
          </div>

          <button
            onClick={handleGuestLogin}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-4 py-6 px-8 bg-teal-500 text-slate-950 rounded-2xl hover:bg-teal-400 transition-all shadow-2xl shadow-teal-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            <span className="text-xs font-black uppercase tracking-widest">Continue as Guest</span>
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
