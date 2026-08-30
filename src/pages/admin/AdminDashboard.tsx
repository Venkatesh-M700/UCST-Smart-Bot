import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  LogOut, 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  GraduationCap, 
  Save, 
  UserCheck, 
  Mail, 
  Upload, 
  Image as ImageIcon, 
  BrainCircuit, 
  Menu, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Megaphone,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Route } from '@/types/route';

interface AdminDashboardProps {
  onNavigate: (route: Route) => void;
  onSignOut?: () => void;
}

const DEFAULT_AI_KNOWLEDGE = [
  { id: 'kn-1', topic: 'NSS & Activities', content: 'UCS Tumkur has active NSS and Youth Red Cross wings encouraging students to participate in community service, tree plantation, and annual special blood donation camps.' },
  { id: 'kn-2', topic: 'Courses Offered', content: 'We offer premier programs: BCA (Bachelor of Computer Applications), B.Sc (PMCs, CBZ, Electronics, Biotechnology) and M.Sc programs with top-tier faculty and lab facilities.' },
  { id: 'kn-3', topic: 'Fees & Scholarships', content: 'Tuition fees follow Karnataka state government norms (Approx Rs. 25,000/year for BCA). Post-matric SSP, NSP scholarships and category fee concessions are available.' },
  { id: 'kn-4', topic: 'Hostel Facilities', content: 'UCS Tumkur provides secure hostel accommodation with hygienic mess facilities, 24/7 security, and study halls for both boys and girls near the campus.' },
  { id: 'kn-5', topic: 'College Helpdesk & Contact', content: '📍 Address: BH Road, Tumkur - 572103\n📞 Phone: 0816-2203500\n📧 Email: ucscience@tumkuruniversity.ac.in\n🌐 Website: https://tumkuruniversity.ac.in' },
  { id: 'kn-6', topic: 'Sports & Gymnasium', content: 'UCS Tumkur features dedicated sports facilities including cricket, volleyball, kabaddi grounds, indoor badminton, table tennis, and a modern student gym.' }
];

const CHAT_LOGS_KEY = 'ucs_admin_chat_logs';
const SETTINGS_KEY = 'ucs_college_settings';
const KNOWLEDGE_KEY = 'ucs_admin_knowledge';
const ANNOUNCEMENT_STORAGE_KEY = 'ucs_announcements_data';

type TabType = 'dashboard' | 'announcements' | 'knowledge' | 'settings_logo' | 'students' | 'chat_history' | 'messages';

