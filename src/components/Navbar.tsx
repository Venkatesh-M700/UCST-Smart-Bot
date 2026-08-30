import { useState } from 'react';
import { Home, BookOpen, GraduationCap, HelpCircle, Phone, User, LogOut, Menu, X, Bot, Shield, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { useCollegeSettings } from '@/hooks/useCollegeData';
import type { Route } from '@/types/route';

interface NavbarProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  onSignOut?: () => void;
}

export function Navbar({ currentRoute, onNavigate, onSignOut }: NavbarProps) {
  const { studentSession, signOut } = useAuth();
  const { settings } = useCollegeSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check if current logged in user is Admin
  const localAuth = (() => {
    try {
      const raw = localStorage.getItem('ucs_auth_user');
      const adminFlag = localStorage.getItem('ucs_admin_session');
      const parsed = raw ? JSON.parse(raw) : null;
      return Boolean(parsed?.role === 'admin' || parsed?.email?.includes('admin') || adminFlag === 'true');
    } catch {
      return false;
    }
  })();

  const navItems: { route: Route; label: string; icon: typeof Home }[] = [
    { route: 'chatbot', label: 'Chatbot', icon: Bot },
    { route: 'about', label: 'About', icon: Home },
    { route: 'courses', label: 'Courses', icon: BookOpen },
    { route: 'admission', label: 'Admission', icon: GraduationCap },
    { route: 'faq', label: 'FAQ', icon: HelpCircle },
    { route: 'contact', label: 'Contact', icon: Phone },
  ];

  const handleNav = (route: Route) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    setMobileOpen(false);
    try {
      if (onSignOut) {
        onSignOut();
      } else if (signOut) {
        await signOut();
      }
    } catch {}

    localStorage.removeItem('ucs_auth_user');
    localStorage.removeItem('ucs_admin_session');
    localStorage.removeItem('ucs_current_route');

    onNavigate('login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 gradient-blue" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <button onClick={() => handleNav('chatbot')} className="flex items-center gap-2 shrink-0 cursor-pointer">
            <Logo logoUrl={settings?.logo_url} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-primary-900 leading-tight">UCS Tumkur</p>
              <p className="text-[10px] text-gray-500 leading-tight">AI Enquiry Portal</p>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavButton
                key={item.route}
                active={currentRoute === item.route}
                onClick={() => handleNav(item.route)}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            
            {/* 🌟 If Admin -> Show Admin Dashboard Button 🌟 */}
            {localAuth && (
              <button
                onClick={() => handleNav('admin-dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  currentRoute === 'admin-dashboard'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-primary-700 bg-primary-50 hover:bg-primary-100'
                }`}
                title="Admin Dashboard"
              >
                <Shield size={16} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* 🌟 Profile Button -> Navigates to Student Profile Page 🌟 */}
            <button
              onClick={() => handleNav('profile')}
              title="Student Profile"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                currentRoute === 'profile'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User size={16} />
              <span className="hidden sm:inline">
                {studentSession?.full_name || studentSession?.email?.split('@')[0] || 'Profile'}
              </span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              title="Logout"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white animate-fade-in">
          <nav className="px-4 py-3 space-y-1 max-w-7xl mx-auto">
            {navItems.map((item) => (
              <MobileNavButton
                key={item.route}
                active={currentRoute === item.route}
                onClick={() => handleNav(item.route)}
                icon={item.icon}
                label={item.label}
              />
            ))}
            <div className="pt-2 border-t border-gray-100 space-y-1">
              {localAuth && (
                <MobileNavButton
                  active={currentRoute === 'admin-dashboard'}
                  onClick={() => handleNav('admin-dashboard')}
                  icon={Shield}
                  label="Admin Dashboard"
                />
              )}
              <MobileNavButton
                active={currentRoute === 'profile'}
                onClick={() => handleNav('profile')}
                icon={User}
                label="Student Profile"
              />
              <MobileNavButton
                active={false}
                onClick={handleSignOut}
                icon={LogOut}
                label="Logout"
                danger
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Home; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
        active
          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-200'
          : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon: Icon, label, danger }: { active: boolean; onClick: () => void; icon: typeof Home; label: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : active
          ? 'bg-primary-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon size={18} />
      <span className="truncate text-left">{label}</span>
    </button>
  );
}

export default Navbar;
