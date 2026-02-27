import { useEffect, useRef } from 'react';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  width: number;
  height: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'star';
  gravity: number;
  wobble: number;
  wobbleSpeed: number;
  wobbleAngle: number;
}

const COLORS = [
  '#7c3aff', '#a855f7', '#c084fc', '#d946ef',
  '#00ff8c', '#00e676', '#69ffb4', '#00bcd4',
  '#f97316', '#fbbf24', '#ef4444', '#ec4899',
  '#ffffff', '#e2d9ff', '#22d3ee',
];

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animRef = useRef<number>(0);
  const spawnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createParticle = (canvas: HTMLCanvasElement): ConfettiParticle => {
    return {
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      width: Math.random() * 12 + 6,
      height: Math.random() * 6 + 4,
      opacity: 1,
      shape: (['rect', 'circle', 'star'] as const)[Math.floor(Math.random() * 3)],
      gravity: 0.08 + Math.random() * 0.06,
      wobble: 0,
      wobbleSpeed: Math.random() * 0.08 + 0.02,
      wobbleAngle: Math.random() * Math.PI * 2,
    };
  };

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const x = cx + Math.cos(angle) * size;
      const y = cy + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      const innerAngle = angle + Math.PI / 5;
      ctx.lineTo(cx + Math.cos(innerAngle) * size * 0.4, cy + Math.sin(innerAngle) * size * 0.4);
    }
    ctx.closePath();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    if (!active) {
      window.removeEventListener('resize', resize);
      return;
    }

    // Initial burst
    for (let i = 0; i < 120; i++) {
      const p = createParticle(canvas);
      p.y = Math.random() * canvas.height * 0.3;
      particlesRef.current.push(p);
    }

    // Continuous spawn
    spawnIntervalRef.current = setInterval(() => {
      if (!canvas) return;
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push(createParticle(canvas));
      }
    }, 150);

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx + Math.sin(p.wobbleAngle) * 1.5;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        p.wobbleAngle += p.wobbleSpeed;
        p.wobble += p.wobbleSpeed;
        p.vx *= 0.99;

        // Fade out near bottom
        if (p.y > canvas.height * 0.8) {
          p.opacity = Math.max(0, 1 - (p.y - canvas.height * 0.8) / (canvas.height * 0.2));
        }

        if (p.y > canvas.height + 20 || p.opacity <= 0) return false;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.width / 2);
          ctx.fill();
        }

        ctx.restore();
        return true;
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      particlesRef.current = [];
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'none',
      }}
    />
  );
}
