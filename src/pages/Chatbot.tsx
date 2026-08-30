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

const DEFAULT_AI_KNOWLEDGE = [
  { id: 'kn-1', topic: 'Admission Process', content: '🎓 **Admission Process & Eligibility:**\n1. Admissions are open for **BCA**, **B.Sc**, and **M.Sc** programs.\n2. Submit 10th & 12th/PUC marks cards along with category certificate (if applicable).\n3. Merit list is published on campus & online followed by document verification.\n• For application forms and seat enquiry, contact college admission desk: **0816-2203500**.' },
  { id: 'kn-2', topic: 'Courses Offered', content: 'We offer premier programs:\n• **BCA** (Bachelor of Computer Applications) - 3 Years\n• **B.Sc** (PMCs, CBZ, Electronics, Biotechnology) - 3 Years\n• **M.Sc** programs with advanced laboratories.' },
  { id: 'kn-3', topic: 'Fees & Scholarships', content: 'Tuition fees follow **Karnataka state government norms** (Approx *Rs. 25,000/year* for BCA). Post-matric SSP, NSP scholarships and category fee concessions are available.' },
  { id: 'kn-4', topic: 'Hostel Facilities', content: '**UCS Tumkur** provides secure hostel accommodation with hygienic mess facilities, 24/7 security, and study halls for both boys and girls near the campus.' },
  { id: 'kn-5', topic: 'College Helpdesk & Contact', content: '📍 **Address:** BH Road, Tumkur - 572103\n📞 **Phone:** 0816-2203500\n📧 **Email:** ucscience@tumkuruniversity.ac.in\n🌐 **Website:** https://tumkuruniversity.ac.in' },
  { id: 'kn-6', topic: 'NSS & Sports', content: '**UCS Tumkur** features active **NSS**, **Youth Red Cross**, cricket ground, volleyball, badminton, and a modern student gym.' }
];

const DEFAULT_PROMPTS: QuickPrompt[] = [
  { id: '1', label: 'Admission Process', prompt: 'Tell me about admission process' },
  { id: '2', label: 'Available Courses', prompt: 'What courses are offered?' },
  { id: '3', label: 'Hostel & Campus', prompt: 'Tell me about hostel and facilities' },
  { id: '4', label: 'Contact Helpdesk', prompt: 'How to contact college office?' },
];

const KNOWLEDGE_KEY = 'ucs_admin_knowledge';

