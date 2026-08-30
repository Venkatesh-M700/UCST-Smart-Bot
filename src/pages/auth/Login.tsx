import { useState, useEffect } from 'react';
import { GraduationCap, Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { useCollegeSettings } from '@/hooks/useCollegeData';
import { supabase } from '@/lib/supabase';
import type { Route } from '@/types/route';

interface LoginProps {
  onNavigate: (route: Route) => void;
  onAuthSuccess?: () => void;
}

export function Login({ onNavigate, onAuthSuccess }: LoginProps) {
  const { loginStudent } = useAuth();
  const { settings } = useCollegeSettings();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState(false);

  useEffect(() => {
    setIdentifier('');
    setPassword('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const input = identifier.trim().toLowerCase();
    const pass = password.trim();

    if (!input || !pass) {
      setError('Please enter your registered mobile number/email and password.');
      return;
    }

    if (input === 'admin@college.edu' || input === 'ucscollege2026@gmail.com' || input.includes('admin')) {
      setError('This is the Student Portal. Click "Admin Login" below to sign in as Admin.');
      return;
    }

    setLoading(true);

    try {
      let matchedStudent: any = null;

      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.eq.${input},phone.eq.${input}`)
          .limit(1)
          .maybeSingle();

        if (!dbError && data) {
          matchedStudent = data;
        }
      } catch (e) {
        console.warn('Supabase profile fetch check:', e);
      }

      if (!matchedStudent) {
        const localStudentsRaw = localStorage.getItem('ucs_registered_students');
        const localStudents: any[] = localStudentsRaw ? JSON.parse(localStudentsRaw) : [];
        matchedStudent = localStudents.find(
          (s) => s.email?.toLowerCase() === input || s.phone === input
        );
      }

      const isDemo = (input === 'student@college.edu' || input === '9876543210') && pass === 'password';

      if (!isDemo) {
        if (!matchedStudent) {
          setError('No student account found with this email/mobile. Please click "Register Now".');
          setLoading(false);
          return;
        }

        if (matchedStudent.password && matchedStudent.password !== pass) {
          setError('Incorrect password! Please check your password and try again.');
          setLoading(false);
          return;
        }
      }

      const authUser = {
        name: matchedStudent?.name || matchedStudent?.full_name || input.split('@')[0],
        email: matchedStudent?.email || (input.includes('@') ? input : `${input}@student.ucs.edu`),
        phone: matchedStudent?.phone || input,
        role: 'student'
      };

      localStorage.setItem('ucs_auth_user', JSON.stringify(authUser));
      if (loginStudent) loginStudent(input, pass);

      setToastMsg(true);

      setTimeout(() => {
        setToastMsg(false);
        setLoading(false);
        if (onAuthSuccess) {
          onAuthSuccess();
        } else {
          onNavigate('chatbot');
        }
      }, 1000);

    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50/70 via-teal-50/50 to-indigo-50/70 font-sans text-slate-800 relative">
      
      <header className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white py-6 px-4 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center text-center gap-3">
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-sm">
            <Logo logoUrl={settings?.logo_url} size="md" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {settings?.college_name ?? 'University College Of Science, Tumkur'}
            </h1>
            <p className="text-xs md:text-sm text-teal-100 font-medium mt-0.5">
              {settings?.address ?? 'Tumkur University Campus, BH Road, Tumkur - 572103'}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-semibold backdrop-blur-sm mt-1">
            <Sparkles size={14} className="text-amber-300" />
            <span>AI Admission & Campus Enquiry Assistant</span>
          </div>
        </div>
      </header>

      <AnnouncementBar />

      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-visible">
        <div className="w-full max-w-md relative z-10">
          
          {/* 🌟 Toast Notification right above the Portal box on the Right Side 🌟 */}
          {toastMsg && (
            <div className="absolute -top-16 right-0 z-50 w-full sm:w-auto sm:max-w-xs bg-white text-slate-800 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-200 animate-bounce">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 shadow-inner">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-slate-900 truncate">Student Login Successful!</p>
                <p className="text-[10px] text-slate-500 truncate">Entering portal...</p>
              </div>
            </div>
          )}

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-teal-100 shadow-xl p-7 md:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white items-center justify-center mb-3 shadow-md shadow-blue-600/20">
                <GraduationCap size={26} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">Student Portal</h2>
              <p className="text-slate-500 text-xs md:text-sm mt-1">Sign in with Registered Mobile or Email</p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-start gap-2.5 shadow-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              <input type="text" name="prevent_autofill_user" className="hidden" tabIndex={-1} autoComplete="off" />
              <input type="password" name="prevent_autofill_pwd" className="hidden" tabIndex={-1} autoComplete="off" />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Mobile Number or Email</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                  <input
                    type="text"
                    required
                    name="login_identifier_field"
                    autoComplete="off"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter registered mobile or email"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Password</label>
                  <button type="button" onClick={() => onNavigate('forgot-password')} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    name="login_password_field"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 text-sm outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{loading ? 'Verifying...' : 'Login'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
              <p className="text-xs text-slate-600">
                New candidate?{' '}
                <button type="button" onClick={() => onNavigate('register')} className="font-bold text-blue-600 hover:underline cursor-pointer">
                  Register Now
                </button>
              </p>

              <div>
                <button type="button" onClick={() => onNavigate('admin-login')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 py-1 px-3 rounded-lg hover:bg-blue-50 cursor-pointer">
                  <Shield size={14} />
                  <span>Admin Login</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