export function AdminDashboard({ onNavigate, onSignOut }: AdminDashboardProps) {
  const { logout, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [toastMsg, setToastMsg] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>(() => {
    try {
      const local = localStorage.getItem(CHAT_LOGS_KEY);
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Announcement Form
  const [annText, setAnnText] = useState('');
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);

  // AI Knowledge State
  const [knowledgeList, setKnowledgeList] = useState<Array<{ id: string; topic: string; content: string }>>(() => {
    try {
      const local = localStorage.getItem(KNOWLEDGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_AI_KNOWLEDGE;
    } catch {
      return DEFAULT_AI_KNOWLEDGE;
    }
  });

  const [knTopic, setKnTopic] = useState('');
  const [knContent, setKnContent] = useState('');
  const [editingKnId, setEditingKnId] = useState<string | null>(null);

  const [dbSettingsId, setDbSettingsId] = useState<any>(null);
  const [collegeSettings, setCollegeSettings] = useState({
    college_name: 'University College Of Science, Tumkur',
    tagline: 'Tumkur University Campus, BH Road, Tumkur',
    logo_url: '',
    address: 'BH Road, Tumkur - 572103',
    phone: '0816-2203500',
    email: 'ucscience@tumkuruniversity.ac.in',
    website: 'https://tumkuruniversity.ac.in',
    about_text: 'University College of Science, Tumkur is a premier constituent institution dedicated to excellence in science and computing education.'
  });

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } catch {
      return 'Recent';
    }
  };

  const loadAllData = async () => {
    setIsRefreshing(true);

    // 1. Fetch AI Knowledge
    try {
      const { data: kData, error: kErr } = await supabase
        .from('chatbot_knowledge')
        .select('*')
        .order('created_at', { ascending: false });

      if (!kErr && kData && kData.length > 0) {
        setKnowledgeList(kData);
        localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(kData));
        window.dispatchEvent(new Event('storage'));
      } else {
        const localK = localStorage.getItem(KNOWLEDGE_KEY);
        if (localK) {
          const parsed = JSON.parse(localK);
          setKnowledgeList(parsed.length > 0 ? parsed : DEFAULT_AI_KNOWLEDGE);
        } else {
          setKnowledgeList(DEFAULT_AI_KNOWLEDGE);
        }
      }
    } catch {
      const localK = localStorage.getItem(KNOWLEDGE_KEY);
      if (localK) setKnowledgeList(JSON.parse(localK));
    }

    // 2. Fetch Announcements
    try {
      const { data: annData } = await supabase.from('college_announcements').select('*').order('created_at', { ascending: false });
      if (annData) {
        setAnnouncements(annData);
        localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(annData.map((a: any) => a.text)));
      }
    } catch {}

    // 3. Fetch Chat Logs
    try {
      const { data: cData } = await supabase.from('chat_history').select('*').order('created_at', { ascending: false });
      if (cData) {
        const formatted = cData.map((c: any) => ({
          id: c.id,
          user: c.user_name || c.user || 'Student Candidate',
          userQuery: c.message || c.user_query || 'Inquiry',
          botReply: c.response || c.bot_reply || 'Response',
          time: formatDateTime(c.created_at)
        }));
        setChatLogs(formatted);
        localStorage.setItem(CHAT_LOGS_KEY, JSON.stringify(formatted));
      }
    } catch {}

    // 4. Fetch Registered Students
    try {
      const { data: stuData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (stuData) setStudents(stuData);
    } catch {}

    // 5. Fetch Settings / Logo
    try {
      const { data: sData } = await supabase.from('college_settings').select('*').limit(1).maybeSingle();
      if (sData) {
        setDbSettingsId(sData.id);
        setCollegeSettings((prev) => ({ ...prev, ...sData }));
      }
    } catch {}

    // 6. Fetch Messages
    try {
      const { data: msgData } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
      if (msgData) setContactMessages(msgData);
    } catch {}

    setIsRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
    window.addEventListener('storage', loadAllData);
    return () => window.removeEventListener('storage', loadAllData);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // 🌟 AI Knowledge Handlers 🌟
  const handleSaveKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!knTopic.trim() || !knContent.trim()) return;

    const currentTopic = knTopic.trim();
    const currentContent = knContent.trim();

    if (editingKnId) {
      const updated = knowledgeList.map((k) =>
        k.id === editingKnId ? { ...k, topic: currentTopic, content: currentContent } : k
      );
      setKnowledgeList(updated);
      localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));

      try {
        await supabase
          .from('chatbot_knowledge')
          .update({ topic: currentTopic, content: currentContent })
          .eq('id', editingKnId);
      } catch (err) {
        console.error('Update knowledge error:', err);
      }

      setEditingKnId(null);
      showToast('AI Knowledge Updated Successfully!');
    } else {
      const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'kn-' + Date.now();
      const newK = {
        id: generatedId,
        topic: currentTopic,
        content: currentContent,
        created_at: new Date().toISOString()
      };

      const updated = [newK, ...knowledgeList];
      setKnowledgeList(updated);
      localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));

      try {
        const { error } = await supabase.from('chatbot_knowledge').insert([{
          id: generatedId,
          topic: currentTopic,
          content: currentContent
        }]);

        if (error) {
          await supabase.from('chatbot_knowledge').insert([{
            topic: currentTopic,
            content: currentContent
          }]);
        }
      } catch (err) {
        console.error('Insert knowledge error:', err);
      }

      showToast('New Knowledge Added to AI!');
    }

    setKnTopic('');
    setKnContent('');
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Delete this AI knowledge topic?')) return;

    const updated = knowledgeList.filter((k) => k.id !== id);
    setKnowledgeList(updated);
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));

    try {
      await supabase.from('chatbot_knowledge').delete().eq('id', id);
    } catch (err) {
      console.error('Delete knowledge error:', err);
    }

    showToast('AI Knowledge item deleted.');
  };

  // 🌟 Student Delete Handlers 🌟
  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student from database?')) return;

    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);

    try {
      await supabase.from('profiles').delete().eq('id', id);
    } catch (err) {
      console.error('Delete student error:', err);
    }

    showToast('Student deleted.');
  };

  const handleClearAllStudents = async () => {
    if (!confirm('⚠️ Are you sure you want to clear ALL registered students from database?')) return;

    setStudents([]);

    try {
      await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.error(err);
    }

    showToast('All registered students cleared.');
  };

  // 🌟 Chat History Delete Handlers 🌟
  const handleDeleteChat = async (id: string) => {
    const updated = chatLogs.filter((c) => c.id !== id);
    setChatLogs(updated);
    localStorage.setItem(CHAT_LOGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));

    try {
      await supabase.from('chat_history').delete().eq('id', id);
    } catch (err) {
      console.error('Delete chat error:', err);
    }

    showToast('Chat record deleted.');
  };

  const handleClearAllChats = async () => {
    if (!confirm('⚠️ Delete ALL student AI chat transcripts from database?')) return;

    setChatLogs([]);
    localStorage.setItem(CHAT_LOGS_KEY, JSON.stringify([]));
    window.dispatchEvent(new Event('storage'));

    try {
      await supabase.from('chat_history').delete().neq('id', 'clear_all');
    } catch (err) {
      console.error('Clear chats error:', err);
    }

    showToast('All chat transcripts deleted.');
  };

  // 🌟 Contact Messages Delete Handlers 🌟
  const handleDeleteMessage = async (id: string) => {
    const updated = contactMessages.filter((m) => m.id !== id);
    setContactMessages(updated);

    try {
      await supabase.from('contact_messages').delete().eq('id', id);
    } catch (err) {
      console.error('Delete message error:', err);
    }

    showToast('Message deleted.');
  };

  const handleClearAllMessages = async () => {
    if (!confirm('⚠️ Delete ALL contact messages from database?')) return;

    setContactMessages([]);

    try {
      await supabase.from('contact_messages').delete().neq('id', 'clear_all');
    } catch (err) {
      console.error('Clear messages error:', err);
    }

    showToast('All contact messages cleared.');
  };

  // Announcements Handlers
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annText.trim()) return;

    if (editingAnnId) {
      await supabase.from('college_announcements').update({ text: annText.trim() }).eq('id', editingAnnId);
      setEditingAnnId(null);
      showToast('Notice updated!');
    } else {
      const newAnn = { id: 'ann-' + Date.now(), text: annText.trim(), is_active: true };
      await supabase.from('college_announcements').insert([newAnn]);
      showToast('Notice added to scrolling bar!');
    }
    setAnnText('');
    await loadAllData();
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm('Delete this notice?')) {
      await supabase.from('college_announcements').delete().eq('id', id);
      showToast('Notice deleted.');
      await loadAllData();
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Logo Handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const updated = { ...collegeSettings, logo_url: base64String };
      setCollegeSettings(updated);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));

      if (dbSettingsId) {
        await supabase.from('college_settings').update({ logo_url: base64String }).eq('id', dbSettingsId);
      } else {
        const { data } = await supabase.from('college_settings').insert([updated]).select().single();
        if (data?.id) setDbSettingsId(data.id);
      }
      showToast('Logo updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    const updated = { ...collegeSettings, logo_url: '' };
    setCollegeSettings(updated);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    if (dbSettingsId) {
      await supabase.from('college_settings').update({ logo_url: '' }).eq('id', dbSettingsId);
    }
    showToast('Logo removed.');
  };

  const renderChatLogsList = () => (
    <div className="space-y-3">
      {chatLogs.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-500 text-xs">
          No live student conversations logged yet.
        </div>
      ) : (
        chatLogs.map((chat, idx) => (
          <div key={chat.id || idx} className="p-4 bg-slate-50 hover:bg-blue-50/40 rounded-2xl border border-slate-200 space-y-2 transition-all shadow-2xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-blue-700 flex items-center gap-1.5 bg-blue-100/70 px-2.5 py-1 rounded-lg">
                <UserCheck size={14} /> {chat.user}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                  <Clock size={11} className="text-blue-500" />
                  {chat.time}
                </span>
                <button
                  onClick={() => handleDeleteChat(chat.id)}
                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                  title="Delete Chat Log"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="text-xs font-bold text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-blue-600 mr-2 font-black uppercase text-[10px]">User Inquiry:</span>
              {chat.userQuery}
            </div>
            <div className="text-xs text-slate-700 bg-blue-50/70 p-3 rounded-xl border border-blue-100/80 leading-relaxed">
              <span className="text-emerald-700 mr-2 font-black uppercase text-[10px]">AI Assistant Reply:</span>
              {chat.botReply}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800 font-sans flex flex-col md:flex-row relative">
      
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-white text-slate-800 px-4 py-3 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-3 animate-bounce">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <p className="text-xs md:text-sm font-bold">{toastMsg}</p>
        </div>
      )}

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm w-full">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            <GraduationCap size={18} />
          </div>
          <span className="text-sm font-black text-slate-800 truncate">Admin Panel</span>
        </div>
        <button 
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm" />}

      {/* 🌟 Sidebar Navigation 🌟 */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 md:p-5 flex flex-col justify-between shadow-lg md:shadow-none transition-transform duration-300 md:static md:translate-x-0 h-full md:min-h-screen ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Top Header & Navigation */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-3 p-2 bg-blue-50/80 border border-blue-100 rounded-2xl shrink-0">
            {collegeSettings.logo_url ? (
              <img src={collegeSettings.logo_url} alt="Logo" className="h-10 w-10 rounded-xl object-contain bg-white p-1 border border-blue-200" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <GraduationCap size={22} />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-800 truncate">Admin Panel</h2>
              <p className="text-[11px] font-semibold text-blue-600 truncate">UCS Tumkur</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
              <TrendingUp size={16} /> <span>Dashboard</span>
            </button>
            <button onClick={() => { setActiveTab('knowledge'); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'knowledge' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
              <div className="flex items-center gap-3"><BrainCircuit size={16} /> <span>AI Knowledge</span></div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${activeTab === 'knowledge' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>{knowledgeList.length}</span>
            </button>
            <button onClick={() => { setActiveTab('announcements'); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'announcements' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
              <div className="flex items-center gap-3"><Megaphone size={16} /> <span>Scrolling Notices</span></div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${activeTab === 'announcements' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>{announcements.length}</span>
            </button>
            <button onClick={() => { setActiveTab('settings_logo'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'settings_logo' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
              <ImageIcon size={16} /> <span>College Logo</span>
            </button>
            <button onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
              <div className="flex items-center gap-3"><Users size={16} /> <span>Registered Students</span></div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${activeTab === 'students' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>{students.length}</span>
            </button>
            <button onClick={() => { setActiveTab('chat_history'); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'chat_history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
              <div className="flex items-center gap-3"><MessageSquare size={16} /> <span>AI Chat History</span></div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${activeTab === 'chat_history' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>{chatLogs.length}</span>
            </button>
            <button onClick={() => { setActiveTab('messages'); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'messages' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
              <div className="flex items-center gap-3"><Mail size={16} /> <span>Contact Messages</span></div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${activeTab === 'messages' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>{contactMessages.length}</span>
            </button>
          </nav>
        </div>

        {/* Bottom Pinned Actions */}
        <div className="space-y-1.5 pt-3 border-t border-slate-200 shrink-0">
          <button 
            type="button"
            onClick={() => { onNavigate('chatbot'); }} 
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer border border-slate-100"
          >
            <ArrowLeft size={16} className="text-blue-600" /> 
            <span>Back to App</span>
          </button>
          
          <button 
            type="button"
            onClick={async () => { if (signOut) await signOut(); if (logout) logout(); onNavigate('login'); }} 
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/60 hover:bg-rose-100 transition-all cursor-pointer border border-rose-100"
          >
            <LogOut size={16} /> 
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 🌟 Main Content Area - Full Visibility on Mobile 🌟 */}
      <main className="flex-1 w-full min-w-0 p-3.5 md:p-8 space-y-5">
        
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 rounded-3xl p-4 md:p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
          <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
            {collegeSettings.logo_url && (
              <img src={collegeSettings.logo_url} alt="Logo" className="h-10 w-10 md:h-11 md:w-11 rounded-xl object-contain bg-white/20 p-1 border border-white/30 backdrop-blur-md shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-xl font-black tracking-tight text-white break-words leading-tight">
                {collegeSettings.college_name}
              </h1>
              <p className="text-[11px] md:text-xs text-blue-100 font-medium mt-0.5 truncate">
                Admin Management Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap shrink-0 w-full md:w-auto justify-end">
            <button
              onClick={loadAllData}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/25 shadow-xs"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>
            <div className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-300 shrink-0" />
              <span className="font-mono text-white text-[11px] truncate">admin@college.edu</span>
            </div>
          </div>
        </div>

        {/* 🌟 1. DASHBOARD OVERVIEW 🌟 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div onClick={() => setActiveTab('knowledge')} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md cursor-pointer transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><BrainCircuit size={18} /></div>
                  <span className="text-xl md:text-2xl font-black text-slate-800">{knowledgeList.length}</span>
                </div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase">AI Knowledge</h3>
              </div>

              <div onClick={() => setActiveTab('announcements')} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md cursor-pointer transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Megaphone size={18} /></div>
                  <span className="text-xl md:text-2xl font-black text-slate-800">{announcements.length}</span>
                </div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase">Scrolling Notices</h3>
              </div>

              <div onClick={() => setActiveTab('students')} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md cursor-pointer transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
                  <span className="text-xl md:text-2xl font-black text-slate-800">{students.length}</span>
                </div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase">Students</h3>
              </div>

              <div onClick={() => setActiveTab('chat_history')} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md cursor-pointer transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><MessageSquare size={18} /></div>
                  <span className="text-xl md:text-2xl font-black text-slate-800">{chatLogs.length}</span>
                </div>
                <h3 className="text-[11px] font-bold text-slate-500 uppercase">AI Chat History</h3>
              </div>
            </div>

            {/* Recent AI Conversations Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm md:text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="text-blue-600" size={18} />
                  <span>Recent AI Student Conversations ({chatLogs.length})</span>
                </h3>
                <div className="flex items-center gap-2">
                  {chatLogs.length > 0 && (
                    <button
                      onClick={handleClearAllChats}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>Clear All</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('chat_history')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    View All
                  </button>
                </div>
              </div>

              {renderChatLogsList()}
            </div>
          </div>
        )}

        {/* 🌟 2. AI KNOWLEDGE BASE TAB 🌟 */}
        {activeTab === 'knowledge' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <BrainCircuit className="text-blue-600" size={18} />
                  <span>{editingKnId ? 'Modify AI Knowledge Topic' : 'Add AI Knowledge Data (Train Chatbot)'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add keywords and answers (e.g. NCC, Sports, BCA Fees, Hostel, Library). The AI Assistant will instantly answer students based on this data.
                </p>
              </div>

              <form onSubmit={handleSaveKnowledge} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Topic / Keyword (e.g. NCC, Sports, Timing)</label>
                  <input
                    type="text"
                    required
                    value={knTopic}
                    onChange={(e) => setKnTopic(e.target.value)}
                    placeholder="Enter keyword/topic name..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-blue-600 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">AI Answer / Full Information</label>
                  <textarea
                    rows={4}
                    required
                    value={knContent}
                    onChange={(e) => setKnContent(e.target.value)}
                    placeholder="Write detailed answer the chatbot should give for this topic..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-blue-600 leading-relaxed text-slate-700"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md">
                    <Save size={14} />
                    <span>{editingKnId ? 'Update Knowledge' : 'Train & Save to AI'}</span>
                  </button>
                  {editingKnId && (
                    <button type="button" onClick={() => { setEditingKnId(null); setKnTopic(''); setKnContent(''); }} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Trained AI Knowledge Base ({knowledgeList.length})
              </h3>

              <div className="grid sm:grid-cols-2 gap-3.5">
                {knowledgeList.map((k) => (
                  <div key={k.id} className="p-4 bg-slate-50 hover:bg-blue-50/40 rounded-2xl border border-slate-200 space-y-2 transition-all">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        🔑 Topic: {k.topic}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingKnId(k.id);
                            setKnTopic(k.topic);
                            setKnContent(k.content);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteKnowledge(k.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{k.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 🌟 3. SCROLLING NOTICES TAB 🌟 */}
        {activeTab === 'announcements' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Megaphone className="text-amber-500" size={18} />
                  <span>{editingAnnId ? 'Modify Scrolling Notice' : 'Add New Scrolling Notice'}</span>
                </h3>
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-3">
                <textarea
                  rows={2}
                  required
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                  placeholder="e.g. 📢 Semester examination results announced."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-amber-500 font-medium text-slate-800"
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md">
                    <Save size={14} />
                    <span>{editingAnnId ? 'Update Notice' : 'Publish Notice'}</span>
                  </button>
                  {editingAnnId && (
                    <button type="button" onClick={() => { setEditingAnnId(null); setAnnText(''); }} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 flex items-start justify-between gap-4">
                  <p className="text-xs font-bold text-amber-950 leading-relaxed flex-1 whitespace-pre-wrap">{ann.text}</p>
                  <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-lg border border-amber-200">
                    <button onClick={() => { setEditingAnnId(ann.id); setAnnText(ann.text); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"><Edit3 size={14} /></button>
                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 4. COLLEGE LOGO TAB 🌟 */}
        {activeTab === 'settings_logo' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-5 max-w-2xl">
            <div className="border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <ImageIcon className="text-blue-600" size={18} />
                <span>College Logo Management</span>
              </h3>
            </div>

            <div className="p-5 bg-blue-50/60 rounded-3xl border border-blue-100 flex flex-col sm:flex-row items-center gap-5">
              <div className="h-28 w-28 rounded-2xl bg-white border-2 border-dashed border-blue-300 flex items-center justify-center overflow-hidden shrink-0">
                {collegeSettings.logo_url ? (
                  <img src={collegeSettings.logo_url} alt="Logo" className="h-full w-full object-contain p-2" />
                ) : (
                  <ImageIcon size={32} className="text-blue-300" />
                )}
              </div>

              <div className="space-y-3 text-center sm:text-left flex-1">
                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                <div className="flex gap-2.5 justify-center sm:justify-start">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer">
                    <Upload size={14} />
                    <span>{collegeSettings.logo_url ? 'Change Logo' : 'Upload Logo'}</span>
                  </button>
                  {collegeSettings.logo_url && (
                    <button type="button" onClick={handleRemoveLogo} className="px-4 py-2 bg-rose-50 text-rose-600 border rounded-xl text-xs font-bold cursor-pointer">
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 5. REGISTERED STUDENTS TAB 🌟 */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm md:text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Users className="text-blue-600" size={18} />
                <span>Registered Students ({students.length})</span>
              </h3>
              {students.length > 0 && (
                <button
                  onClick={handleClearAllStudents}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-200 transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear All Students</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 uppercase text-[10px] font-black text-slate-500 border-b">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">NAME</th>
                    <th className="py-3 px-3">PHONE</th>
                    <th className="py-3 px-3">EMAIL</th>
                    <th className="py-3 px-3">JOINED DATE & TIME</th>
                    <th className="py-3 px-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400 font-medium">
                        No registered students found.
                      </td>
                    </tr>
                  ) : (
                    students.map((s, i) => (
                      <tr key={s.id || i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-medium text-slate-400">{i + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{s.name || s.full_name || 'N/A'}</td>
                        <td className="py-3 px-3 text-blue-600 font-medium">{s.phone || 'N/A'}</td>
                        <td className="py-3 px-3 text-slate-600">{s.email}</td>
                        <td className="py-3 px-3 text-slate-500 font-medium">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-[11px]">
                            <Clock size={11} className="text-blue-500" />
                            {formatDateTime(s.created_at || s.last_sign_in_at || s.updated_at)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteStudent(s.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🌟 6. AI CHAT HISTORY TAB 🌟 */}
        {activeTab === 'chat_history' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm md:text-base font-extrabold text-slate-800 flex items-center gap-2">
                <MessageSquare className="text-blue-600" size={18} />
                <span>All AI Chat Transcripts ({chatLogs.length})</span>
              </h3>
              {chatLogs.length > 0 && (
                <button
                  onClick={handleClearAllChats}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-200 transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear All History</span>
                </button>
              )}
            </div>
            {renderChatLogsList()}
          </div>
        )}

        {/* 🌟 7. CONTACT MESSAGES TAB 🌟 */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm md:text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Mail className="text-blue-600" size={18} />
                <span>Contact Messages ({contactMessages.length})</span>
              </h3>
              {contactMessages.length > 0 && (
                <button
                  onClick={handleClearAllMessages}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-200 transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear All Messages</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {contactMessages.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-500 text-xs">
                  No contact messages received yet.
                </div>
              ) : (
                contactMessages.map((msg, idx) => (
                  <div key={msg.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{msg.name} ({msg.email})</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock size={11} className="text-blue-500" />
                          {formatDateTime(msg.created_at)}
                        </span>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Message"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-blue-700">Subject: {msg.subject || 'General Inquiry'}</p>
                    <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;
