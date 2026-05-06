'use client';

import { Mic, Sparkles, Shield, Brain, MessageCircle } from 'lucide-react';

export default function IntroScreen({ onStart }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/5 blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative z-10 text-center px-6 max-w-lg space-y-10">
        {/* AI Avatar */}
        <div className="relative mx-auto w-32 h-32 animate-fadeInUp">
          {/* Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-30 blur-2xl animate-pulse" />
          {/* Ring */}
          <div className="absolute -inset-3 rounded-full border border-indigo-400/20 animate-orbFloat" />
          <div className="absolute -inset-6 rounded-full border border-indigo-400/10" />
          {/* Avatar */}
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-2xl animate-pulse-glow">
            <div className="text-5xl">🧠</div>
          </div>
          {/* Status dot */}
          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--bg-primary)] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3 animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent leading-tight">
            Ana AI
          </h1>
          <p className="text-lg text-indigo-200 font-medium">
            Consultant Financiar Virtual
          </p>
          <p className="text-sm text-indigo-300/70 leading-relaxed max-w-sm mx-auto">
            Vorbește cu Ana despre situația ta financiară. Primești o analiză personalizată și recomandări — gratuit, confidențial, fără obligații.
          </p>
        </div>

        {/* CTA */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={onStart}
            className="group relative w-full max-w-xs mx-auto py-4 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-3"
          >
            <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Începe conversația
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto animate-fadeInUp" style={{ animationDelay: '0.45s' }}>
          {[
            { icon: Mic, label: 'Conversație vocală', sub: 'în limba română' },
            { icon: Brain, label: 'AI inteligent', sub: 'powered by Claude' },
            { icon: Shield, label: '100% confidențial', sub: 'date protejate' },
            { icon: MessageCircle, label: 'Plan personalizat', sub: 'recomandări clare' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <f.icon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold text-white/90">{f.label}</p>
                <p className="text-[10px] text-indigo-300/50">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-[10px] text-indigo-400/30 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          Powered by OVB Allfinanz • AI Consultant
        </p>
      </div>
    </div>
  );
}
