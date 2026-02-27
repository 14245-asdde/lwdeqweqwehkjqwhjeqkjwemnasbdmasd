import { useState } from 'react';

interface LogoProps {
  size?: number;
  style?: React.CSSProperties;
}

// Fallback текстовый лого если картинка не найдена
function TextLogo({ size }: { size: number }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #7c3aff 0%, #00ff8c 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.35,
      fontWeight: 900,
      fontFamily: 'Orbitron, sans-serif',
      color: '#fff',
      letterSpacing: '-0.05em',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      TP
    </div>
  );
}

export function LogoImg({ size = 36, style }: LogoProps) {
  const [failed, setFailed] = useState(false);
  const [srcIdx, setSrcIdx] = useState(0);

  // Пробуем разные пути
  const srcs = [
    '/p1.png',
    './p1.png',
    '/src/p1.png',
  ];

  if (failed) return <TextLogo size={size} />;

  return (
    <img
      src={srcs[srcIdx]}
      alt="Traxer Place"
      onError={() => {
        if (srcIdx + 1 < srcs.length) {
          setSrcIdx(i => i + 1);
        } else {
          setFailed(true);
        }
      }}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: 'drop-shadow(0 0 6px rgba(124,58,255,0.6))',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
