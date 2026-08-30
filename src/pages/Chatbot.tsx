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

// 🌟 Local Storage Keys used across About, Courses, Admission, FAQ, Contact 🌟
const STORAGE_KEYS = {
  DEPTS: 'ucs_crud_departments',
  COURSES: 'ucs_courses_data',
  ADMISSION: 'ucs_crud_college_information',
  FAQS: 'ucs_crud_faqs',
  SETTINGS: 'ucs_college_settings',
  KNOWLEDGE: 'ucs_admin_knowledge',
  PROMPTS: 'ucs_quick_prompts'
};

// 🌟 Baseline Default Data 🌟
const BASELINE_DATA = {
  depts: [
    { name: 'Department of Computer Science & BCA', head: 'Dr. Ramani', description: 'Offering state-of-the-art education in software engineering, AI, data science, and web development with modern computer labs.' },
    { name: 'Department of Physics & Electronics', head: 'Dr. Shwetha N.', description: 'Equipped with advanced research laboratories focusing on electronics, material science, and computational physics.' },
    { name: 'Department of Mathematics & Statistics', head: 'Prof. Manjunath B.', description: 'Fostering analytical mindset, mathematical modeling, data analytics, and pure research.' },
    { name: 'Department of Chemistry & Biochemistry', head: 'Dr. Geetha S.', description: 'Engaged in organic synthesis, environmental chemistry, and pharmaceutical analysis.' }
  ],
  courses: [
    { name: 'Bachelor of Computer Applications (BCA)', code: 'BCA', duration: '3 Years (6 Semesters)', eligibility: '10+2 / PUC Pass with Mathematics, Statistics, or Computer Science', fees: 'Rs. 25,000 / Year', seats: '60 Seats', description: 'Programming, web development, cloud computing, and AI.' },
    { name: 'Bachelor of Science (B.Sc)', code: 'B.Sc', duration: '3 Years (6 Semesters)', eligibility: '10+2 / PUC Science Stream', fees: 'Rs. 18,000 / Year', seats: '120 Seats', description: 'Core physical and biological sciences with practical lab training.' }
  ],
  admission: [
    { category: 'admission', title: 'Admission Guidelines', content: 'Candidates seeking admission to BCA/B.Sc must submit 10+2 marks cards along with TC and application form.' },
    { category: 'eligibility', title: 'General Eligibility Guidelines', content: 'Applicants must have cleared the Karnataka 2nd PUC examination or any recognized 10+2 equivalent with minimum qualifying aggregate percentage.' },
    { category: 'fees', title: 'Fee Payment & Concessions', content: 'Tuition fees must be paid per academic semester/year. Post-metric scholarships, SSP, and fee reimbursements apply for eligible candidates.' }
  ],
  faqs: [
    { question: 'How do I apply for BCA admission in UCS Tumkur?', answer: 'You can apply online through this admission portal or visit the college admission desk with 10th & 12th marks cards.' },
    { question: 'What are the college working hours?', answer: 'Regular theory and practical classes run from 9:30 AM to 4:30 PM.' },
    { question: 'Are hostel facilities available?', answer: 'Yes, separate hostel facilities with mess services are provided for both boys and girls near campus.' }
  ],
  settings: {
    college_name: 'University College of Science, Tumkur',
    address: 'Tumkur University Campus, BH Road, Tumkur - 572103',
    phone: '0816-2203500',
    email: 'ucscience@tumkuruniversity.ac.in',
    website: 'https://tumkuruniversity.ac.in'
  }
};

