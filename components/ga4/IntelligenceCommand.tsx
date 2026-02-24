
import React from 'react';
import { Sparkles, Target, Send } from 'lucide-react';

interface Props {
  chatMessages: { role: 'user' | 'bot', text: string }[];
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (msg?: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
}

export const IntelligenceCommand: React.FC<Props> = ({ 
  chatMessages, 
  chatInput, 
  setChatInput, 
  handleSendMessage, 
  chatEndRef 
}) => {
  return (
    <div className="lg:col-span-1 flex flex-col h-[900px] glass-card rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden sticky top-12">
      <div className="p-8 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-slate-900 shadow-xl shadow-teal-500/20 rotate-3 transition-transform hover:rotate-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-black text-white text-base tracking-tight leading-none">Intelligence Command</h4>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Grounded AI Layer</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-900/20">
        {chatMessages.length === 0 && (
          <div className="text-center py-10 px-4 space-y-8">
            <div className="space-y-2">
              <p className="text-white font-black text-xs uppercase tracking-widest">Leadership Interface</p>
              <p className="text-slate-500 text-[10px] leading-relaxed font-bold">Ask questions grounded in your data.</p>
            </div>
            <div className="grid gap-2">
              {["Why is revenue down?", "What's the biggest risk?", "Growth blockers?"].map(q => (
                <button 
                  key={q} 
                  onClick={() => handleSendMessage(q)} 
                  className="text-[9px] font-black text-slate-400 bg-slate-800/50 hover:bg-slate-800 py-4 px-6 rounded-2xl border border-white/5 transition-all text-left flex items-center gap-3 group"
                >
                  <Target className="w-4 h-4 text-slate-600 group-hover:text-teal-400" /> {q}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-5 rounded-[1.8rem] text-xs leading-relaxed ${
              msg.role === 'user' 
              ? 'bg-teal-500 text-slate-900 rounded-tr-none font-black shadow-lg shadow-teal-500/10' 
              : 'glass-card border border-white/10 text-slate-200 rounded-tl-none font-bold'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      
      <div className="p-6 border-t border-white/5 bg-slate-900/40">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask intelligence command..." 
            className="w-full pl-6 pr-14 py-4 rounded-[1.5rem] border border-white/5 focus:border-teal-500 outline-none text-xs bg-slate-800 text-white font-bold" 
            value={chatInput} 
            onChange={e => setChatInput(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()} 
          />
          <button 
            onClick={() => handleSendMessage()} 
            className="absolute right-2 top-2 p-2.5 bg-teal-500 text-slate-900 rounded-xl hover:bg-teal-400 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
