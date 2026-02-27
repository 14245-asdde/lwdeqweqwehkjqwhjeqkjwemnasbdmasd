import { useEffect, useState } from 'react';
import { LogoImg } from './Logo';

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase]       = useState(0);

  const phases = [
    'ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ',
    'ЗАГРУЗКА ПРОТОКОЛОВ',
    'АНТИБОТ ВЕРИФИКАЦИЯ',
    'ПОДКЛЮЧЕНИЕ К СЕРВЕРУ',
    'ГОТОВО',
  ];

  useEffect(() => {
    const duration = 2400;
    const steps    = 100;
    const interval = duration / steps;
    let current    = 0;
    const timer = setInterval(() => {
      current++;
      setProgress(current);
      setPhase(Math.floor((current / steps) * (phases.length - 1)));
      if (current >= steps) { clearInterval(timer); setTimeout(onDone, 250); }
    }, interval);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#02020a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="grid-bg" />

      {/* Ambient orbs */}
      <div style={{ position: 'absolute', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(255,149,0,0.07)', filter: 'blur(90px)', top: '15%', left: '28%' }} />
      <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(0,207,255,0.05)', filter: 'blur(70px)', bottom: '20%', right: '28%' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '320px' }}>

        {/* Logo ring */}
        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="50" cy="50" r="48" stroke="rgba(255,149,0,0.15)" strokeWidth="1" fill="none"
              style={{ animation: 'loadSpin 4s linear infinite' }} />
            <circle cx="50" cy="50" r="40" stroke="rgba(0,207,255,0.12)" strokeWidth="1" strokeDasharray="8 4" fill="none"
              style={{ animation: 'loadSpin 2s linear infinite reverse' }} />
            {/* Progress arc — orange */}
            <circle cx="50" cy="50" r="48" stroke="#ff9500" strokeWidth="2.5" fill="none"
              strokeDasharray={`${progress * 3.016} 301.6`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 0.05s linear', filter: 'drop-shadow(0 0 6px rgba(255,149,0,0.7))' }} />
            {/* Cyan trailing arc */}
            <circle cx="50" cy="50" r="48" stroke="#00cfff" strokeWidth="1" fill="none"
              strokeDasharray={`${Math.max(0, progress * 3.016 - 30)} 301.6`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 0.05s linear', opacity: 0.4 }} />
          </svg>
          <div style={{ position: 'absolute', inset: '12px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,4,18,0.75)' }}>
            <LogoImg size={64} style={{ filter: 'drop-shadow(0 0 14px rgba(255,149,0,0.65))' }} />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div className="font-orbitron" style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.18em', color: '#ffb340', marginBottom: '2px', textShadow: '0 0 24px rgba(255,149,0,0.6)' }}>
            TRAXER
          </div>
          <div className="font-orbitron" style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.35em', color: '#00cfff', marginBottom: '12px', textShadow: '0 0 22px rgba(0,207,255,0.6)' }}>
            PLACE
          </div>
          <div className="font-mono-tech" style={{ fontSize: '11px', color: 'rgba(0,207,255,0.4)', letterSpacing: '0.12em' }}>
            ROBLOX TOURNAMENT PLATFORM
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="font-mono-tech" style={{ fontSize: '10px', color: 'rgba(255,179,64,0.7)', letterSpacing: '0.08em' }}>
              {phases[phase]}
            </span>
            <span className="font-mono-tech" style={{ fontSize: '10px', color: 'rgba(0,207,255,0.7)' }}>
              {progress}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: '3px' }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Stage dots */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: i < Math.floor(progress / 25) ? '#ff9500' : 'rgba(255,149,0,0.12)',
              boxShadow: i < Math.floor(progress / 25) ? '0 0 8px rgba(255,149,0,0.8)' : 'none',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