const DEFAULT_PROMPTS: QuickPrompt[] = [
  { id: '1', label: 'Admission Process', prompt: 'Tell me about admission process' },
  { id: '2', label: 'Available Courses', prompt: 'What courses are offered?' },
  { id: '3', label: 'Department Heads', prompt: 'Who are the department HODs?' },
  { id: '4', label: 'Contact Helpdesk', prompt: 'How to contact college office?' },
];

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
    <div className="space-y-1.5 text-slate-800 leading-relaxed text-xs sm:text-sm">
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
      text: `Hello! 👋 Welcome to **University College of Science, Tumkur**.\nI am your **AI Campus & Admission Assistant**.\nI can answer anything regarding **Admissions, Courses, HODs/Departments, Fees, Hostels, and Contact details**.\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🌐 Live In-Memory Web Page Knowledge Store 🌐
  const [webData, setWebData] = useState({
    depts: BASELINE_DATA.depts,
    courses: BASELINE_DATA.courses,
    admission: BASELINE_DATA.admission,
    faqs: BASELINE_DATA.faqs,
    settings: BASELINE_DATA.settings,
    knowledge: [] as any[]
  });

  const [quickPrompts, setQuickPrompts] = useState<QuickPrompt[]>(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.PROMPTS);
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

  // 🌟 Sync All Database Tables & LocalStorage Pages 🌟
  const syncAllPages = async () => {
    let freshDepts = BASELINE_DATA.depts;
    let freshCourses = BASELINE_DATA.courses;
    let freshAdmission = BASELINE_DATA.admission;
    let freshFaqs = BASELINE_DATA.faqs;
    let freshSettings = BASELINE_DATA.settings;
    let freshKb: any[] = [];

    // 1. Read LocalStorage First
    try {
      const d = localStorage.getItem(STORAGE_KEYS.DEPTS);
      if (d) freshDepts = JSON.parse(d);
      const c = localStorage.getItem(STORAGE_KEYS.COURSES);
      if (c) freshCourses = JSON.parse(c);
      const a = localStorage.getItem(STORAGE_KEYS.ADMISSION);
      if (a) freshAdmission = JSON.parse(a);
      const f = localStorage.getItem(STORAGE_KEYS.FAQS);
      if (f) freshFaqs = JSON.parse(f);
      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (s) freshSettings = JSON.parse(s);
      const k = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE);
      if (k) freshKb = JSON.parse(k);
    } catch {}

    // 2. Fetch From Supabase Cloud in Parallel
    try {
      const [dRes, cRes, aRes, fRes, sRes, kRes] = await Promise.all([
        supabase.from('college_departments').select('*'),
        supabase.from('college_courses').select('*'),
        supabase.from('college_information').select('*'),
        supabase.from('college_faqs').select('*'),
        supabase.from('college_settings').select('*').limit(1).maybeSingle(),
        supabase.from('chatbot_knowledge').select('*')
      ]);

      if (dRes.data && dRes.data.length > 0) freshDepts = dRes.data;
      if (cRes.data && cRes.data.length > 0) freshCourses = cRes.data;
      if (aRes.data && aRes.data.length > 0) freshAdmission = aRes.data;
      if (fRes.data && fRes.data.length > 0) freshFaqs = fRes.data;
      if (sRes.data) freshSettings = { ...freshSettings, ...sRes.data };
      if (kRes.data && kRes.data.length > 0) freshKb = kRes.data;
    } catch (e) {
      console.warn('Sync note:', e);
    }

    setWebData({
      depts: freshDepts,
      courses: freshCourses,
      admission: freshAdmission,
      faqs: freshFaqs,
      settings: freshSettings,
      knowledge: freshKb
    });
  };

  useEffect(() => {
    syncAllPages();
    window.addEventListener('storage', syncAllPages);
    return () => window.removeEventListener('storage', syncAllPages);
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

    try {
      await supabase.from('chat_history').insert([{
        id: 'chat-' + Date.now(),
        user_name: studentName,
        user_email: studentEmail,
        message: userMsg,
        user_query: userMsg,
        response: aiReply,
        bot_reply: aiReply,
        created_at: new Date().toISOString()
      }]);
    } catch {}
  };

  // 🧠 Universal Multi-Page Content Analyzer (ChatGPT Web Parser Style) 🧠
  const parseAndAnswer = (query: string): string => {
    const q = query.toLowerCase().trim();
    const tokens = q.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 2);

    // 📄 1. SCAN: ABOUT PAGE & DEPARTMENTS & HODs
    const isDeptHOD = q.includes('head') || q.includes('hod') || q.includes('dept') || q.includes('faculty') || q.includes('staff') || q.includes('ramani') || q.includes('shwetha') || q.includes('manjunath') || q.includes('geetha');
    if (isDeptHOD) {
      for (const d of webData.depts) {
        const dName = (d.name || '').toLowerCase();
        const dHead = (d.head || '').toLowerCase();
        
        if (
          (dHead && q.includes(dHead)) ||
          (q.includes('bca') && (dName.includes('bca') || dName.includes('computer'))) ||
          (q.includes('computer') && dName.includes('computer')) ||
          (q.includes('physic') && dName.includes('physic')) ||
          (q.includes('math') && dName.includes('math')) ||
          (q.includes('chem') && dName.includes('chem'))
        ) {
          return `🏛️ **${d.name} (About Page):**\n• **Head of Department (HOD):** ${d.head}\n• **Description:** ${d.description || 'Offering advanced lab education and experienced faculty.'}`;
        }
      }
      return `🏛️ **Academic Departments & HODs (About Institution):**\n\n${webData.depts.map((d: any) => `• **${d.name}**\n  👤 Head: **${d.head}**\n  ${d.description || ''}`).join('\n\n')}`;
    }

    // 📄 2. SCAN: ADMISSION PAGE (Admission Guidelines & Eligibility)
    const isAdmission = q.includes('admi') || q.includes('apply') || q.includes('seat') || q.includes('eligib') || q.includes('join') || q.includes('form') || q.includes('process');
    if (isAdmission) {
      const matched = webData.admission.filter(a => {
        const cat = (a.category || '').toLowerCase();
        const title = (a.title || '').toLowerCase();
        return cat.includes('admission') || cat.includes('eligib') || title.includes('admission') || title.includes('eligib');
      });

      if (matched.length > 0) {
        return `🎓 **Admission Information (From Admission Page):**\n\n${matched.map(m => `• **${m.title}:**\n  ${m.content}`).join('\n\n')}\n\n📞 Admission Helpline: **${webData.settings.phone || '0816-2203500'}**`;
      }
      return `🎓 **Admission Guidelines & Process:**\n\n1. **Eligibility:** 10+2 / PUC with Science or Mathematics.\n2. **Application:** Submit application form online or visit the campus admission desk.\n3. **Documents Required:** 10th & 12th Marks Cards, TC, Migration, and Category/Income certificates.\n4. **Selection:** Merit list based admission.\n\n📞 Helpdesk: **${webData.settings.phone || '0816-2203500'}**`;
    }

    // 📄 3. SCAN: COURSES PAGE (Courses, Combinations & Eligibility)
    const isCourse = q.includes('cours') || q.includes('branch') || q.includes('program') || q.includes('bca') || q.includes('bsc') || q.includes('msc') || q.includes('degre');
    if (isCourse) {
      if (q.includes('bca')) {
        const bca = webData.courses.find(c => (c.name || '').toLowerCase().includes('bca') || (c.code || '').toLowerCase() === 'bca');
        if (bca) {
          return `📚 **${bca.name} (${bca.code || 'BCA'}):**\n• **Duration:** ${bca.duration}\n• **Eligibility:** ${bca.eligibility}\n• **Tuition Fees:** ${bca.fees}\n• **Seats:** ${bca.seats}\n• **Description:** ${bca.description}`;
        }
      }
      return `📚 **Offered Courses & Combinations (From Courses Page):**\n\n${webData.courses.map((c: any) => `• **${c.name}** (${c.duration || '3 Years'})\n  Eligibility: ${c.eligibility}\n  Fees: *${c.fees}* | Seats: ${c.seats}\n  ${c.description || ''}`).join('\n\n')}`;
    }

    // 📄 4. SCAN: FEES & SCHOLARSHIPS (Admission + Courses Fee Fields)
    const isFee = q.includes('fee') || q.includes('cost') || q.includes('scholar') || q.includes('ssp') || q.includes('nsp') || q.includes('amount') || q.includes('pay');
    if (isFee) {
      let reply = `💰 **Fee Structure & Financial Aid:**\n\n`;
      webData.courses.forEach((c: any) => {
        if (c.fees) reply += `• **${c.name}:** *${c.fees}*\n`;
      });
      reply += `\n• **Scholarships:** Post-matric SSP (State Scholarship Portal), NSP, and category fee concessions apply for eligible students.\n• Check the **Admission** tab for concession rules.`;
      return reply;
    }

    // 📄 5. SCAN: CONTACT PAGE & SETTINGS
    const isContact = q.includes('contact') || q.includes('phone') || q.includes('call') || q.includes('email') || q.includes('address') || q.includes('locat') || q.includes('help') || q.includes('website');
    if (isContact) {
      return `📍 **Campus Contact & Office Details (From Contact Page):**\n• **Institution:** ${webData.settings.college_name}\n• **Address:** ${webData.settings.address}\n• **Phone:** 📞 **${webData.settings.phone}**\n• **Email:** 📧 **${webData.settings.email}**\n• **Website:** 🌐 ${webData.settings.website}`;
    }

    // 📄 6. SCAN: FAQ PAGE
    for (const f of webData.faqs) {
      const fQ = (f.question || '').toLowerCase();
      if (tokens.some(t => fQ.includes(t) && t.length >= 3) || q.includes(fQ)) {
        return `💡 **FAQ - ${f.question}:**\n\n${f.answer}`;
      }
    }

    // 📄 7. SCAN: TRAINED AI KNOWLEDGE BASE
    for (const kb of webData.knowledge) {
      const topic = (kb.topic || '').toLowerCase();
      const content = (kb.content || '').toLowerCase();
      if (q.includes(topic) || tokens.some(t => topic.includes(t) || content.includes(t))) {
        return kb.content;
      }
    }

    // 📄 8. GREETINGS
    if (['hi', 'hello', 'hey', 'namaste', 'start'].some(g => q.startsWith(g))) {
      return `Hello! 👋 Welcome to **University College of Science, Tumkur**.\nHow can I help you regarding **Admissions, Courses, Department HODs, Fees, Hostels, or Contact details**?`;
    }

    return `🎓 **UCS Tumkur Enquiry Helpdesk:**\nFor admission eligibility, course seats, fees, or department details, please contact the office at 📞 **${webData.settings.phone || '0816-2203500'}** or visit ${webData.settings.website || 'https://tumkuruniversity.ac.in'}`;
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

    const botReplyText = parseAndAnswer(textToSend);

    setTimeout(async () => {
      const botMessage: Message = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: botReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
      await logDirectToSupabase(textToSend.trim(), botReplyText);
    }, 150);
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
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(updated));

    await supabase.from('quick_prompts').delete().eq('id', id);
    await syncAllPages();
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
    await syncAllPages();
  };

  const getPromptIcon = (index: number) => {
    const icons = [BookOpen, School, FileText, PhoneCall];
    const IconComp = icons[index % icons.length];
    return <IconComp size={13} className="text-blue-600 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 top-[60px] flex flex-col bg-slate-100 font-sans text-slate-800 z-10">
      <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto p-2 sm:p-4 min-h-0 h-full">
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col overflow-hidden w-full h-full">
          
          {/* Header */}
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Bot size={16} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">UCS AI Assistant</h2>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Reading: About, Courses, Admission, FAQs & Contact</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isAdminState && onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('admin-dashboard')}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck size={12} />
                  <span>Admin</span>
                </button>
              )}
              <button 
                onClick={() => setMessages([messages[0]])} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="Reset Conversation"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Transcript Feed */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-white">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="h-7 w-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot size={14} />
                  </div>
                )}
                <div className={`space-y-1 ${msg.sender === 'user' ? 'max-w-[85%] sm:max-w-[70%]' : 'max-w-[95%] sm:max-w-[85%]'}`}>
                  <div className={`p-3 rounded-2xl shadow-2xs ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none font-medium text-xs sm:text-sm' : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none text-xs sm:text-sm'}`}>
                    {msg.sender === 'user' ? (
                      <p className="leading-relaxed">{msg.text}</p>
                    ) : (
                      <FormattedText text={msg.text} />
                    )}
                  </div>
                  <p className={`text-[10px] text-slate-400 px-1 font-semibold ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
                </div>
                {msg.sender === 'user' && (
                  <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 justify-start items-center">
                <div className="h-7 w-7 rounded-lg bg-teal-600 text-white flex items-center justify-center"><Bot size={14} /></div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl rounded-tl-none flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 bg-teal-600 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" />
              <span>Ask:</span>
            </span>
            {quickPrompts.map((p, idx) => (
              <div key={p.id || idx} className="inline-flex items-center gap-1 shrink-0">
                <button 
                  type="button" 
                  onClick={() => handleSend(undefined, p.prompt)} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  {getPromptIcon(idx)}
                  <span>{p.label}</span>
                </button>
                {isAdminState && (
                  <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5">
                    <button type="button" onClick={(e) => handleOpenEditModal(p, e)} className="p-0.5 text-slate-400 hover:text-blue-600 cursor-pointer"><Edit2 size={9} /></button>
                    <button type="button" onClick={(e) => handleDeletePrompt(p.id, e)} className="p-0.5 text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 size={9} /></button>
                  </div>
                )}
              </div>
            ))}
            {isAdminState && (
              <button type="button" onClick={handleOpenAddModal} className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer">
                <Plus size={12} />
              </button>
            )}
          </div>

          {/* Input Box */}
          <div className="p-2.5 sm:p-3 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={(e) => handleSend(e)} className="flex items-center gap-2">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Ask about admissions, BCA, HODs, fees, courses, hostel..." 
                className="flex-1 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white text-xs sm:text-sm font-medium outline-none transition-all" 
              />
              <button 
                type="submit" 
                disabled={!input.trim()} 
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>
      </main>

      {/* Quick Prompt Modal */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-blue-600" />
                <span>{editingPromptId ? 'Edit Quick Prompt' : 'Add Quick Prompt'}</span>
              </h3>
              <button onClick={() => setIsPromptModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSavePrompt} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Button Title</label>
                <input type="text" required value={promptLabel} onChange={e => setPromptLabel(e.target.value)} placeholder="e.g. Sports" className="w-full p-2 bg-slate-50 border rounded-lg outline-none focus:border-blue-600 font-medium" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prompt Question</label>
                <textarea required rows={2} value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Tell me about Sports" className="w-full p-2 bg-slate-50 border rounded-lg outline-none focus:border-blue-600 resize-none font-medium" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setIsPromptModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 cursor-pointer shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
