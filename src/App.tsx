import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { initDB, getCurrentUser, logout, User } from './store/db';
import { Navbar } from './components/Navbar';
import { LoadingScreen } from './components/LoadingScreen';
import { Particles } from './components/Particles';
import { ToastContainer } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { Footer } from './components/Footer';

type Page = 'home' | 'login' | 'register' | 'events' | 'event-detail' | 'profile' | 'admin';

interface ToastItem { id: string; message: string; type: 'success' | 'error' | 'info'; }

interface AppCtx {
  user: User | null;
  refreshUser: () => Promise<void>;
  navigate: (page: Page, data?: any) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  currentPage: Page;
}

export const AppContext = createContext<AppCtx>({
  user: null, refreshUser: async () => {}, navigate: () => {}, showToast: () => {}, currentPage: 'home',
});

export const useApp = () => useContext(AppContext);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [pageData, setPageData] = useState<any>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    initDB().then(async () => {
      const u = await getCurrentUser();
      setUser(u);
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
  }, []);

  const navigate = useCallback((page: Page, data?: any) => {
    setCurrentPage(page);
    setPageData(data || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, message: msg, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setCurrentPage('home');
    showToast('Вы вышли из аккаунта', 'info');
  };

  if (loading) return <LoadingScreen onDone={() => setLoading(false)} />;

  const renderPage = () => {
    switch (currentPage) {
      case 'login': return <LoginPage />;
      case 'register': return <RegisterPage />;
      case 'events': return <EventsPage />;
      case 'event-detail': return <EventDetailPage eventId={pageData?.eventId} />;
      case 'profile': return <ProfilePage />;
      case 'admin': return user?.isAdmin ? <AdminPage /> : <HomePage />;
      default: return <HomePage />;
    }
  };

  return (
    <AppContext.Provider value={{ user, refreshUser, navigate, showToast, currentPage }}>
      <div style={{ minHeight: '100vh', background: '#050508', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div className="grid-bg" />
        <div className="scanlines" />
        <Particles />
        <Navbar onLogout={handleLogout} />
        <main style={{ position: 'relative', zIndex: 2, paddingTop: '60px', flex: 1 }}>
          {renderPage()}
        </main>
        <Footer />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </AppContext.Provider>
  );
}
