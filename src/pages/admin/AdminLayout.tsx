import { useState } from 'react';
import {
  LayoutDashboard, Megaphone, Building2, BookOpen, HelpCircle, Brain,
  MessageSquare, Settings, LogOut, Menu, X, ArrowLeft, Shield, GraduationCap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Route } from '@/types/route';

interface AdminLayoutProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  onSignOut: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const NAV_ITEMS: { route: Route; label: string; icon: typeof Shield }[] = [
  { route: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: 'admin-announcements', label: 'Announcements', icon: Megaphone },
  { route: 'admin-college-info', label: 'College Information', icon: Building2 },
  { route: 'admin-courses', label: 'Courses', icon: BookOpen },
  { route: 'admin-faqs', label: 'FAQs', icon: HelpCircle },
  { route: 'admin-knowledge', label: 'AI Knowledge', icon: Brain },
  { route: 'admin-chat-history', label: 'Chat History', icon: MessageSquare },
  { route: 'admin-settings', label: 'College Settings', icon: Settings },
];

export function AdminLayout({ currentRoute, onNavigate, onSignOut, title, subtitle, children }: AdminLayoutProps) {
  const { adminSession, studentSession } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = adminSession?.full_name || studentSession?.full_name || 'Admin';
  const displayEmail = adminSession?.email || studentSession?.email || '';

  const handleNav = (route: Route) => {
    onNavigate(route);
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shrink-0">
            <GraduationCap size={20} className="text-blue-100" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-white leading-tight">Admin Panel</p>
            <p className="text-[10px] text-slate-400 leading-tight">UCS Tumkur</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <AdminNavItem
            key={item.route}
            active={currentRoute === item.route}
            onClick={() => handleNav(item.route)}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>
      <div className="p-3 border-t border-slate-700/50 space-y-1">
        <button
          onClick={() => onNavigate('chatbot')}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full text-left"
        >
          <ArrowLeft size={18} />
          Back to App
        </button>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-50 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shrink-0">
              <GraduationCap size={20} className="text-blue-100" />
            </div>
            <p className="text-sm font-extrabold text-white">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-800">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <AdminNavItem
              key={item.route}
              active={currentRoute === item.route}
              onClick={() => handleNav(item.route)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700/50 space-y-1">
          <button
            onClick={() => onNavigate('chatbot')}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full text-left"
          >
            <ArrowLeft size={18} />
            Back to App
          </button>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-800">
            <Menu size={22} className="text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-blue-400" />
            <span className="font-bold text-sm text-white">Admin</span>
          </div>
        </div>

        {/* Page header */}
        <div className="bg-slate-900/60 backdrop-blur-md border-b border-slate-700/50 px-4 sm:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-extrabold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          <p className="text-xs text-slate-500 mt-1">Logged in as {displayEmail || displayName}</p>
        </div>

        {/* Content */}
        <div className="p-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function AdminNavItem({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Shield; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all w-full text-left ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
