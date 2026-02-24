
import React from 'react';
import { Plus } from 'lucide-react';
import { DOMAIN_TYPES } from '../../constants';

interface Props {
  onSelect: (domain: any) => void;
  customDomain: { name: string; context: string };
  setCustomDomain: React.Dispatch<React.SetStateAction<{ name: string; context: string }>>;
}

export const DomainSelection: React.FC<Props> = ({ onSelect, customDomain, setCustomDomain }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-white text-center tracking-tight">Select Strategic Domain</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {DOMAIN_TYPES.map(domain => (
          <button
            key={domain.id}
            onClick={() => onSelect(domain)}
            className="p-8 text-left glass-card rounded-[2rem] border-2 border-transparent hover:border-teal-500 transition-all hover:shadow-xl flex items-start gap-5 group"
          >
            <div className="p-4 bg-slate-800 text-teal-400 rounded-2xl group-hover:bg-teal-500 group-hover:text-slate-900 transition-all border border-white/5">
              {domain.icon}
            </div>
            <div>
              <h3 className="font-black text-white text-xl tracking-tight leading-none mb-2">{domain.name}</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">{domain.description}</p>
            </div>
          </button>
        ))}
      </div>
      
      <div className="glass-card p-10 rounded-[2.5rem] border-2 border-dashed border-slate-800">
        <h3 className="font-black text-slate-400 mb-6 uppercase tracking-widest text-xs">Custom Strategy Definition</h3>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <input 
            type="text" 
            placeholder="Domain Name" 
            className="px-5 py-4 rounded-2xl border-2 border-slate-800 bg-slate-900/50 text-white font-medium focus:border-teal-500 outline-none" 
            value={customDomain.name} 
            onChange={e => setCustomDomain({ ...customDomain, name: e.target.value })} 
          />
          <input 
            type="text" 
            placeholder="Context" 
            className="px-5 py-4 rounded-2xl border-2 border-slate-800 bg-slate-900/50 text-white font-medium focus:border-teal-500 outline-none" 
            value={customDomain.context} 
            onChange={e => setCustomDomain({ ...customDomain, context: e.target.value })} 
          />
        </div>
        <button 
          onClick={() => onSelect({ name: customDomain.name, id: 'custom' })} 
          disabled={!customDomain.name} 
          className="px-8 py-4 bg-teal-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Initialize Domain
        </button>
      </div>
    </div>
  );
};
