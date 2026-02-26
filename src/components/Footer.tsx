export function Footer() {
  return (
    <footer style={{ position: 'relative', zIndex: 10, background: 'rgba(5,5,12,0.9)', borderTop: '1px solid rgba(124,58,255,0.12)', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div className="logo-icon" style={{ width: '34px', height: '34px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 8l4-4h10l4 4-9 12L3 8z" stroke="#00ff8c" strokeWidth="1.5" fill="rgba(124,58,255,0.3)" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span className="font-orbitron" style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.18em', color: '#e2d9ff' }}>
                  TRAXER
                </span>
                <span className="font-orbitron" style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.3em', color: '#00ff8c', marginTop: '1px' }}>
                  PLACE
                </span>
              </div>
            </div>
            <p style={{ fontSize: '15px', color: 'rgba(200,180,255,0.4)', lineHeight: '1.7' }}>
              Платформа розыгрышей и турниров для Roblox сообщества. Защита от мультиаккаунтов.
            </p>
          </div>

          {/* Nav */}
          <div>
            <div className="font-orbitron" style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(168,85,247,0.7)', textTransform: 'uppercase', marginBottom: '14px' }}>
              Навигация
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Главная', 'Ивенты', 'Профиль'].map(link => (
                <span key={link} style={{ fontSize: '15px', color: 'rgba(200,180,255,0.4)', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#c084fc')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,180,255,0.4)')}>
                  {link}
                </span>
              ))}
            </div>
          </div>

          {/* Discord */}
          <div>
            <div className="font-orbitron" style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(168,85,247,0.7)', textTransform: 'uppercase', marginBottom: '14px' }}>
              Сообщество
            </div>
            <a
              href="https://discord.gg/zQZUt7KvBe"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 18px', background: 'rgba(88,101,242,0.1)', border: '1px solid rgba(88,101,242,0.25)', borderRadius: '10px', textDecoration: 'none', transition: 'all 0.3s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,101,242,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(88,101,242,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,101,242,0.1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#7289da">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
              </svg>
              <div>
                <div className="font-orbitron" style={{ fontSize: '12px', fontWeight: 700, color: '#7289da', letterSpacing: '0.05em' }}>Discord Server</div>
                <div style={{ fontSize: '13px', color: 'rgba(114,137,218,0.7)', marginTop: '2px' }}>discord.gg/zQZUt7KvBe</div>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(124,58,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span className="font-mono-tech" style={{ fontSize: '13px', color: 'rgba(200,180,255,0.25)' }}>
            © 2024 Traxer Place. All rights reserved.
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-dot-active" />
            <span className="font-mono-tech" style={{ fontSize: '13px', color: 'rgba(0,255,140,0.5)' }}>SYSTEM ONLINE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
