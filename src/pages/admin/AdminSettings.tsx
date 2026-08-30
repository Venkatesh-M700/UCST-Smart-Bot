import { useState, useRef, useEffect } from 'react';
import { Settings, Upload, Trash2, Save, CheckCircle2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Logo } from '@/components/Logo';
import type { CollegeSettings } from '@/types/database';
import type { Route } from '@/types/route';

interface Props {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  onSignOut: () => void;
}

const STORAGE_KEY = 'ucs_college_settings';

const DEFAULT_SETTINGS: CollegeSettings = {
  id: 1,
  college_name: 'University College Of Science, Tumkur',
  address: 'Tumkur University Campus, BH Road, Tumkur - 572103',
  phone: '0816-2203500',
  email: 'info@ucstumkur.edu.in',
  website: 'www.ucstumkur.edu.in',
  hero_subtitle: 'Your gateway to quality education in Science & Technology',
  about_text: 'University College of Science, Tumkur is a premier constituent college offering undergraduate and postgraduate courses in Science, Commerce, and Arts.',
  logo_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function AdminSettings({ currentRoute, onNavigate, onSignOut }: Props) {
  const [settings, setSettings] = useState<CollegeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // LocalStorage ನಿಂದ Settings ಲೋಡ್ ಮಾಡುವುದು
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettings(JSON.parse(raw));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        setSettings(DEFAULT_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Settings Save ಮಾಡುವುದು
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const updated = {
        ...settings,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save settings to local storage.');
    } finally {
      setSaving(false);
    }
  };

  // Logo Upload (Base64 ರೂಪದಲ್ಲಿ LocalStorage ಗೆ ಸೇವ್ ಆಗುತ್ತದೆ)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      const updated = { ...settings, logo_url: base64Url, updated_at: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSettings(updated);
      setUploading(false);
    };
    reader.onerror = () => {
      setError('Failed to process image file.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Logo Delete
  const handleLogoDelete = () => {
    if (!confirm('Delete the college logo?')) return;
    const updated = { ...settings, logo_url: null, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSettings(updated);
  };

  const update = (field: keyof CollegeSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all text-sm';

  if (loading) {
    return (
      <AdminLayout currentRoute={currentRoute} onNavigate={onNavigate} onSignOut={onSignOut} title="College Settings" subtitle="Manage college information and logo">
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading settings...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentRoute={currentRoute} onNavigate={onNavigate} onSignOut={onSignOut} title="College Settings" subtitle="Manage college information, contact details, and logo">
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 flex items-start gap-2.5">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 font-medium">{error}</p>
        </div>
      )}
      {saved && (
        <div className="mb-4 p-3.5 rounded-xl bg-green-500/15 border border-green-500/40 flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 size={18} className="text-green-400" />
          <p className="text-sm text-green-300 font-medium">Settings saved successfully!</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Logo management */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <ImageIcon size={18} className="text-blue-400" />
            College Logo
          </h3>
          <div className="flex items-center gap-5">
            <Logo logoUrl={settings?.logo_url} size="lg" />
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-3">
                {settings?.logo_url ? 'Logo is set. You can replace or delete it.' : 'No logo uploaded. A default icon will be shown.'}
              </p>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60"
                >
                  {uploading ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload size={16} />
                      {settings?.logo_url ? 'Replace Logo' : 'Upload Logo'}
                    </>
                  )}
                </button>
                {settings?.logo_url && (
                  <button
                    onClick={handleLogoDelete}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* College info form */}
        <form onSubmit={handleSave} className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Settings size={18} className="text-blue-400" />
            College Information
          </h3>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">College Name</label>
            <input type="text" value={settings?.college_name ?? ''} onChange={(e) => update('college_name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Address</label>
            <input type="text" value={settings?.address ?? ''} onChange={(e) => update('address', e.target.value)} className={inputClass} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Phone</label>
              <input type="text" value={settings?.phone ?? ''} onChange={(e) => update('phone', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
              <input type="email" value={settings?.email ?? ''} onChange={(e) => update('email', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Website</label>
            <input type="text" value={settings?.website ?? ''} onChange={(e) => update('website', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Hero Subtitle</label>
            <input type="text" value={settings?.hero_subtitle ?? ''} onChange={(e) => update('hero_subtitle', e.target.value)} placeholder="A short tagline for the login page" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">About Text</label>
            <textarea value={settings?.about_text ?? ''} onChange={(e) => update('about_text', e.target.value)} rows={5} className={`${inputClass} resize-none`} />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60"
          >
            {saving ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}

export default AdminSettings;
