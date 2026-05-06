'use client';

// Deterministic durations to avoid SSR/client hydration mismatch
const BAR_DURATIONS = [0.7, 0.5, 0.9, 0.6, 0.8, 0.4, 1.0, 0.55, 0.75, 0.65, 0.85, 0.45];

export default function WaveformVisualizer() {
  return (
    <div className="flex items-center gap-[3px] h-8">
      {BAR_DURATIONS.map((duration, i) => (
        <div
          key={i}
          className="waveform-bar bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full"
          style={{
            animationDelay: `${i * 0.08}s`,
            animationDuration: `${duration}s`,
            width: '3px',
            minHeight: '4px',
          }}
        />
      ))}
    </div>
  );
}
