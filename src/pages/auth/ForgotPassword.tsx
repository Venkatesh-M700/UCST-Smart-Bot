import { useState } from 'react';
import { ShieldCheck, Mail, Phone, Lock, ArrowRight, ArrowLeft, KeyRound, CheckCircle2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { useCollegeSettings } from '@/hooks/useCollegeData';
import { InlineError } from '@/components/ui';
import type { Route } from '@/types/route';

interface ForgotPasswordProps {
  onNavigate: (route: Route) => void;
}

export function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const { settings } = useCollegeSettings();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState(false);

  const handleVerifyIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputEmail = email.trim().toLowerCase();
    const inputPhone = phone.trim();

    if (!inputEmail || !inputPhone) {
      setError('Please enter both your registered Email and Mobile Number.');
      return;
    }

    try {
      const students = JSON.parse(localStorage.getItem('ucs_registered_students') || '[]');
      const targetUser = students.find(
        (s: any) => s.email?.toLowerCase() === inputEmail && (s.phone === inputPhone || s.mobile === inputPhone)
      );

      const isDemoUser = (inputEmail === 'student@college.edu' || inputEmail === 'm4257342@gmail.com');

      if (!targetUser && !isDemoUser) {
        setError('Security Verification Failed: No student account matched both this Email and Mobile Number.');
        return;
      }

      setLoading(true);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      setTimeout(() => {
        setLoading(false);
        setStep(2);
        setSuccessMsg(`Verification code generated: ${otp}`);
      }, 700);

    } catch {
      setError('Unable to verify user details. Please try again.');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (userOtp.trim() !== generatedOtp) {
      setError('Invalid OTP code! Please enter the correct 6-digit security code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('');
      setStep(3);
    }, 500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const students = JSON.parse(localStorage.getItem('ucs_registered_students') || '[]');
      const updatedStudents = students.map((s: any) => {
        if (s.email?.toLowerCase() === email.trim().toLowerCase()) {
          return { ...s, password: newPassword };
        }
        return s;
      });

      localStorage.setItem('ucs_registered_students', JSON.stringify(updatedStudents));

      setResetSuccessToast(true);

      setTimeout(() => {
        onNavigate('login');
      }, 1500);
    } catch {
      setResetSuccessToast(false);
      setError('Failed to update password. Please try again.');
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
          
          {/* 🌟 Toast Notification right above the Reset Password box on the Right 🌟 */}
          {resetSuccessToast && (
            <div className="absolute -top-16 right-0 z-50 w-full sm:w-auto sm:max-w-xs bg-white text-slate-800 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-200 animate-bounce">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-inner">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-slate-900 tracking-tight truncate">Password Reset Successful!</p>
                <p className="text-[10px] text-slate-500 font-medium truncate">Please login with new password...</p>
              </div>
            </div>
          )}

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-teal-100 shadow-xl shadow-teal-900/5 p-7 md:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white items-center justify-center mb-3 shadow-md shadow-blue-600/20">
                <KeyRound size={26} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">Reset Password</h2>
              <p className="text-slate-500 text-xs md:text-sm mt-1">3-Step Verified Identity Recovery</p>
            </div>

            <div className="flex items-center justify-between px-2 mb-5">
              <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'bg-slate-200 text-slate-600'}`}>1</span>
                <span>Verify</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`flex items-center gap-1.5 text-xs font-bold ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'bg-slate-200 text-slate-600'}`}>2</span>
                <span>OTP</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${step === 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`flex items-center gap-1.5 text-xs font-bold ${step === 3 ? 'text-blue-600' : 'text-slate-400'}`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'bg-slate-200 text-slate-600'}`}>3</span>
                <span>Password</span>
              </div>
            </div>

            {error && <div className="mb-4"><InlineError message={error} /></div>}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleVerifyIdentity} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600/70 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 text-sm outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Registered Mobile Number
                  </label>
                  <div className="relative group">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600/70 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 text-sm outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Verifying...' : 'Send Verification Code'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 text-center">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={userOtp}
                    onChange={(e) => setUserOtp(e.target.value)}
                    placeholder="• • • • • •"
                    className="w-full text-center tracking-[0.4em] text-xl font-mono font-bold py-3 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 outline-none transition-all shadow-sm"
                  />
                  <p className="text-[11px] text-slate-500 text-center mt-1.5 font-medium">Security code generated for identity validation</p>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Verify Code</span>
                    <ShieldCheck size={18} />
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full pl-11 pr-11 py-2.5 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 text-sm outline-none transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50/70 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-slate-800 text-sm outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CheckCircle2 size={18} />
                  <span>Save & Update Password</span>
                </button>
              </form>
            )}

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <ArrowLeft size={13} />
                <span>Return to Student Login</span>
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;
