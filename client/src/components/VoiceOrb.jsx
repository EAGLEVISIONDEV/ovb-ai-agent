'use client';

import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';

const ORB_STYLES = {
  idle:      { gradient: 'from-indigo-500 to-purple-600', glow: 'shadow-indigo-600/30', ring: 'border-indigo-400/20' },
  listening: { gradient: 'from-rose-500 to-pink-600',     glow: 'shadow-rose-600/40',    ring: 'border-rose-400/30' },
  thinking:  { gradient: 'from-amber-500 to-orange-600',  glow: 'shadow-amber-600/30',   ring: 'border-amber-400/20' },
  speaking:  { gradient: 'from-emerald-500 to-teal-600',  glow: 'shadow-emerald-600/30', ring: 'border-emerald-400/20' },
};

export default function VoiceOrb({ status, hasMic, onMicStart, onMicStop }) {
  const s = ORB_STYLES[status] || ORB_STYLES.idle;
  const isActive = status !== 'idle';
  const canTap = (status === 'idle' && hasMic) || status === 'listening';

  const handleClick = () => {
    if (status === 'listening') {
      onMicStop();
    } else if (status === 'idle' && hasMic) {
      onMicStart();
    }
  };

  return (
    <div className="relative">
      {/* Outer glow */}
      {isActive && (
        <div className={`absolute -inset-6 rounded-full bg-gradient-to-r ${s.gradient} opacity-15 blur-2xl animate-pulse`} />
      )}

      {/* Ripple rings (listening) */}
      {status === 'listening' && (
        <>
          <div className={`absolute -inset-2 rounded-full border-2 ${s.ring} animate-ping`} style={{ animationDuration: '1.5s' }} />
          <div className={`absolute -inset-5 rounded-full border ${s.ring} animate-ping`} style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <div className={`absolute -inset-8 rounded-full border ${s.ring} opacity-50 animate-ping`} style={{ animationDuration: '2.5s', animationDelay: '0.6s' }} />
        </>
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        disabled={!canTap}
        className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center transition-all duration-300 shadow-2xl ${s.glow} ${
          canTap ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
        } ${isActive ? 'animate-pulse scale-105' : ''}`}
        style={{ animationDuration: status === 'listening' ? '1.2s' : '2.5s' }}
      >
        {status === 'listening' ? (
          <MicOff className="w-8 h-8 text-white drop-shadow-md" />
        ) : status === 'thinking' ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : status === 'speaking' ? (
          <Volume2 className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white drop-shadow-md" />
        )}
      </button>

      {/* Label */}
      <p className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap transition-colors ${
        status === 'listening' ? 'text-rose-400' :
        status === 'thinking' ? 'text-amber-400' :
        status === 'speaking' ? 'text-emerald-400' :
        'text-white/30'
      }`}>
        {status === 'listening' ? 'Apasă pentru a opri' :
         status === 'thinking' ? 'Ana se gândește...' :
         status === 'speaking' ? 'Ana vorbește...' :
         hasMic ? 'Apasă pentru a vorbi' : ''}
      </p>
    </div>
  );
}
