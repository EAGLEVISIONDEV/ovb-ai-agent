'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, Bot, User, Phone, FileText, X } from 'lucide-react';
import VoiceOrb from './VoiceOrb';
import WaveformVisualizer from './WaveformVisualizer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/* ─── Helpers ──────────────────────────────────────────── */
function getBestRoVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  const ro = voices.filter(v => v.lang.startsWith('ro'));
  return ro.find(v => /ioana|anna|female/i.test(v.name)) || ro[0] || null;
}

function speakText(text, voice) {
  return new Promise(resolve => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ro-RO';
    if (voice) u.voice = voice;
    u.rate = 1.0;
    u.pitch = 1.05;
    u.volume = 1;
    u.onend = resolve;
    u.onerror = resolve;
    window.speechSynthesis.speak(u);
  });
}

export default function ChatInterface({ sessionId: initialSessionId }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | listening | thinking | speaking
  const [input, setInput] = useState('');
  const [voice, setVoice] = useState(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [hasMic, setHasMic] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState(null);
  const [extracting, setExtracting] = useState(false);

  const recogRef = useRef(null);
  const chatEnd = useRef(null);
  const inputRef = useRef(null);
  const greetSent = useRef(false);

  // Load voice
  useEffect(() => {
    const load = () => setVoice(getBestRoVoice());
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

  // Check mic
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setHasMic(!!SR);
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Auto-greet
  useEffect(() => {
    if (!greetSent.current) {
      greetSent.current = true;
      sendMessage('Bună!', true);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (text, isGreeting = false) => {
    if (!text?.trim()) return;
    const userMsg = text.trim();

    if (!isGreeting) {
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    }
    setInput('');
    setStatus('thinking');

    try {
      const res = await fetch(`${API}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMsg }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Server error');
      }

      const data = await res.json();
      if (data.sessionId && !sessionId) setSessionId(data.sessionId);

      if (isGreeting) {
        setMessages([{ role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }

      if (voiceOn) {
        setStatus('speaking');
        await speakText(data.response, voice);
      }

      setStatus('idle');
      // Focus input after response
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ups, a apărut o eroare. Te rog încearcă din nou.',
        isError: true,
      }]);
      setStatus('idle');
    }
  }, [sessionId, voiceOn, voice]);

  // Speech recognition
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    window.speechSynthesis?.cancel();

    const r = new SR();
    r.lang = 'ro-RO';
    r.interimResults = true;
    r.continuous = false;

    r.onstart = () => setStatus('listening');
    r.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setInput(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        setTimeout(() => sendMessage(transcript), 300);
      }
    };
    r.onerror = () => setStatus('idle');
    r.onend = () => { if (status === 'listening') setStatus('idle'); };

    recogRef.current = r;
    r.start();
  };

  const stopListening = () => {
    recogRef.current?.stop();
    setStatus('idle');
  };

  // Extract lead report
  const extractReport = async () => {
    if (!sessionId || extracting) return;
    setExtracting(true);
    try {
      const res = await fetch(`${API}/api/ai/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      setReport(data.lead);
      setShowReport(true);
    } catch (err) {
      console.error('Extract error:', err);
    } finally {
      setExtracting(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const userMsgCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-black/30 backdrop-blur-xl flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <span className="text-lg">🧠</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Ana AI
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h1>
            <p className={`text-[10px] font-medium transition-colors ${
              status === 'listening' ? 'text-rose-400' :
              status === 'thinking' ? 'text-amber-400' :
              status === 'speaking' ? 'text-emerald-400' :
              'text-indigo-300/60'
            }`}>
              {status === 'listening' ? '🎤 Te ascult...' :
               status === 'thinking' ? '🤔 Mă gândesc...' :
               status === 'speaking' ? '🔊 Vorbesc...' :
               'Online — Consultant Financiar AI'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {userMsgCount >= 3 && (
            <button
              onClick={extractReport}
              disabled={extracting}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-300 transition-all flex items-center gap-1"
              title="Generează raport"
            >
              {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span className="text-[10px] hidden sm:inline">Raport</span>
            </button>
          )}
          <button
            onClick={() => { setVoiceOn(!voiceOn); if (voiceOn) window.speechSynthesis?.cancel(); }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-300 transition-all"
          >
            {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 relative">
        {/* Gradient fade at top */}
        <div className="sticky top-0 h-6 bg-gradient-to-b from-[var(--bg-primary)] to-transparent -mt-5 -mx-4 px-4 z-10" />

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 max-w-2xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${
              msg.role === 'user' ? 'animate-slideInRight' : 'animate-slideInLeft'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-indigo-600/20">
                <span className="text-sm">🧠</span>
              </div>
            )}
            <div className={`max-w-[78%] px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600/90 text-white rounded-2xl rounded-br-md shadow-lg shadow-indigo-600/20'
                : `bg-white/[0.06] text-indigo-50 rounded-2xl rounded-bl-md border border-white/[0.06] backdrop-blur-sm ${msg.isError ? 'border-red-500/30 text-red-200' : ''}`
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-white/50" />
              </div>
            )}
          </div>
        ))}

        {/* Thinking dots */}
        {status === 'thinking' && (
          <div className="flex gap-2.5 max-w-2xl mx-auto animate-fadeIn">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/20">
              <span className="text-sm">🧠</span>
            </div>
            <div className="bg-white/[0.06] rounded-2xl rounded-bl-md px-5 py-4 border border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEnd} />
      </div>

      {/* Voice orb + waveform */}
      <div className="flex-shrink-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pt-4 pb-2 px-4">
        {/* Waveform when speaking */}
        {status === 'speaking' && (
          <div className="flex justify-center mb-3">
            <WaveformVisualizer />
          </div>
        )}

        {/* Central voice orb */}
        <div className="flex justify-center mb-4">
          <VoiceOrb
            status={status}
            hasMic={hasMic}
            onMicStart={startListening}
            onMicStop={stopListening}
          />
        </div>

        {/* Text input */}
        <div className="max-w-lg mx-auto flex gap-2 mb-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={status === 'listening' ? '🎤 Te ascult...' : 'Sau scrie un mesaj...'}
            disabled={status === 'thinking' || status === 'speaking'}
            className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/30 outline-none transition-all disabled:opacity-40"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || status !== 'idle'}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all disabled:opacity-20 disabled:hover:bg-indigo-600 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-[9px] text-white/15 mb-1">
          {hasMic ? 'Apasă microfonul sau scrie • Conversație 100% confidențială' : 'Scrie un mesaj • Conversație 100% confidențială'}
        </p>
      </div>

      {/* Report Modal */}
      {showReport && report && (
        <ReportModal report={report} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}

/* ─── Report Modal ──────────────────────────────────────── */
function ReportModal({ report, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-[#111133] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col animate-fadeInUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">📋 Profil Client</h2>
            <p className="text-xs text-indigo-300/60">Extras automat din conversație</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Score */}
          {report.financialScore && (
            <div className="text-center mb-4">
              <div className="relative w-24 h-24 mx-auto mb-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={report.financialScore >= 70 ? '#10b981' : report.financialScore >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="6" strokeDasharray={`${report.financialScore * 2.64} 264`} strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">{report.financialScore}</span>
                  <span className="text-[8px] text-indigo-300 uppercase">scor</span>
                </div>
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Nume', value: report.name },
              { label: 'Vârstă', value: report.age ? `${report.age} ani` : null },
              { label: 'Ocupație', value: report.occupation },
              { label: 'Familie', value: report.familyStatus },
              { label: 'Venit lunar', value: report.monthlyIncome ? `${report.monthlyIncome.toLocaleString()} RON` : null },
              { label: 'Economii', value: report.monthlySavings ? `${report.monthlySavings.toLocaleString()} RON/lună` : null },
              { label: 'Asigurare', value: report.hasInsurance != null ? (report.hasInsurance ? 'Da' : 'Nu') : null },
              { label: 'Credit activ', value: report.hasCredit != null ? (report.hasCredit ? 'Da' : 'Nu') : null },
              { label: 'Copii', value: report.numberOfKids != null ? `${report.numberOfKids}` : null },
              { label: 'Profil risc', value: report.riskProfile },
            ].filter(x => x.value != null).map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <p className="text-[9px] text-indigo-300/50 uppercase font-bold">{item.label}</p>
                <p className="text-sm text-white font-medium mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Goals */}
          {report.goals?.length > 0 && (
            <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20">
              <p className="text-[10px] text-indigo-400 font-bold uppercase mb-2">🎯 Obiective</p>
              <div className="flex flex-wrap gap-1.5">
                {report.goals.map((g, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-xs text-indigo-200 border border-indigo-500/20">{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {report.summary && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-indigo-300/50 font-bold uppercase mb-2">📝 Rezumat</p>
              <p className="text-sm text-indigo-100 leading-relaxed">{report.summary}</p>
            </div>
          )}

          {/* Recommended */}
          {report.recommendedProducts?.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-600/10 border border-emerald-500/20">
              <p className="text-[10px] text-emerald-400 font-bold uppercase mb-2">✅ Recomandat</p>
              <ul className="space-y-1">
                {report.recommendedProducts.map((p, i) => (
                  <li key={i} className="text-sm text-emerald-200 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Readiness */}
          {report.readiness && (
            <div className={`text-center p-3 rounded-xl ${
              report.readiness === 'hot' ? 'bg-rose-600/10 border border-rose-500/20' :
              report.readiness === 'warm' ? 'bg-amber-600/10 border border-amber-500/20' :
              'bg-blue-600/10 border border-blue-500/20'
            }`}>
              <span className="text-xs font-bold uppercase">
                {report.readiness === 'hot' ? '🔥 Lead HOT — Contactează ASAP' :
                 report.readiness === 'warm' ? '☀️ Lead WARM — Follow up recomandat' :
                 '❄️ Lead COLD — Necesită nurturing'}
              </span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all">
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}
