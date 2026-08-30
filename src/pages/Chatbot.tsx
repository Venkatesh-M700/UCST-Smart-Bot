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

// 🌟 Fallback Baseline Data (In case Supabase is offline) 🌟
const DEFAULT_DEPTS = [
  { name: 'Department of Computer Science & BCA', head: 'Dr. Ramani', description: 'Offering BCA, AI, data science, and web development with modern computer labs.' },
  { name: 'Department of Physics & Electronics', head: 'Dr. Shwetha N.', description: 'Equipped with advanced research laboratories in electronics and material science.' },
  { name: 'Department of Mathematics & Statistics', head: 'Prof. Manjunath B.', description: 'Analytical modeling, data analytics, and mathematical research.' },
  { name: 'Department of Chemistry & Biochemistry', head: 'Dr. Geetha S.', description: 'Organic synthesis, environmental chemistry, and chemical analysis.' }
];

const DEFAULT_COURSES = [
  { name: 'Bachelor of Computer Applications (BCA)', code: 'BCA', duration: '3 Years (6 Semesters)', eligibility: '10+2 / PUC Pass with Mathematics, Statistics, or Computer Science', fees: 'Rs. 25,000 / Year', seats: '60 Seats', description: 'Comprehensive curriculum in programming languages, databases, and AI.' },
  { name: 'Bachelor of Science (B.Sc)', code: 'B.Sc (PMCs / CBZ)', duration: '3 Years (6 Semesters)', eligibility: '10+2 / PUC Science Stream', fees: 'Rs. 18,000 / Year', seats: '120 Seats', description: 'Physical and biological sciences with modern lab practicals.' }
];

const DEFAULT_ADMISSION_INFO = [
  { category: 'admission', title: 'Admission Process', content: 'Submit 10th & 12th/PUC marks cards along with TC and application form. Selection is merit-based followed by document verification.' },
  { category: 'eligibility', title: 'Eligibility Criteria', content: 'Applicants must have cleared the Karnataka 2nd PUC examination or equivalent 10+2 with qualifying marks.' },
  { category: 'fees', title: 'Fee Payment & Concessions', content: 'Tuition fees must be paid per year. Post-matric scholarships (SSP/NSP) apply for eligible candidates.' }
];

const DEFAULT_FAQS = [
  { question: 'How do I apply for BCA admission in UCS Tumkur?', answer: 'You can apply online through this admission portal or visit the college admission desk with original copies of your marks cards.' },
  { question: 'What are the college working and library hours?', answer: 'Regular classes run from 9:30 AM to 4:30 PM. The library remains open until 5:30 PM.' },
  { question: 'Are hostel facilities available?', answer: 'Yes, separate hostel facilities with mess services are provided for boys and girls near campus.' }
];

