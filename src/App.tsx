import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Chatbot } from '@/pages/Chatbot';
import { About } from '@/pages/info/About';
import { Courses } from '@/pages/info/Courses';
import { Admission } from '@/pages/info/Admission';
import { FAQPage } from '@/pages/info/FAQ';
import { Contact } from '@/pages/info/Contact';
import { Profile } from '@/pages/info/Profile';

// Auth & Admin Pages
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import type { Route } from '@/types/route';

function AppContent() {
  const { user } = useAuth();

  const getInitialRoute = (): Route => {
    try {
      const hash = window.location.hash.replace('#', '').trim();
      if (['login', 'register', 'admin-login', 'forgot-password'].includes(hash)) {
        return hash as Route;
      }
      if (hash === 'departments' || hash === 'about') return 'about';
      if (hash === 'courses') return 'courses';
      if (hash === 'admission' || hash === 'admissions') return 'admission';
      if (hash === 'faq' || hash === 'faqs') return 'faq';
      if (hash === 'contact') return 'contact';
      if (hash === 'profile') return 'profile';
      if (hash === 'chatbot') return 'chatbot';
      if (hash === 'admin' || hash === 'admin-dashboard') return 'admin-dashboard';

      const hasSession = localStorage.getItem('ucs_auth_user') || localStorage.getItem('ucs_admin_session');
      if (!hasSession) return 'login';

      const savedRoute = localStorage.getItem('ucs_current_route') as Route;
      return savedRoute || 'chatbot';
    } catch {
      return 'login';
    }
  };

  const [currentRoute, setCurrentRoute] = useState<Route>(getInitialRoute);

  const handleNavigate = (route: Route) => {
    setCurrentRoute(route);
    localStorage.setItem('ucs_current_route', route);
    window.location.hash = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (['login', 'register', 'admin-login', 'forgot-password'].includes(hash)) {
        setCurrentRoute(hash as Route);
      } else if (hash === 'departments' || hash === 'about') setCurrentRoute('about');
      else if (hash === 'courses') setCurrentRoute('courses');
      else if (hash === 'admission' || hash === 'admissions') setCurrentRoute('admission');
      else if (hash === 'faq') setCurrentRoute('faq');
      else if (hash === 'contact') setCurrentRoute('contact');
      else if (hash === 'profile') setCurrentRoute('profile');
      else if (hash === 'chatbot') setCurrentRoute('chatbot');
      else if (hash === 'admin-dashboard') setCurrentRoute('admin-dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isAuthPage = ['login', 'register', 'admin-login', 'forgot-password'].includes(currentRoute);
  const showNavbar = !isAuthPage && currentRoute !== 'admin-dashboard';

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {showNavbar && (
        <Navbar 
          currentRoute={currentRoute} 
          onNavigate={handleNavigate} 
          onSignOut={() => handleNavigate('login')} 
        />
      )}

      {/* Auth Pages */}
      {currentRoute === 'login' && <Login onNavigate={handleNavigate} />}
      {currentRoute === 'admin-login' && <AdminLogin onNavigate={handleNavigate} />}
      {currentRoute === 'register' && <Register onNavigate={handleNavigate} />}
      {currentRoute === 'forgot-password' && <ForgotPassword onNavigate={handleNavigate} />}

      {/* Main Pages */}
      {currentRoute === 'chatbot' && <Chatbot onNavigate={handleNavigate} />}
      {currentRoute === 'about' && <About />}
      {currentRoute === 'courses' && <Courses />}
      {currentRoute === 'admission' && <Admission />}
      {currentRoute === 'faq' && <FAQPage />}
      {currentRoute === 'contact' && <Contact onNavigate={handleNavigate} />}
      {currentRoute === 'profile' && <Profile onNavigate={handleNavigate} />}
      {currentRoute === 'admin-dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
