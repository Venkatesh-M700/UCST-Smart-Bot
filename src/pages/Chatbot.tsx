import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  RefreshCw, 
  BookOpen, 
  School, 
  FileText, 
  PhoneCall,
  Plus,
  Edit2,
  Trash2,
  X,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCollegeSettings, useCourses, useDepartments, useFAQs } from '@/hooks/useCollegeData';
import { Logo } from '@/components/Logo';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import type { Route } from '@/types/route';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

interface QuickPrompt {
  id: string;
  label: string;
  prompt: string;
}

interface ChatbotProps {
  onNavigate?: (route: Route) => void;
}

const DEFAULT_DEPTS = [
  { name: 'Department of Computer Science & BCA', head: 'Dr. Ramani', description: 'Offering BCA, AI, data science, and web development with modern computer labs.' },
  { name: 'Department of Physics & Electronics', head: 'Dr. Shwetha N.', description: 'Equipped with advanced research laboratories in electronics and material science.' },
  { name: 'Department of Mathematics & Statistics', head: 'Prof. Manjunath B.', description: 'Analytical modeling, data analytics, and mathematical research.' },
  { name: 'Department of Chemistry & Biochemistry', head: 'Dr. Geetha S.', description: 'Organic synthesis, environmental chemistry, and chemical analysis.' }
];

const DEFAULT_AI_KNOWLEDGE = [
  { 
    id: 'kn-1', 
    topic: 'Admission Process', 
    content: '🎓 **Admission Process & Eligibility:**\n\n1. **Application:** Submit the application form online or directly at the college admission desk.\n2. **Eligibility:** PUC / 10+2 with Science / Mathematics for BCA & B.Sc streams.\n3. **Documents Required:** 10th & 12th Marks Cards, Transfer Certificate (TC), Category & Income Certificates.\n4. **Selection:** Merit-based admission followed by document verification.\n\n📞 Admission Helpline: **0816-2203500**.' 
  },
  { 
    id: 'kn-2', 
    topic: 'Courses Offered', 
    content: '📚 **Academic Programs Offered:**\n\n• **BCA** (Bachelor of Computer Applications) - 3 Years\n• **B.Sc** (PMCs, CBZ, Electronics, Biotechnology, Data Science) - 3 Years\n• **M.Sc** (Computer Science, Physics, Chemistry, Mathematics) - 2 Years\n\nAll programs are affiliated with Tumkur University with modern lab facilities.' 
  },
  { 
    id: 'kn-3', 
    topic: 'Fees & Scholarships', 
    content: '💰 **Fee Structure & Scholarships:**\n\n• Fees follow **Karnataka State Government norms** (Approx Rs. 25,000 to Rs. 35,000 per year for BCA depending on merit/quota).\n• **Scholarships:** SSP (State Scholarship Portal) and NSP (National Scholarship Portal) are applicable for eligible students.' 
  },
  { 
    id: 'kn-4', 
    topic: 'Hostel Facilities', 
    content: '🏢 **Hostel Accommodation:**\n\n• Dedicated and secure hostels for both **Boys and Girls** near the campus.\n• Includes hygienic mess food, 24/7 security, purified drinking water, and Wi-Fi study halls.' 
  },
  { 
    id: 'kn-5', 
    topic: 'College Helpdesk & Contact', 
    content: '📍 **College Contact Information:**\n\n• **Institution:** University College of Science, Tumkur\n• **Address:** BH Road, Tumkur - 572103\n• **Phone:** 0816-2203500\n• **Email:** ucscience@tumkuruniversity.ac.in\n• **Website:** https://tumkuruniversity.ac.in' 
  },
  { 
    id: 'kn-6', 
    topic: 'Sports & NSS', 
    content: '🏆 **Sports, NSS & Extracurriculars:**\n\n• Active **NSS** and **Youth Red Cross** units organizing state camps.\n• Extensive sports grounds for cricket, volleyball, football, indoor badminton, and student gym.' 
  }
];

const DEFAULT_PROMPTS: QuickPrompt[] = [
  { id: '1', label: 'Admission Process', prompt: 'Tell me about admission process' },
  { id: '2', label: 'Available Courses', prompt: 'What courses are offered?' },
  { id: '3', label: 'Hostel & Campus', prompt: 'Tell me about hostel and facilities' },
  { id: '4', label: 'Contact Helpdesk', prompt: 'How to contact college office?' },
];

const KNOWLEDGE_KEY = 'ucs_admin_knowledge';
const DEPT_STORAGE_KEY = 'ucs_crud_departments';

