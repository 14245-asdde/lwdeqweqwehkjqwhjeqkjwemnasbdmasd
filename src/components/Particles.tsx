import { useEffect, useRef } from 'react';

export function Particles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const colors = ['#7c3aff', '#a855f7', '#00ff8c', '#5b21b6', '#c084fc'];
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < 28; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      const size = Math.random() * 3 + 1;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const duration = Math.random() * 18 + 12;
      const delay = Math.random() * 15;
      const left = Math.random() * 100;

      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${left}%;
        bottom: -10px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        box-shadow: 0 0 ${size * 3}px ${color};
        opacity: 0;
      `;
      container.appendChild(el);
      particles.push(el);
    }

    return () => { particles.forEach(p => p.remove()); };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}
    />
  );
}
