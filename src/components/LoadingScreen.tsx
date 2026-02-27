import { useEffect, useState } from 'react';
import { LogoImg } from './Logo';

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  const phases = [
    'ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ',
    'ЗАГРУЗКА ПРОТОКОЛОВ',
    'АНТИБОТ ВЕРИФИКАЦИЯ',
    'ПОДКЛЮЧЕНИЕ К СЕРВЕРУ',
    'ГОТОВО',
  ];

  useEffect(() => {
    const duration = 2400;
    const steps = 100;
    const interval = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      setProgress(current);
      setPhase(Math.floor((current / steps) * (phases.length - 1)));
      if (current >= steps) {
        clearInterval(timer);
        setTimeout(onDone, 250);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#050508',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Grid bg */}
      <div className="grid-bg" />

      {/* Glow orbs */}
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(124,58,255,0.08)', filter: 'blur(80px)', top: '20%', left: '30%' }} />
      <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(0,255,140,0.05)', filter: 'blur(60px)', bottom: '25%', right: '30%' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '320px' }}>

        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="50" cy="50" r="48" stroke="rgba(124,58,255,0.2)" strokeWidth="1" fill="none"
                style={{ animation: 'loadSpin 4s linear infinite' }} />
              <circle cx="50" cy="50" r="40" stroke="rgba(0,255,140,0.15)" strokeWidth="1" strokeDasharray="8 4" fill="none"
                style={{ animation: 'loadSpin 2s linear infinite reverse' }} />
              <circle cx="50" cy="50" r="48" stroke="#7c3aff" strokeWidth="2.5" fill="none"
                strokeDasharray={`${progress * 3.016} 301.6`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dasharray 0.05s linear' }} />
            </svg>
            <div style={{ position: 'absolute', inset: '12px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,5,25,0.7)' }}>
              <LogoImg size={64} style={{ filter: 'drop-shadow(0 0 12px rgba(124,58,255,0.7))' }} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div className="font-orbitron" style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.15em', color: '#c084fc', marginBottom: '4px' }}>
            TRAXER
          </div>
          <div className="font-orbitron" style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.3em', color: '#00ff8c', marginBottom: '10px', textShadow: '0 0 20px rgba(0,255,140,0.6)' }}>
            PLACE
          </div>
          <div className="font-mono-tech" style={{ fontSize: '11px', color: 'rgba(0,255,140,0.4)', letterSpacing: '0.12em' }}>
            ROBLOX TOURNAMENT PLATFORM
          </div>
        </div>

        {/* Progress */}
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="font-mono-tech" style={{ fontSize: '10px', color: 'rgba(168,85,247,0.7)', letterSpacing: '0.08em' }}>
              {phases[phase]}
            </span>
            <span className="font-mono-tech" style={{ fontSize: '10px', color: 'rgba(0,255,140,0.6)' }}>
              {progress}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: '3px' }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: i < Math.floor(progress / 25) ? '#7c3aff' : 'rgba(124,58,255,0.15)',
              boxShadow: i < Math.floor(progress / 25) ? '0 0 8px rgba(124,58,255,0.8)' : 'none',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
