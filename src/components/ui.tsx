import { AlertCircle, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 size={32} className="text-blue-600 animate-spin" />
      {message && <p className="text-slate-500 text-sm font-medium">{message}</p>}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 animate-fade-in">
      <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
      <p className="text-sm text-red-700 font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }: { icon: typeof AlertCircle; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-8 shadow-sm">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
        <Icon size={28} />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    // Chatbot ನಂತೆಯೇ ಸಾಫ್ಟ್ ಗ್ರೇಡಿಯಂಟ್ ಹಿನ್ನೆಲೆ
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-300/60 via-slate-200/50 to-slate-300/60 py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon: typeof AlertCircle }) {
  return (
    // Chatbot Header ನಂತೆಯೇ ರಾಯಲ್ ಸ್ಕೈ-ಬ್ಲೂ ಬ್ಯಾನರ್ ವಿನ್ಯಾಸ
    <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 rounded-2xl p-5 md:p-6 text-white shadow-lg shadow-blue-900/10 mb-6">
      <div className="flex items-center gap-3.5">
        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
          <Icon size={24} />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-blue-100 font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
