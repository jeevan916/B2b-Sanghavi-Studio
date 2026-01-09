
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, ChevronRight, Gem } from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Luxury Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-gold-600 rounded-full blur-[180px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900 rounded-full blur-[180px]"></div>
      </div>
      
      <div className="max-w-md w-full relative z-10 flex flex-col items-center space-y-10 animate-in fade-in zoom-in-95 duration-1000">
        
        {/* Branding */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-700 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-gold-500/20 mb-6">
             <span className="font-serif text-5xl font-bold text-stone-900">S</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-bold tracking-tight">Sanghavi</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold-500 font-bold">Bespoke Jewel Studio</p>
        </div>

        {/* Portal Entry Card */}
        <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-center gap-2 text-stone-400 mb-6">
                <Lock size={14} />
                <span className="text-[10px] uppercase font-bold tracking-widest">Authorized Access Only</span>
            </div>

            <p className="text-center text-stone-300 font-light leading-relaxed text-sm mb-8">
                Welcome to the exclusive B2B partner portal. <br/>
                Access to the digital catalog is restricted to verified registered clientele.
            </p>

            <button 
                onClick={() => navigate('/login')}
                className="w-full py-4 bg-gradient-to-r from-gold-600 to-gold-500 text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-gold-500/20 transition-all active:scale-[0.98]"
            >
                Enter Secure Portal <ChevronRight size={16} />
            </button>

            <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-stone-500">
                <span className="flex items-center gap-1"><ShieldCheck size={12}/> 256-bit Encrypted</span>
                <Link to="/staff" className="hover:text-gold-500 transition-colors">Staff Login</Link>
            </div>
        </div>

        {/* Footer Note */}
        <div className="text-center opacity-40">
            <p className="text-[9px] uppercase font-bold tracking-widest text-stone-500">Private Trade Platform • v3.5</p>
        </div>
      </div>
    </div>
  );
};
