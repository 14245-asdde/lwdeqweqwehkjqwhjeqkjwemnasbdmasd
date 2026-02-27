interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmText = 'ПОДТВЕРДИТЬ',
  cancelText = 'ОТМЕНА',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeInUp 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(8,6,20,0.98)',
          border: `1px solid ${danger ? 'rgba(239,68,68,0.35)' : 'rgba(124,58,255,0.35)'}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: danger
            ? '0 0 60px rgba(239,68,68,0.15), 0 30px 80px rgba(0,0,0,0.8)'
            : '0 0 60px rgba(124,58,255,0.15), 0 30px 80px rgba(0,0,0,0.8)',
          animation: 'panelEnter 0.25s cubic-bezier(0.23,1,0.32,1)',
        }}
      >
        {/* Top bar */}
        <div style={{
          height: '3px',
          background: danger
            ? 'linear-gradient(90deg, #ef4444, #f97316)'
            : 'linear-gradient(90deg, #7c3aff, #00ff8c)',
        }} />

        <div style={{ padding: '32px' }}>
          {/* Icon */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(124,58,255,0.1)',
            border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,255,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', marginBottom: '20px',
          }}>
            {danger ? '⚠️' : '❓'}
          </div>

          <h2 style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '16px',
            fontWeight: 900,
            color: danger ? '#f87171' : '#c084fc',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}>
            {title}
          </h2>

          <p style={{
            fontSize: '15px',
            color: 'rgba(200,180,255,0.7)',
            fontFamily: 'Rajdhani, sans-serif',
            lineHeight: 1.6,
            marginBottom: '28px',
          }}>
            {message}
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '13px',
                fontFamily: 'Orbitron, monospace',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(120,60,255,0.2)',
                color: 'rgba(200,180,255,0.5)',
                borderRadius: '9px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(124,58,255,0.1)';
                e.currentTarget.style.color = '#c084fc';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.color = 'rgba(200,180,255,0.5)';
              }}
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: '13px',
                fontFamily: 'Orbitron, monospace',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                background: danger
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))'
                  : 'linear-gradient(135deg, #7c3aff, #5b21b6)',
                border: `1px solid ${danger ? 'rgba(239,68,68,0.5)' : 'rgba(168,85,247,0.5)'}`,
                color: danger ? '#f87171' : '#fff',
                borderRadius: '9px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: danger
                  ? '0 0 20px rgba(239,68,68,0.15)'
                  : '0 0 20px rgba(124,58,255,0.3)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = danger
                  ? '0 0 30px rgba(239,68,68,0.3)'
                  : '0 0 30px rgba(124,58,255,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = danger
                  ? '0 0 20px rgba(239,68,68,0.15)'
                  : '0 0 20px rgba(124,58,255,0.3)';
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
