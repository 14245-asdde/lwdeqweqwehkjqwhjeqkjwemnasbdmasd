import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  gravity: number;
  decay: number;
  trail: { x: number; y: number }[];
}

interface FireworkShell {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  exploded: boolean;
  color: string;
}

const COLORS = [
  '#7c3aff', '#a855f7', '#c084fc',
  '#00ff8c', '#00e676', '#69ffb4',
  '#f97316', '#fb923c', '#fbbf24',
  '#ef4444', '#22d3ee', '#ffffff',
];

export function Fireworks({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shellsRef = useRef<FireworkShell[]>([]);
  const animRef = useRef<number>(0);
  const launchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const explode = useCallback((x: number, y: number, color: string) => {
    const count = 80 + Math.random() * 60;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 2 + Math.random() * 5;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: 2 + Math.random() * 3,
        gravity: 0.08 + Math.random() * 0.06,
        decay: 0.012 + Math.random() * 0.01,
        trail: [],
      });
    }
    // Star burst extra
    const starCount = 12;
    for (let i = 0; i < starCount; i++) {
      const angle = (Math.PI * 2 * i) / starCount;
      const speed2 = 6 + Math.random() * 4;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed2,
        vy: Math.sin(angle) * speed2,
        alpha: 1,
        color: '#ffffff',
        size: 3,
        gravity: 0.05,
        decay: 0.018,
        trail: [],
      });
    }
  }, []);

  const launchShell = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const x = canvas.width * 0.2 + Math.random() * canvas.width * 0.6;
    const targetY = canvas.height * 0.1 + Math.random() * canvas.height * 0.4;
    shellsRef.current.push({
      x,
      y: canvas.height,
      vy: -(canvas.height - targetY) / 35,
      targetY,
      exploded: false,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(5,5,12,0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update & draw shells
    shellsRef.current = shellsRef.current.filter(shell => {
      if (shell.exploded) return false;
      shell.y += shell.vy;

      // Draw shell trail
      ctx.beginPath();
      ctx.arc(shell.x, shell.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = shell.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = shell.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (shell.y <= shell.targetY) {
        shell.exploded = true;
        explode(shell.x, shell.y, shell.color);
        // Double explosion with offset
        setTimeout(() => explode(shell.x + (Math.random() - 0.5) * 30, shell.y + (Math.random() - 0.5) * 20, COLORS[Math.floor(Math.random() * COLORS.length)]), 80);
        return false;
      }
      return true;
    });

    // Update & draw particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 5) p.trail.shift();

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.alpha -= p.decay;

      if (p.alpha <= 0) return false;

      // Trail
      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.strokeStyle = p.color + Math.floor(p.alpha * 80).toString(16).padStart(2, '0');
        ctx.lineWidth = p.size * 0.5;
        ctx.stroke();
      }

      // Particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.shadowBlur = 8 * p.alpha;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      return true;
    });

    animRef.current = requestAnimationFrame(draw);
  }, [explode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    if (active) {
      animRef.current = requestAnimationFrame(draw);

      // Launch pattern: rapid at start, then slower
      let count = 0;
      const rapidLaunch = setInterval(() => {
        launchShell();
        if (Math.random() > 0.5) launchShell();
        count++;
        if (count > 8) {
          clearInterval(rapidLaunch);
          launchIntervalRef.current = setInterval(() => {
            launchShell();
            if (Math.random() > 0.6) launchShell();
          }, 600);
        }
      }, 150);

      return () => {
        clearInterval(rapidLaunch);
        if (launchIntervalRef.current) clearInterval(launchIntervalRef.current);
        cancelAnimationFrame(animRef.current);
        window.removeEventListener('resize', resize);
      };
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [active, draw, launchShell]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    />
  );
}
