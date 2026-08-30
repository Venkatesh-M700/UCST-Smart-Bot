import { useState, useEffect } from 'react';
import { GraduationCap, Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle2, User, Phone, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { useCollegeSettings } from '@/hooks/useCollegeData';
import type { Route } from '@/types/route';

interface RegisterProps {
  onNavigate: (route: Route) => void;
  onAuthSuccess?: () => void;
}

export function Register({ onNavigate }: RegisterProps) {
  const { settings } = useCollegeSettings();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string } | null>(null);

  useEffect(() => {
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();
    const trimmedConfirmPass = confirmPassword.trim();

    if (!trimmedName || !trimmedPhone || !trimmedEmail || !trimmedPass || !trimmedConfirmPass) {
      setError('Please fill in all registration fields.');
      return;
    }

    if (trimmedPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (trimmedPass !== trimmedConfirmPass) {
      setError('Passwords do not match! Please check your confirm password.');
      return;
    }

    if (trimmedPass.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email, phone')
        .or(`email.eq.${trimmedEmail},phone.eq.${trimmedPhone}`)
        .maybeSingle();

      if (existingUser) {
        setError('An account with this email or mobile number already exists. Please login.');
        setLoading(false);
        return;
      }

      const studentRecord = {
        name: trimmedName,
        full_name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail,
        password: trimmedPass,
        role: 'student',
        created_at: new Date().toISOString()
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('profiles')
        .insert([studentRecord])
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      const local = localStorage.getItem('ucs_registered_students');
      const list = local ? JSON.parse(local) : [];
      const savedRecord = insertedData || { ...studentRecord, id: 'stu-' + Date.now() };
      const updatedList = [savedRecord, ...list.filter((s: any) => s.email !== trimmedEmail && s.phone !== trimmedPhone)];
      localStorage.setItem('ucs_registered_students', JSON.stringify(updatedList));

      setToastMsg({
        title: 'Registration Successful!',
        desc: 'Profile saved to database. Please login with your credentials.'
      });

      setLoading(false);
      setName('');
      setPhone('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setToastMsg(null);
        onNavigate('login');
      }, 1500);

    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
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
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
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
          
          {/* 🌟 Toast Notification right above the box on the Right 🌟 */}
          {toastMsg && (
            <div className="absolute -top-16 right-0 z-50 w-full sm:w-auto sm:max-w-xs bg-white text-slate-800 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-200 animate-bounce">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-inner">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-slate-900 tracking-tight truncate">{toastMsg.title}</p>
                <p className="text-[10px] text-slate-500 font-medium truncate">{toastMsg.desc}</p>
              </div>
            </div>
          )}

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-teal-100 shadow-xl shadow-teal-900/5 p-7 md:p-8">
            
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white items-center justify-center mb-3 shadow-md shadow-blue-600/20">
                <GraduationCap size={26} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">New Registration</h2>
              <p className="text-slate-500 text-xs md:text-sm mt-1">Register your profile to access admissions</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} autoComplete="off" className="space-y-3.5">
              <input type="text" name="fake_usernamenotremember" className="hidden" tabIndex={-1} autoComplete="off" />
              <input type="password" name="fake_passwordnotremember" className="hidden" tabIndex={-1} autoComplete="off" />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600/70 pointer-events-none" />
                  <input
                    type="text"
                    required
                    name="reg_fullname_unique"
                    autoComplete="off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600/70 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    name="reg_phone_unique"
                    autoComplete="off"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10 Digit Mobile Number"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600/70 pointer-events-none" />
                  <input
                    type="email"
                    required
                    name="reg_email_unique"
                    autoComplete="new-password"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Create Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600/70 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    name="reg_pass_unique"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-2.5 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 text-sm outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    name="reg_confpass_unique"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-2.5 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 text-sm outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                ← Back to Student Login
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Register;