// 🌟 Markdown & Link Parser 🌟
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

  // 🌟 Universal Site-Wide Intelligent Response Generator 🌟
  const generateBotReplyAsync = async (query: string): Promise<string> => {
    const rawQ = query.toLowerCase().trim();
    const normalizedQ = rawQ.replace(/(.)\1+/g, '$1'); // Fix duplicate letters (e.g. "admisssion" -> "admision")
    const cleanTokens = rawQ
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    // 1. Fetch AI Knowledge
    let freshKnowledge: any[] = [];
    try {
      const { data: kbData } = await supabase
        .from('chatbot_knowledge')
        .select('*')
        .order('created_at', { ascending: false });

      if (kbData && kbData.length > 0) {
        freshKnowledge = kbData;
        setDynamicKnowledge(kbData);
        localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(kbData));
      } else {
        const stored = localStorage.getItem(KNOWLEDGE_KEY);
        freshKnowledge = stored ? JSON.parse(stored) : DEFAULT_AI_KNOWLEDGE;
      }
    } catch {
      const stored = localStorage.getItem(KNOWLEDGE_KEY);
      freshKnowledge = stored ? JSON.parse(stored) : dynamicKnowledge;
    }

    const knowledgeSource = freshKnowledge.length > 0 ? freshKnowledge : DEFAULT_AI_KNOWLEDGE;

    // 🌟 Check 1: Admission Queries across AI Knowledge & Admission page rules
    if (
      rawQ.includes('admi') || 
      normalizedQ.includes('admis') || 
      rawQ.includes('apply') || 
      rawQ.includes('seat') ||
      rawQ.includes('eligib') ||
      rawQ.includes('document') ||
      rawQ.includes('how to join')
    ) {
      const adm = knowledgeSource.find(k => k.topic?.toLowerCase().includes('admi') || k.content?.toLowerCase().includes('admission'));
      if (adm) return adm.content;
      return `🎓 **Admission Information:**\n• Admissions for **BCA** & **B.Sc** are based on 10+2 / PUC Merit.\n• Documents Required: SSLC & PUC Marks Cards, Transfer Certificate, Category/Income Certificate.\n• Call admission office: **${settings?.phone || '0816-2203500'}** for current batch applications.`;
    }

    // 🌟 Check 2: Courses / Fees Queries across Courses DB
    if (
      rawQ.includes('cours') || 
      rawQ.includes('branch') || 
      rawQ.includes('bca') || 
      rawQ.includes('bsc') || 
      rawQ.includes('msc') ||
      rawQ.includes('sub') ||
      rawQ.includes('syllabus') ||
      rawQ.includes('fee') ||
      rawQ.includes('cost') ||
      rawQ.includes('amount')
    ) {
      const crsMatch = knowledgeSource.find(k => k.topic?.toLowerCase().includes('cours') || k.topic?.toLowerCase().includes('fee'));
      if (crsMatch && (rawQ.includes('fee') || rawQ.includes('scholar'))) return crsMatch.content;

      if (courses && courses.length > 0) {
        return `📚 **Programs Offered at UCS Tumkur:**\n\n${courses.map((c: any) => `• **${c.name}** (${c.duration || '3 Years'})\n  Eligibility: ${c.eligibility || 'PUC / 10+2 with Science/Maths'}\n  Fees: *${c.fees || 'As per govt norms'}*`).join('\n\n')}\n\nVisit the **Courses** tab for full syllabus details.`;
      }
      if (crsMatch) return crsMatch.content;
    }

    // 🌟 Check 3: About Institution, Principal, HODs & Departments DB
    if (
      rawQ.includes('dept') || 
      rawQ.includes('department') || 
      rawQ.includes('hod') || 
      rawQ.includes('head') || 
      rawQ.includes('facult') ||
      rawQ.includes('teach') ||
      rawQ.includes('staff') ||
      rawQ.includes('about') ||
      rawQ.includes('princ')
    ) {
      if (departments && departments.length > 0) {
        return `🏛️ **Academic Departments at UCS Tumkur:**\n\n${departments.map((d: any) => `• **${d.name}**\n  Head: Dr./Prof. ${d.head || 'HOD'}\n  ${d.description || ''}`).join('\n\n')}`;
      }
    }

    // 🌟 Check 4: FAQ Data Matching
    if (faqs && faqs.length > 0) {
      for (const faq of faqs) {
        const qText = (faq.question || '').toLowerCase();
        if (cleanTokens.some(t => qText.includes(t)) || rawQ.includes(qText)) {
          return `💡 **FAQ - ${faq.question}**\n\n${faq.answer}`;
        }
      }
    }

    // 🌟 Check 5: Contact, Phone, Location & Address
    if (
      rawQ.includes('contact') || 
      rawQ.includes('phone') || 
      rawQ.includes('call') || 
      rawQ.includes('email') || 
      rawQ.includes('address') || 
      rawQ.includes('locat') || 
      rawQ.includes('map') || 
      rawQ.includes('help')
    ) {
      return `📍 **Campus Contact & Helpdesk:**\n• **Institution:** ${settings?.college_name || 'University College of Science, Tumkur'}\n• **Address:** ${settings?.address || 'Tumkur University Campus, BH Road, Tumkur - 572103'}\n• **Phone:** 📞 **${settings?.phone || '0816-2203500'}**\n• **Email:** 📧 **${settings?.email || 'ucscience@tumkuruniversity.ac.in'}**\n• **Website:** 🌐 https://tumkuruniversity.ac.in`;
    }

    // 🌟 Check 6: Hostel, Facilities, NSS, Sports
    if (rawQ.includes('host') || rawQ.includes('room') || rawQ.includes('stay') || rawQ.includes('mess')) {
      const h = knowledgeSource.find(k => k.topic?.toLowerCase().includes('host'));
      if (h) return h.content;
    }

    if (rawQ.includes('sport') || rawQ.includes('gym') || rawQ.includes('nss') || rawQ.includes('activ')) {
      const s = knowledgeSource.find(k => k.topic?.toLowerCase().includes('sport') || k.topic?.toLowerCase().includes('nss'));
      if (s) return s.content;
    }

    // 🌟 Check 7: Deep Fuzzy Matching on all AI Knowledge
    let bestMatch: { content: string; score: number } | null = null;
    for (const item of knowledgeSource) {
      const topic = (item.topic || '').toLowerCase().trim();
      const content = (item.content || '').toLowerCase();
      let score = 0;

      if (rawQ === topic || normalizedQ === topic) score += 100;
      if (rawQ.includes(topic) || topic.includes(rawQ) || normalizedQ.includes(topic)) score += 50;

      for (const token of cleanTokens) {
        const tokenStem = token.substring(0, Math.min(token.length, 4));
        if (topic.includes(tokenStem)) score += 30;
        if (content.includes(tokenStem)) score += 15;
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { content: item.content, score };
      }
    }

    if (bestMatch && bestMatch.score >= 15) {
      return bestMatch.content;
    }

    // Greetings
    if (['hi', 'hello', 'hey', 'namaste', 'start'].some(g => rawQ.startsWith(g))) {
      return `Hello! 👋 How can I assist you with **admissions, courses, fees, hostels, departments, or campus details** today?`;
    }

    return `Thank you for your question! For specific queries regarding "${query}", please contact the college helpdesk directly at 📞 **${settings?.phone || '0816-2203500'}** or visit https://tumkuruniversity.ac.in`;
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
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

    const botResponseText = await generateBotReplyAsync(textToSend);

    const botMessage: Message = {
      id: 'bot-' + Date.now(),
      sender: 'bot',
      text: botResponseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsTyping(false);

    await logDirectToSupabase(textToSend.trim(), botResponseText);
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

      {/* Main Chat Box - Full Width and Full Height */}
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
                placeholder="Ask about admissions, courses, fees, hostel, NSS, sports..." 
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
