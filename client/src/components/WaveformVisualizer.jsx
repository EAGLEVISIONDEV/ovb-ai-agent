'use client';

export default function WaveformVisualizer() {
  const bars = 12;

  return (
    <div className="flex items-center gap-[3px] h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const delay = i * 0.08;
        const duration = 0.4 + Math.random() * 0.6;
        return (
          <div
            key={i}
            className="waveform-bar bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full"
            style={{
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              width: '3px',
              minHeight: '4px',
            }}
          />
        );
      })}
    </div>
  );
}