function FormattedText({ text }: { text: string }) {
  const parseContent = (input: string) => {
    let parsed = input.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold underline bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors break-all">$1 ↗</a>'
    );
    parsed = parsed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-extrabold text-slate-900">$1</strong>');
    parsed = parsed.replace(/\*([^\*]+?)\*/g, '<em class="italic text-slate-800 font-medium">$1</em>');
    parsed = parsed.replace(/_([^_]+?)_/g, '<em class="italic text-slate-800 font-medium">$1</em>');
    return parsed;
  };

  return (
    <div className="space-y-1.5 text-slate-800 leading-relaxed text-sm md:text-base">
      {text.split('\n').map((line, idx) => (
        <p
          key={idx}
          className="leading-relaxed"
          dangerouslySetInnerHTML={{ __html: parseContent(line) || '&nbsp;' }}
        />
      ))}
    </div>
  );
}

export function Chatbot({ onNavigate }: ChatbotProps) {
  const { user, isAdmin: contextIsAdmin } = useAuth();
  const { settings } = useCollegeSettings();
  const { courses } = useCourses();
  const { departments } = useDepartments();
  const { faqs } = useFAQs();

  const getAdminStatus = () => {
    try {
      const ucsAuth = localStorage.getItem('ucs_auth_user');
      const adminSession = localStorage.getItem('ucs_admin_session');
      const parsed = ucsAuth ? JSON.parse(ucsAuth) : null;
      return Boolean(
        contextIsAdmin ||
        adminSession === 'true' ||
        parsed?.role === 'admin' ||
        parsed?.email?.toLowerCase().includes('admin') ||
        user?.role === 'admin'
      );
    } catch {
      return false;
    }
  };

  const [isAdminState, setIsAdminState] = useState(getAdminStatus);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hello! 👋 Welcome to **University College of Science, Tumkur**.\nI am your **AI Admission & Campus Assistant**.\nHow can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [dynamicKnowledge, setDynamicKnowledge] = useState<any[]>(() => {
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [quickPrompts, setQuickPrompts] = useState<QuickPrompt[]>(() => {
    try {
      const local = localStorage.getItem('ucs_quick_prompts');
      return local ? JSON.parse(local) : DEFAULT_PROMPTS;
    } catch {
      return DEFAULT_PROMPTS;
    }
  });

  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [promptLabel, setPromptLabel] = useState('');
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    setIsAdminState(getAdminStatus());
  }, [user, contextIsAdmin]);

  const loadData = async () => {
    try {
      const { data: kbData, error: kbErr } = await supabase
        .from('chatbot_knowledge')
        .select('*')
        .order('created_at', { ascending: false });

      if (!kbErr && kbData && kbData.length > 0) {
        setDynamicKnowledge(kbData);
        localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(kbData));
      } else {
        const localK = localStorage.getItem(KNOWLEDGE_KEY);
        if (localK) setDynamicKnowledge(JSON.parse(localK));
      }

      const { data: promptData } = await supabase
        .from('quick_prompts')
        .select('*')
        .order('created_at', { ascending: true });

      if (promptData && promptData.length > 0) {
        setQuickPrompts(promptData);
        localStorage.setItem('ucs_quick_prompts', JSON.stringify(promptData));
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const logDirectToSupabase = async (userMsg: string, aiReply: string) => {
    let studentName = 'Student Candidate';
    let studentEmail = 'student@college.edu';

    try {
      const authRaw = localStorage.getItem('ucs_auth_user');
      const parsed = authRaw ? JSON.parse(authRaw) : user;
      if (parsed) {
        studentName = parsed.name || parsed.full_name || parsed.email?.split('@')[0] || 'Student Candidate';
        studentEmail = parsed.email || 'student@college.edu';
      }
    } catch {}

    const nowIso = new Date().toISOString();
    const uniqueId = 'chat-' + Date.now();

    const payload = {
      id: uniqueId,
      user_name: studentName,
      user_email: studentEmail,
      message: userMsg,
      user_query: userMsg,
      response: aiReply,
      bot_reply: aiReply,
      created_at: nowIso
    };

    try {
      await supabase.from('chat_history').insert([payload]);
    } catch {}

    try {
      const existing = localStorage.getItem('ucs_admin_chat_logs');
      const list = existing ? JSON.parse(existing) : [];
      localStorage.setItem('ucs_admin_chat_logs', JSON.stringify([{
        id: uniqueId,
        user: studentName,
        userQuery: userMsg,
        botReply: aiReply,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      }, ...list]));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  // 🌟 Priority-Ranked Multi-Domain Intelligent Matching 🌟
  const analyzeAndReply = (query: string): string => {
    const q = query.toLowerCase().trim();

    // Load dynamic knowledge from LocalStorage if fresh
    let knowledgeBase = dynamicKnowledge;
    try {
      const local = localStorage.getItem(KNOWLEDGE_KEY);
      if (local) knowledgeBase = JSON.parse(local);
    } catch {}

    // Load Department Data
    let allDepts = departments && departments.length > 0 ? departments : DEFAULT_DEPTS;
    try {
      const localDepts = localStorage.getItem(DEPT_STORAGE_KEY);
      if (localDepts) allDepts = JSON.parse(localDepts);
    } catch {}

    // 🎯 PRIORITY 1: DEPARTMENT HEAD / HOD QUERIES
    const isHeadQuery = q.includes('head') || q.includes('hod') || q.includes('ramani') || q.includes('shwetha') || q.includes('manjunath') || q.includes('geetha');
    if (isHeadQuery) {
      for (const d of allDepts) {
        const dName = (d.name || '').toLowerCase();
        const dHead = (d.head || '').toLowerCase();
        
        if (
          (dHead && q.includes(dHead)) ||
          (q.includes('bca') && dName.includes('bca')) ||
          (q.includes('computer') && dName.includes('computer')) ||
          (q.includes('physics') && dName.includes('physics')) ||
          (q.includes('math') && dName.includes('math')) ||
          (q.includes('chem') && dName.includes('chem'))
        ) {
          return `🏛️ **${d.name}:**\n• **Head of Department (HOD):** ${d.head}\n• **Overview:** ${d.description || 'Dedicated department with modern lab facilities and experienced faculty.'}`;
        }
      }
      return `🏛️ **Department Heads at UCS Tumkur:**\n\n${allDepts.map((d: any) => `• **${d.name}**\n  👤 Head: **${d.head}**\n  ${d.description || ''}`).join('\n\n')}`;
    }

    // 🎯 PRIORITY 2: ADMISSION QUERIES (admission, bca admission, how to join, apply, eligibility)
    const isAdmissionQuery = q.includes('admi') || q.includes('apply') || q.includes('seat') || q.includes('eligib') || q.includes('join') || q.includes('form') || q.includes('how to apply');
    if (isAdmissionQuery) {
      const adm = knowledgeBase.find(k => 
        (k.topic && k.topic.toLowerCase().includes('admi')) || 
        (k.content && k.content.toLowerCase().includes('admission'))
      );
      if (adm) return adm.content;
      return DEFAULT_AI_KNOWLEDGE[0].content;
    }

    // 🎯 PRIORITY 3: FEES & SCHOLARSHIP QUERIES
    const isFeeQuery = q.includes('fee') || q.includes('cost') || q.includes('scholar') || q.includes('ssp') || q.includes('nsp') || q.includes('amount') || q.includes('pay');
    if (isFeeQuery) {
      const fee = knowledgeBase.find(k => 
        (k.topic && (k.topic.toLowerCase().includes('fee') || k.topic.toLowerCase().includes('scholar'))) ||
        (k.content && k.content.toLowerCase().includes('fee'))
      );
      if (fee) return fee.content;
      return DEFAULT_AI_KNOWLEDGE[2].content;
    }

    // 🎯 PRIORITY 4: COURSES QUERIES
    const isCourseQuery = q.includes('cours') || q.includes('branch') || q.includes('program') || q.includes('bca') || q.includes('bsc') || q.includes('msc') || q.includes('degre');
    if (isCourseQuery) {
      const crs = knowledgeBase.find(k => k.topic && k.topic.toLowerCase().includes('cours'));
      if (crs) return crs.content;
      if (courses && courses.length > 0) {
        return `📚 **Academic Programs at UCS Tumkur:**\n\n${courses.map((c: any) => `• **${c.name}** (${c.duration || '3 Years'})\n  Eligibility: ${c.eligibility || 'PUC/10+2 with Science/Maths'}\n  Fees: *${c.fees || 'As per govt norms'}*`).join('\n\n')}`;
      }
      return DEFAULT_AI_KNOWLEDGE[1].content;
    }

    // 🎯 PRIORITY 5: HOSTEL QUERIES
    if (q.includes('host') || q.includes('room') || q.includes('stay') || q.includes('mess')) {
      const h = knowledgeBase.find(k => k.topic && k.topic.toLowerCase().includes('host'));
      return h ? h.content : DEFAULT_AI_KNOWLEDGE[3].content;
    }

    // 🎯 PRIORITY 6: CONTACT & HELPDESK
    if (q.includes('contact') || q.includes('phone') || q.includes('call') || q.includes('email') || q.includes('address') || q.includes('locat') || q.includes('help')) {
      const c = knowledgeBase.find(k => k.topic && (k.topic.toLowerCase().includes('contact') || k.topic.toLowerCase().includes('help')));
      if (c) return c.content;
      return `📍 **Campus Contact Details:**\n• **Institution:** ${settings?.college_name || 'University College of Science, Tumkur'}\n• **Address:** ${settings?.address || 'Tumkur University Campus, BH Road, Tumkur - 572103'}\n• **Phone:** 📞 **${settings?.phone || '0816-2203500'}**\n• **Email:** 📧 **${settings?.email || 'ucscience@tumkuruniversity.ac.in'}**\n• **Website:** 🌐 https://tumkuruniversity.ac.in`;
    }

    // 🎯 PRIORITY 7: SPORTS & NSS
    if (q.includes('sport') || q.includes('gym') || q.includes('nss') || q.includes('activ')) {
      const s = knowledgeBase.find(k => k.topic && (k.topic.toLowerCase().includes('sport') || k.topic.toLowerCase().includes('nss')));
      return s ? s.content : DEFAULT_AI_KNOWLEDGE[5].content;
    }

    // 🎯 PRIORITY 8: ALL OTHER TRAINED KNOWLEDGE
    const tokens = q.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
    for (const item of knowledgeBase) {
      const topic = (item.topic || '').toLowerCase();
      const content = (item.content || '').toLowerCase();
      if (tokens.some(t => topic.includes(t) || content.includes(t))) {
        return item.content;
      }
    }

    // 🎯 PRIORITY 9: FAQ DATABASE
    if (faqs && faqs.length > 0) {
      for (const faq of faqs) {
        if (faq.question && (q.includes(faq.question.toLowerCase()) || tokens.some(t => faq.question.toLowerCase().includes(t)))) {
          return `💡 **FAQ:**\n**Q: ${faq.question}**\n\n${faq.answer}`;
        }
      }
    }

    // 🎯 PRIORITY 10: GREETINGS
    if (['hi', 'hello', 'hey', 'namaste', 'start'].some(g => q.startsWith(g))) {
      return `Hello! 👋 How can I assist you with **admissions, courses, department heads, fees, hostels, or campus details** today?`;
    }

    return `Thank you for your question! For specific queries regarding "${query}", please contact the college helpdesk directly at 📞 **${settings?.phone || '0816-2203500'}** or visit https://tumkuruniversity.ac.in`;
  };

  const handleSend = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const botResponseText = analyzeAndReply(textToSend);

    setTimeout(async () => {
      const botMessage: Message = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
      await logDirectToSupabase(textToSend.trim(), botResponseText);
    }, 250);
  };

  const handleOpenAddModal = () => {
    setEditingPromptId(null);
    setPromptLabel('');
    setPromptText('');
    setIsPromptModalOpen(true);
  };

  const handleOpenEditModal = (p: QuickPrompt, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPromptId(p.id);
    setPromptLabel(p.label);
    setPromptText(p.prompt);
    setIsPromptModalOpen(true);
  };

  const handleDeletePrompt = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this quick prompt?')) return;

    const updated = quickPrompts.filter((p) => p.id !== id);
    setQuickPrompts(updated);
    localStorage.setItem('ucs_quick_prompts', JSON.stringify(updated));

    await supabase.from('quick_prompts').delete().eq('id', id);
    await loadData();
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptLabel.trim() || !promptText.trim()) return;

    if (editingPromptId) {
      await supabase.from('quick_prompts').update({ label: promptLabel.trim(), prompt: promptText.trim() }).eq('id', editingPromptId);
    } else {
      const newPromptId = 'qp-' + Date.now();
      await supabase.from('quick_prompts').insert([{ id: newPromptId, label: promptLabel.trim(), prompt: promptText.trim() }]);
    }

    setIsPromptModalOpen(false);
    setPromptLabel('');
    setPromptText('');
    setEditingPromptId(null);
    await loadData();
  };

  const getPromptIcon = (index: number) => {
    const icons = [BookOpen, School, FileText, PhoneCall];
    const IconComp = icons[index % icons.length];
    return <IconComp size={14} className="text-blue-600 shrink-0" />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50/70 via-teal-50/50 to-indigo-50/70 font-sans text-slate-800">
      
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white py-4 px-4 shadow-md text-center shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-1.5">
          <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
            <Logo logoUrl={settings?.logo_url} size="md" />
          </div>
          <h1 className="text-lg md:text-2xl font-bold">{settings?.college_name ?? 'University College Of Science, Tumkur'}</h1>
          <p className="text-xs text-teal-100">{settings?.address ?? 'Tumkur University Campus, BH Road, Tumkur - 572103'}</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 text-xs text-amber-300">
            <Sparkles size={13} />
            <span className="text-white font-semibold">AI Admission & Campus Enquiry Assistant</span>
          </div>
        </div>
      </header>

      <AnnouncementBar />

      {/* Main Chat Box */}
      <main className="flex-1 flex flex-col w-full max-w-6xl mx-auto p-2 sm:p-4 min-h-0">
        <div className="flex-1 bg-white/95 backdrop-blur-xl rounded-3xl border border-teal-100 shadow-xl flex flex-col overflow-hidden w-full h-full min-h-[620px]">
          
          {/* Top Bar */}
          <div className="bg-slate-50/90 px-4 md:px-6 py-3 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black text-slate-800 flex items-center gap-1.5">
                  <span>UCS AI Assistant</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">v2.4</span>
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud Live Connected</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdminState && onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('admin-dashboard')}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ShieldCheck size={15} />
                  <span>Admin Panel</span>
                </button>
              )}
              <button 
                onClick={() => setMessages([messages[0]])} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                title="Reset Conversation"
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </div>

          {/* Transcript Stream */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-white/60">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {msg.sender === 'bot' && (
                  <div className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <Bot size={18} />
                  </div>
                )}

                <div className={`space-y-1 ${msg.sender === 'user' ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[96%] md:max-w-[90%]'}`}>
                  <div className={`p-4 md:p-5 rounded-2xl shadow-xs ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none font-medium' : 'bg-slate-50 text-slate-800 border border-slate-200/90 rounded-tl-none'}`}>
                    {msg.sender === 'user' ? (
                      <p className="leading-relaxed text-sm md:text-base">{msg.text}</p>
                    ) : (
                      <FormattedText text={msg.text} />
                    )}
                  </div>
                  <p className={`text-[11px] text-slate-400 px-1 font-semibold ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
                </div>

                {msg.sender === 'user' && (
                  <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <User size={18} />
                  </div>
                )}

              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start items-center">
                <div className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center"><Bot size={18} /></div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 bg-teal-600 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-xs font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
              <Sparkles size={14} className="text-amber-500" />
              <span>Ask:</span>
            </span>

            {quickPrompts.map((p, idx) => (
              <div key={p.id || idx} className="inline-flex items-center gap-1 shrink-0">
                <button 
                  type="button" 
                  onClick={() => handleSend(undefined, p.prompt)} 
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 rounded-xl text-xs md:text-sm font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  {getPromptIcon(idx)}
                  <span>{p.label}</span>
                </button>

                {isAdminState && (
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                    <button type="button" onClick={(e) => handleOpenEditModal(p, e)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"><Edit2 size={11} /></button>
                    <button type="button" onClick={(e) => handleDeletePrompt(p.id, e)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 size={11} /></button>
                  </div>
                )}
              </div>
            ))}

            {isAdminState && (
              <button type="button" onClick={handleOpenAddModal} className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs">
                <Plus size={14} />
              </button>
            )}
          </div>

          {/* Input Chat Box */}
          <div className="p-3 md:p-4 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={(e) => handleSend(e)} className="flex items-center gap-2">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Ask about admissions, courses, department heads, fees, hostel, sports..." 
                className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-sm md:text-base font-medium outline-none transition-all" 
              />
              <button 
                type="submit" 
                disabled={!input.trim()} 
                className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md disabled:opacity-50 cursor-pointer shrink-0 transition-all"
              >
                <Send size={18} />
              </button>
            </form>
          </div>

        </div>
      </main>

      {/* Modal for Quick Prompts */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                <span>{editingPromptId ? 'Edit Quick Prompt' : 'Add Quick Prompt'}</span>
              </h3>
              <button onClick={() => setIsPromptModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleSavePrompt} className="space-y-3.5 text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Button Title</label>
                <input type="text" required value={promptLabel} onChange={e => setPromptLabel(e.target.value)} placeholder="e.g. Sports" className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-blue-600 font-medium" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prompt Question</label>
                <textarea required rows={2} value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Tell me about Sports" className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-blue-600 resize-none font-medium" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setIsPromptModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 cursor-pointer shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
