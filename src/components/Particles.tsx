import { useEffect, useRef } from 'react';

export function Particles() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const colors = [
      'rgba(255,149,0,0.55)',
      'rgba(255,179,64,0.45)',
      'rgba(0,207,255,0.45)',
      'rgba(255,208,96,0.35)',
      'rgba(0,180,220,0.35)',
      'rgba(255,100,0,0.4)',
    ];

    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div');
      const size = Math.random() * 3 + 1;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const duration = Math.random() * 18 + 10;
      const delay = Math.random() * 12;
      const left = Math.random() * 100;

      p.className = 'particle';
      p.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${left}%;
        animation-duration: ${duration}s;
        animation-delay: -${delay}s;
        box-shadow: 0 0 ${size * 3}px ${color};
      `;
      el.appendChild(p);
      particles.push(p);
    }

    return () => { particles.forEach(p => p.remove()); };
  }, []);

  return <div ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
