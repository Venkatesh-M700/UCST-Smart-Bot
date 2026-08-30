import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Edit3, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCollegeSettings } from '@/hooks/useCollegeData';
import { Logo } from '@/components/Logo';
import { AnnouncementBar } from '@/components/AnnouncementBar';

export function Contact() {
  const { isAdmin: contextIsAdmin, user } = useAuth();
  const { settings, refreshSettings } = useCollegeSettings();

  // 🌟 Admin Status Check 🌟
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
  const isAdmin = Boolean(contextIsAdmin || user?.role === 'admin' || localAuth);

  // Campus Details State
  const [address, setAddress] = useState(() => settings?.address || 'BH Road, Tumkur - 572103');
  const [phone, setPhone] = useState(() => settings?.phone || '0816-2203500');
  const [email, setEmail] = useState(() => settings?.email || 'ucscience@tumkuruniversity.ac.in');
  const [dbSettingsId, setDbSettingsId] = useState<any>(null);

  // Form States
  const [name, setName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Admin Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempAddress, setTempAddress] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [tempEmail, setTempEmail] = useState('');

  useEffect(() => {
    const fetchCloudSettings = async () => {
      try {
        const { data } = await supabase.from('college_settings').select('*').limit(1).maybeSingle();
        if (data) {
          setDbSettingsId(data.id);
          if (data.address) setAddress(data.address);
          if (data.phone) setPhone(data.phone);
          if (data.email) setEmail(data.email);
        }
      } catch {}
    };
    fetchCloudSettings();
  }, [settings]);

  // 🌟 1. Send Inquiry Form (Saves to Supabase & LocalStorage) 🌟
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !inquiryEmail.trim() || !message.trim()) return;

    const msgItem = {
      id: 'msg-' + Date.now(),
      name: name.trim(),
      email: inquiryEmail.trim(),
      subject: subject.trim() || 'General Inquiry',
      message: message.trim(),
      created_at: new Date().toISOString()
    };

    // Save to LocalStorage
    try {
      const existing = localStorage.getItem('ucs_contact_messages');
      const list = existing ? JSON.parse(existing) : [];
      localStorage.setItem('ucs_contact_messages', JSON.stringify([msgItem, ...list]));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    // Save to Supabase Cloud
    try {
      const { error } = await supabase.from('contact_messages').insert([msgItem]);
      if (error) {
        console.error('Contact submit cloud error:', error);
      }
    } catch (err) {
      console.warn('Contact message cloud sync note:', err);
    }

    setSubmitted(true);
    setName('');
    setInquiryEmail('');
    setSubject('');
    setMessage('');
  };

  // 🌟 2. Admin Save Contact Details 🌟
  const handleSaveContactDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedAddr = tempAddress.trim();
    const updatedPhone = tempPhone.trim();
    const updatedEmail = tempEmail.trim();

    setAddress(updatedAddr);
    setPhone(updatedPhone);
    setEmail(updatedEmail);

    const localSettings = settings ? { ...settings, address: updatedAddr, phone: updatedPhone, email: updatedEmail } : { address: updatedAddr, phone: updatedPhone, email: updatedEmail };
    localStorage.setItem('ucs_college_settings', JSON.stringify(localSettings));
    window.dispatchEvent(new Event('storage'));

    // Save to Supabase Cloud
    try {
      if (dbSettingsId) {
        await supabase.from('college_settings').update({
          address: updatedAddr,
          phone: updatedPhone,
          email: updatedEmail
        }).eq('id', dbSettingsId);
      } else {
        const { data } = await supabase.from('college_settings').insert([{
          address: updatedAddr,
          phone: updatedPhone,
          email: updatedEmail
        }]).select().single();
        if (data?.id) setDbSettingsId(data.id);
      }
      if (refreshSettings) refreshSettings();
    } catch (err) {
      console.error('Contact settings update error:', err);
    }

    setShowEditModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50/70 via-teal-50/50 to-indigo-50/70 font-sans text-slate-800">
      
      {/* College Header */}
      <header className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white py-5 px-4 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center text-center gap-2.5">
          <div className="p-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-sm">
            <Logo logoUrl={settings?.logo_url} size="md" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
              {settings?.college_name ?? 'University College Of Science, Tumkur'}
            </h1>
            <p className="text-xs md:text-sm text-teal-100 font-medium">
              {address}
            </p>
          </div>
        </div>
      </header>

      <AnnouncementBar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* 🌟 Left Card: Campus Contact Information 🌟 */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-teal-100 shadow-md space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-800">Campus Contact Information</h2>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setTempAddress(address);
                    setTempPhone(phone);
                    setTempEmail(email);
                    setShowEditModal(true);
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Edit3 size={13} />
                  <span>Edit Info</span>
                </button>
              )}
            </div>

            <div className="space-y-5 text-xs md:text-sm">
              <div className="flex items-start gap-3.5">
                <MapPin className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Address</h4>
                  <p className="text-slate-600 leading-relaxed mt-0.5">{address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Phone className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Phone Helpdesk</h4>
                  <p className="text-slate-600 mt-0.5">{phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Mail className="text-rose-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Official Email</h4>
                  <p className="text-slate-600 mt-0.5">{email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 🌟 Right Card: Send an Inquiry 🌟 */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-teal-100 shadow-md space-y-4">
            <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3">Send an Inquiry</h2>

            {submitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 animate-in fade-in">
                <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs md:text-sm font-bold">Your message has been sent to the college administration!</p>
                  <button onClick={() => setSubmitted(false)} className="text-xs font-semibold text-emerald-700 underline mt-1 cursor-pointer">
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white text-slate-800 placeholder-slate-400 font-medium transition-all"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    required
                    placeholder="Your Email Address"
                    value={inquiryEmail}
                    onChange={e => setInquiryEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Subject (e.g. BCA Admission Inquiry)"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
                  />
                </div>

                <div>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type your message / questions here..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white text-slate-800 placeholder-slate-400 leading-relaxed resize-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 cursor-pointer transition-all"
                >
                  <Send size={15} />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </main>

      {/* 🌟 Admin Edit Modal 🌟 */}
      {isAdmin && showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-800">
                Edit Contact Details
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveContactDetails} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Campus Address</label>
                <input
                  type="text"
                  required
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Phone Helpdesk</label>
                <input
                  type="text"
                  required
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Save Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Contact;