const DEFAULT_PROMPTS: QuickPrompt[] = [
  { id: '1', label: 'Admission Process', prompt: 'Tell me about admission process' },
  { id: '2', label: 'Available Courses', prompt: 'What courses are offered?' },
  { id: '3', label: 'Department HODs', prompt: 'Who are the department heads?' },
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
      text: `Hello! 👋 Welcome to **University College of Science, Tumkur**.\nI am your **AI Admission & Campus Assistant**.\nI can answer questions about **Admissions, Courses, HODs, Fees, Hostels, and Contact details**.\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🌐 Live Knowledge Pools across ALL Pages 🌐
  const [kbList, setKbList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>(DEFAULT_COURSES);
  const [deptsList, setDeptsList] = useState<any[]>(DEFAULT_DEPTS);
  const [admissionList, setAdmissionList] = useState<any[]>(DEFAULT_ADMISSION_INFO);
  const [faqsList, setFaqsList] = useState<any[]>(DEFAULT_FAQS);
  const [settingsData, setSettingsData] = useState<any>({
    college_name: 'University College Of Science, Tumkur',
    address: 'Tumkur University Campus, BH Road, Tumkur - 572103',
    phone: '0816-2203500',
    email: 'ucscience@tumkuruniversity.ac.in',
    website: 'https://tumkuruniversity.ac.in'
  });

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

  // 🌟 Load Data From ALL Tables in Parallel 🌟
  const fetchAllWebsiteData = async () => {
    try {
      // 1. Fetch AI Knowledge
      const { data: kb } = await supabase.from('chatbot_knowledge').select('*');
      if (kb && kb.length > 0) setKbList(kb);

      // 2. Fetch Courses
      const { data: crs } = await supabase.from('college_courses').select('*');
      if (crs && crs.length > 0) setCoursesList(crs);

      // 3. Fetch Departments / HODs (About Page)
      const { data: dpt } = await supabase.from('college_departments').select('*');
      if (dpt && dpt.length > 0) setDeptsList(dpt);

      // 4. Fetch Admission Guidelines
      const { data: adm } = await supabase.from('college_information').select('*');
      if (adm && adm.length > 0) setAdmissionList(adm);

      // 5. Fetch FAQs
      const { data: fq } = await supabase.from('college_faqs').select('*');
      if (fq && fq.length > 0) setFaqsList(fq);

      // 6. Fetch Settings / Contact
      const { data: st } = await supabase.from('college_settings').select('*').limit(1).maybeSingle();
      if (st) setSettingsData((prev: any) => ({ ...prev, ...st }));

      // 7. Quick Prompts
      const { data: qp } = await supabase.from('quick_prompts').select('*').order('created_at', { ascending: true });
      if (qp && qp.length > 0) setQuickPrompts(qp);

    } catch (err) {
      console.warn('Sync website data notice:', err);
    }
  };

  useEffect(() => {
    fetchAllWebsiteData();
    window.addEventListener('storage', fetchAllWebsiteData);
    return () => window.removeEventListener('storage', fetchAllWebsiteData);
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

    const payload = {
      id: 'chat-' + Date.now(),
      user_name: studentName,
      user_email: studentEmail,
      message: userMsg,
      user_query: userMsg,
      response: aiReply,
      bot_reply: aiReply,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('chat_history').insert([payload]);
    } catch {}
  };

  // 🧠 Universal Site-Wide Intelligent Semantic Reasoner 🧠
  const analyzeAllSources = (query: string): string => {
    const q = query.toLowerCase().trim();
    const tokens = q.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 2);

    // 1️⃣ DOMAIN: ABOUT / DEPARTMENTS / HODs (Check college_departments)
    const isDeptOrHODQuery = q.includes('head') || q.includes('hod') || q.includes('dept') || q.includes('faculty') || q.includes('staff') || q.includes('ramani') || q.includes('shwetha') || q.includes('manjunath') || q.includes('geetha');
    if (isDeptOrHODQuery) {
      for (const d of deptsList) {
        const dName = (d.name || '').toLowerCase();
        const dHead = (d.head || '').toLowerCase();
        
        if (
          (dHead && q.includes(dHead)) ||
          (q.includes('bca') && (dName.includes('bca') || dName.includes('computer'))) ||
          (q.includes('computer') && dName.includes('computer')) ||
          (q.includes('physics') && dName.includes('physics')) ||
          (q.includes('math') && dName.includes('math')) ||
          (q.includes('chem') && dName.includes('chem'))
        ) {
          return `🏛️ **${d.name}:**\n• **Head of Department (HOD):** ${d.head}\n• **Overview:** ${d.description || 'Equipped with modern lab infrastructure and experienced faculty.'}`;
        }
      }
      return `🏛️ **Academic Departments & Heads:**\n\n${deptsList.map((d: any) => `• **${d.name}**\n  👤 Head: **${d.head}**\n  ${d.description || ''}`).join('\n\n')}`;
    }

    // 2️⃣ DOMAIN: ADMISSIONS (Check college_information & AI Knowledge)
    const isAdmissionQuery = q.includes('admi') || q.includes('apply') || q.includes('seat') || q.includes('eligib') || q.includes('join') || q.includes('form') || q.includes('how to apply');
    if (isAdmissionQuery) {
      // Find from college_information table
      const admInfo = admissionList.filter(a => (a.category || '').toLowerCase() === 'admission' || (a.category || '').toLowerCase() === 'eligibility');
      if (admInfo.length > 0) {
        return `🎓 **Admission Guidelines & Eligibility:**\n\n${admInfo.map(a => `• **${a.title}:**\n  ${a.content}`).join('\n\n')}\n\n📞 Admission Helpline: **${settingsData?.phone || '0816-2203500'}**`;
      }
      return `🎓 **Admission Process & Eligibility:**\n\n1. **Eligibility:** PUC / 10+2 with Science / Mathematics.\n2. **Application:** Submit forms online or at the admission counter.\n3. **Documents:** 10th & 12th Marks Cards, TC, Category/Income certificates.\n4. **Selection:** Merit list followed by document verification.\n\n📞 Helpline: **${settingsData?.phone || '0816-2203500'}**`;
    }

    // 3️⃣ DOMAIN: FEES & SCHOLARSHIPS (Check college_information & courses)
    const isFeeQuery = q.includes('fee') || q.includes('cost') || q.includes('scholar') || q.includes('ssp') || q.includes('nsp') || q.includes('amount') || q.includes('pay');
    if (isFeeQuery) {
      const feeInfo = admissionList.find(a => (a.category || '').toLowerCase() === 'fees');
      const bcaCourse = coursesList.find(c => (c.name || '').toLowerCase().includes('bca') || (c.code || '').toLowerCase() === 'bca');
      const bscCourse = coursesList.find(c => (c.name || '').toLowerCase().includes('b.sc') || (c.code || '').toLowerCase() === 'bsc');

      let feeText = `💰 **Fee Structure & Scholarships:**\n\n`;
      if (bcaCourse) feeText += `• **${bcaCourse.name}:** *${bcaCourse.fees || 'Rs. 25,000 / Year'}*\n`;
      if (bscCourse) feeText += `• **${bscCourse.name}:** *${bscCourse.fees || 'Rs. 18,000 / Year'}*\n`;
      feeText += `\n• **Scholarships:** SSP (State Scholarship Portal) and NSP post-matric scholarships apply for eligible SC/ST/OBC/Minority students.`;
      if (feeInfo?.content) feeText += `\n• ${feeInfo.content}`;
      return feeText;
    }

    // 4️⃣ DOMAIN: COURSES (Check college_courses table)
    const isCourseQuery = q.includes('cours') || q.includes('branch') || q.includes('program') || q.includes('bca') || q.includes('bsc') || q.includes('msc') || q.includes('degree');
    if (isCourseQuery) {
      // Check for specific BCA request
      if (q.includes('bca')) {
        const bca = coursesList.find(c => (c.name || '').toLowerCase().includes('bca') || (c.code || '').toLowerCase() === 'bca');
        if (bca) {
          return `📚 **${bca.name} (${bca.code || 'BCA'}):**\n• **Duration:** ${bca.duration}\n• **Eligibility:** ${bca.eligibility}\n• **Tuition Fees:** ${bca.fees}\n• **Seats:** ${bca.seats}\n• **Description:** ${bca.description}`;
        }
      }
      // Return full course combinations
      return `📚 **Programs Offered at UCS Tumkur:**\n\n${coursesList.map((c: any) => `• **${c.name}** (${c.duration || '3 Years'})\n  Eligibility: ${c.eligibility}\n  Fees: *${c.fees}* | Seats: ${c.seats}`).join('\n\n')}`;
    }

    // 5️⃣ DOMAIN: CONTACT, PHONE & ADDRESS (Check college_settings)
    const isContactQuery = q.includes('contact') || q.includes('phone') || q.includes('call') || q.includes('email') || q.includes('address') || q.includes('locat') || q.includes('help') || q.includes('website');
    if (isContactQuery) {
      return `📍 **Campus Contact & Office Details:**\n• **Institution:** ${settingsData?.college_name}\n• **Address:** ${settingsData?.address}\n• **Phone:** 📞 **${settingsData?.phone}**\n• **Email:** 📧 **${settingsData?.email}**\n• **Website:** 🌐 ${settingsData?.website}`;
    }

    // 6️⃣ DOMAIN: FAQS (Check college_faqs table)
    for (const faq of faqsList) {
      const fqQ = (faq.question || '').toLowerCase();
      if (tokens.some(t => fqQ.includes(t) && t.length >= 3) || q.includes(fqQ)) {
        return `💡 **FAQ:**\n**Q: ${faq.question}**\n\n${faq.answer}`;
      }
    }

    // 7️⃣ DOMAIN: AI KNOWLEDGE BASE (Check chatbot_knowledge table)
    for (const kb of kbList) {
      const topic = (kb.topic || '').toLowerCase();
      const content = (kb.content || '').toLowerCase();
      if (q.includes(topic) || tokens.some(t => topic.includes(t) || content.includes(t))) {
        return kb.content;
      }
    }

    // 8️⃣ GREETINGS
    if (['hi', 'hello', 'hey', 'namaste', 'start'].some(g => q.startsWith(g))) {
      return `Hello! 👋 Welcome to **University College of Science, Tumkur**.\nHow can I assist you with **Admissions, Courses, HODs, Fees, Hostels, or Contact details** today?`;
    }

    // Default Fallback
    return `🎓 **UCS Tumkur Campus Helpdesk:**\nFor admission eligibility, course combinations, fee waivers, or department details, please contact the office at 📞 **${settingsData?.phone || '0816-2203500'}** or visit ${settingsData?.website || 'https://tumkuruniversity.ac.in'}`;
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

    const botReplyText = analyzeAllSources(textToSend);

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
    localStorage.setItem('ucs_quick_prompts', JSON.stringify(updated));

    await supabase.from('quick_prompts').delete().eq('id', id);
    await fetchAllWebsiteData();
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
    await fetchAllWebsiteData();
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
          
          {/* Top Bar */}
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Bot size={16} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">UCS AI Assistant</h2>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online (Connected to all Pages)</span>
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

          {/* Quick Prompts Bar */}
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

          {/* Fixed Input Box */}
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
