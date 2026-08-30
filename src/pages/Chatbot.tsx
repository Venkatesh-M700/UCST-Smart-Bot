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

const STORAGE_KEYS = {
  DEPTS: 'ucs_crud_departments',
  COURSES: 'ucs_courses_data',
  ADMISSION: 'ucs_crud_college_information',
  FAQS: 'ucs_crud_faqs',
  SETTINGS: 'ucs_college_settings',
  KNOWLEDGE: 'ucs_admin_knowledge',
  PROMPTS: 'ucs_quick_prompts'
};

const DEFAULT_DEPTS = [
  { id: 'dept-1', name: 'Department of Computer Science & BCA', head: 'Dr. Ramani', description: 'Offering state-of-the-art education in software engineering, AI, data science, and web development with modern computer labs.' },
  { id: 'dept-2', name: 'Department of Physics & Electronics', head: 'Dr. Shwetha N.', description: 'Equipped with advanced research laboratories focusing on electronics, material science, and computational physics.' },
  { id: 'dept-3', name: 'Department of Mathematics & Statistics', head: 'Prof. Manjunath B.', description: 'Fostering analytical mindset, mathematical modeling, data analytics, and pure research.' },
  { id: 'dept-4', name: 'Department of Chemistry & Biochemistry', head: 'Dr. Geetha S.', description: 'Engaged in organic synthesis, environmental chemistry, and pharmaceutical analysis.' }
];

const DEFAULT_COURSES = [
  { id: 'course-1', name: 'Bachelor of Computer Applications (BCA)', code: 'BCA', duration: '3 Years (6 Semesters)', eligibility: '10+2 / PUC Pass with Mathematics, Statistics, or Computer Science', fees: 'Rs. 25,000 / Year', seats: '60 Seats', description: 'Comprehensive curriculum in programming languages, databases, web technologies, and software engineering.' },
  { id: 'course-2', name: 'BCA (Data Science & AI)', code: 'BCA-DS', duration: '3 Years (6 Semesters)', eligibility: '10+2 / PUC with Mathematics/Statistics', fees: 'Rs. 50,000 / Year', seats: '40 Seats', description: 'Specialized program covering Artificial Intelligence, Big Data, and Machine Learning.' },
  { id: 'course-3', name: 'Bachelor of Science (B.Sc)', code: 'B.Sc (PMCs / CBZ)', duration: '3 Years (6 Semesters)', eligibility: '10+2 / PUC Science Stream', fees: 'Rs. 18,000 / Year', seats: '120 Seats', description: 'Core physical and biological science disciplines with state-of-the-art laboratory practicals.' }
];

const DEFAULT_ADMISSION = [
  { id: 'info-1', category: 'admission', title: '1) Merit List', content: 'Eligible students are shortlisted based on the merit list.' },
  { id: 'info-2', category: 'admission', title: '2) Counselling', content: 'Shortlisted students are called for the counselling process.' },
  { id: 'info-3', category: 'admission', title: '3) First Merit Selection', content: 'During counselling, students from the first merit list are given priority for seat selection.' },
  { id: 'info-4', category: 'admission', title: '4) Payment Seat Selection', content: 'After the first merit selection, students eligible for payment seats can select the available seats.' },
  { id: 'info-5', category: 'admission', title: '5) Fee Payment', content: 'Selected students must pay the prescribed admission fees.' },
  { id: 'info-6', category: 'admission', title: '6) Document Submission', content: 'Students must submit all the required documents for verification.' },
  { id: 'info-7', category: 'admission', title: '7) Admission Confirmation', content: 'After successful fee payment and document verification, the student\'s admission is confirmed.' }
];

const DEFAULT_FAQS = [
  { question: 'How do I apply for BCA admission in UCS Tumkur?', answer: 'You can apply online through this admission portal or visit the college admission desk with original marks cards.' },
  { question: 'What are the college working and library hours?', answer: 'Regular theory and practical classes run from 9:30 AM to 4:30 PM. The library remains open until 5:30 PM.' },
  { question: 'Are hostel facilities available for outstation students?', answer: 'Yes, separate hostel facilities with mess services are provided for both boys and girls near campus.' }
];

const DEFAULT_PROMPTS: QuickPrompt[] = [
  { id: '1', label: 'Admission Process', prompt: 'Tell me about admission process' },
  { id: '2', label: 'BCA Course Details', prompt: 'Tell me about BCA course' },
  { id: '3', label: 'Our Departments', prompt: 'Show our departments and HODs' },
  { id: '4', label: 'Fee Structure', prompt: 'What is the fee structure?' },
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
      text: `Hello! 👋 Welcome to **University College of Science, Tumkur**.\nI am your **AI Campus Assistant**.\nAsk me anything regarding **Admissions, Courses, Departments/HODs, Fees, Eligibility, or Contact details**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [webData, setWebData] = useState({
    depts: DEFAULT_DEPTS,
    courses: DEFAULT_COURSES,
    admission: DEFAULT_ADMISSION,
    faqs: DEFAULT_FAQS,
    settings: {
      college_name: 'University College of Science, Tumkur',
      address: 'Tumkur University Campus, BH Road, Tumkur - 572103',
      phone: '0816-2203500',
      email: 'ucscience@tumkuruniversity.ac.in',
      website: 'https://tumkuruniversity.ac.in'
    },
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

  const sortNaturally = (list: any[]) => {
    return [...list].sort((a, b) => {
      const titleA = a.title || a.name || '';
      const titleB = b.title || b.name || '';
      const numA = parseInt(titleA.match(/\d+/)?.[0] || '999', 10);
      const numB = parseInt(titleB.match(/\d+/)?.[0] || '999', 10);
      if (numA !== numB) return numA - numB;
      return (new Date(a.created_at || 0).getTime()) - (new Date(b.created_at || 0).getTime());
    });
  };

  const syncAllPages = async () => {
    let freshDepts = DEFAULT_DEPTS;
    let freshCourses = DEFAULT_COURSES;
    let freshAdmission = DEFAULT_ADMISSION;
    let freshFaqs = DEFAULT_FAQS;
    let freshSettings = webData.settings;
    let freshKb: any[] = [];

    try {
      const d = localStorage.getItem(STORAGE_KEYS.DEPTS);
      if (d && JSON.parse(d).length > 0) freshDepts = JSON.parse(d);
      const c = localStorage.getItem(STORAGE_KEYS.COURSES);
      if (c && JSON.parse(c).length > 0) freshCourses = JSON.parse(c);
      const a = localStorage.getItem(STORAGE_KEYS.ADMISSION);
      if (a && JSON.parse(a).length > 0) freshAdmission = JSON.parse(a);
      const f = localStorage.getItem(STORAGE_KEYS.FAQS);
      if (f && JSON.parse(f).length > 0) freshFaqs = JSON.parse(f);
      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (s) freshSettings = JSON.parse(s);
      const k = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE);
      if (k && JSON.parse(k).length > 0) freshKb = JSON.parse(k);
    } catch {}

    try {
      const [dRes, cRes, aRes, fRes, sRes, kRes] = await Promise.all([
        supabase.from('college_departments').select('*').order('created_at', { ascending: true }),
        supabase.from('college_courses').select('*').order('created_at', { ascending: true }),
        supabase.from('college_information').select('*').order('created_at', { ascending: true }),
        supabase.from('college_faqs').select('*').order('created_at', { ascending: true }),
        supabase.from('college_settings').select('*').limit(1).maybeSingle(),
        supabase.from('chatbot_knowledge').select('*').order('created_at', { ascending: true })
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
      depts: freshDepts && freshDepts.length > 0 ? freshDepts : DEFAULT_DEPTS,
      courses: freshCourses && freshCourses.length > 0 ? freshCourses : DEFAULT_COURSES,
      admission: sortNaturally(freshAdmission && freshAdmission.length > 0 ? freshAdmission : DEFAULT_ADMISSION),
      faqs: freshFaqs && freshFaqs.length > 0 ? freshFaqs : DEFAULT_FAQS,
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

  // 🧠 Absolute Guaranteed Priority Matcher (Direct Zero-Leak Router) 🧠
  const parseAndAnswer = (query: string): string => {
    const q = query.toLowerCase().trim();

    // 1. Guaranteed Fresh Department Data
    let activeDepts = DEFAULT_DEPTS;
    try {
      const rawD = localStorage.getItem(STORAGE_KEYS.DEPTS);
      if (rawD && JSON.parse(rawD).length > 0) {
        activeDepts = JSON.parse(rawD);
      } else if (webData.depts && webData.depts.length > 0) {
        activeDepts = webData.depts;
      }
    } catch {
      activeDepts = DEFAULT_DEPTS;
    }

    // 2. Guaranteed Fresh Course Data
    let activeCourses = DEFAULT_COURSES;
    try {
      const rawC = localStorage.getItem(STORAGE_KEYS.COURSES);
      if (rawC && JSON.parse(rawC).length > 0) {
        activeCourses = JSON.parse(rawC);
      } else if (webData.courses && webData.courses.length > 0) {
        activeCourses = webData.courses;
      }
    } catch {
      activeCourses = DEFAULT_COURSES;
    }

    // 3. Guaranteed Fresh Admission Data
    let activeAdmission = DEFAULT_ADMISSION;
    try {
      const rawA = localStorage.getItem(STORAGE_KEYS.ADMISSION);
      if (rawA && JSON.parse(rawA).length > 0) {
        activeAdmission = sortNaturally(JSON.parse(rawA));
      } else if (webData.admission && webData.admission.length > 0) {
        activeAdmission = webData.admission;
      }
    } catch {
      activeAdmission = DEFAULT_ADMISSION;
    }

    // 🎯 PRIORITY 1: DEPARTMENTS & HODS (Immediate Hard Stop - No FAQ Leak)
    const isDeptIntent = 
      q.includes('department') || 
      q.includes('depart') || 
      q.includes('dept') || 
      q.includes('hod') || 
      q.includes('head') || 
      q.includes('faculty') || 
      q.includes('staff') || 
      q.includes('ramani') || 
      q.includes('shwetha') || 
      q.includes('manjunath') || 
      q.includes('geetha');

    if (isDeptIntent) {
      for (const d of activeDepts) {
        const dName = (d.name || '').toLowerCase();
        const dHead = (d.head || '').toLowerCase();
        if (
          (dHead && q.includes(dHead)) ||
          (q.includes('computer') && dName.includes('computer')) ||
          (q.includes('physics') && dName.includes('physics')) ||
          (q.includes('math') && dName.includes('math')) ||
          (q.includes('chem') && dName.includes('chem'))
        ) {
          return `🏛️ **${d.name} (About Page):**\n• **Head of Department (HOD):** ${d.head}\n• **Overview:** ${d.description || 'Offering modern lab education and experienced faculty.'}`;
        }
      }
      return `🏛️ **Our Departments & Heads (From About Page):**\n\n${activeDepts.map((d: any, idx: number) => `${idx + 1}. **${d.name}**\n   👤 Head: **${d.head}**\n   ${d.description || ''}`).join('\n\n')}`;
    }

    // 🎯 PRIORITY 2: ADMISSION PROCESS & STEPS (Immediate Hard Stop)
    const isAdmissionIntent = 
      q.includes('admi') || 
      q.includes('apply') || 
      q.includes('seat') || 
      q.includes('process') || 
      q.includes('steps') || 
      q.includes('counselling') || 
      q.includes('procedure') ||
      q.includes('how to join');

    if (isAdmissionIntent) {
      const processItems = activeAdmission.filter(a => {
        const cat = (a.category || '').toLowerCase();
        const title = (a.title || '').toLowerCase();
        return cat === 'admission' || title.match(/^\d+\)/);
      });

      if (processItems.length > 0) {
        const sorted = sortNaturally(processItems);
        return `🎓 **Admission Process & Steps (From Admission Portal):**\n\n${sorted.map(item => `• **${item.title}:**\n  ${item.content}`).join('\n\n')}\n\n📞 Admission Helpline: **${webData.settings.phone || '0816-2203500'}**`;
      }
    }

    // 🎯 PRIORITY 3: ELIGIBILITY CRITERIA ONLY
    if (q.includes('eligib') || q.includes('criteria') || q.includes('qualification')) {
      const eligItems = activeAdmission.filter(a => (a.category || '').toLowerCase() === 'eligibility');
      if (eligItems.length > 0) {
        return `📋 **Eligibility Criteria (From Admission Page):**\n\n${eligItems.map(item => `• **${item.title}:**\n  ${item.content}`).join('\n\n')}`;
      }
      return `📋 **Eligibility Criteria:**\n• **BCA:** 10+2 / PUC Pass with Mathematics / Computer Science / Statistics.\n• **B.Sc:** 10+2 / PUC Science Stream.`;
    }

    // 🎯 PRIORITY 4: FEE STRUCTURE ONLY
    if (q.includes('fee') || q.includes('cost') || q.includes('scholar') || q.includes('ssp') || q.includes('nsp') || q.includes('amount') || q.includes('payment')) {
      const feeItems = activeAdmission.filter(a => (a.category || '').toLowerCase() === 'fees');
      let feeReply = `💰 **Fee Structure (From Admission Portal):**\n\n`;
      if (feeItems.length > 0) {
        feeReply += feeItems.map(f => `• **${f.title}:** ${f.content}`).join('\n') + '\n\n';
      }
      feeReply += `• **Scholarships:** SSP, NSP, and Government fee concessions apply for eligible SC/ST/OBC students.`;
      return feeReply;
    }

    // 🎯 PRIORITY 5: SPECIFIC BCA COURSES (Strict BCA vs Data Science)
    if (q.includes('data science') || q.includes('datascience') || q.includes('bca ds')) {
      const bcaDs = activeCourses.find(c => (c.name || '').toLowerCase().includes('data science') || (c.code || '').toLowerCase().includes('ds'));
      if (bcaDs) {
        return `📚 **${bcaDs.name} (${bcaDs.code || 'BCA-DS'}):**\n• **Duration:** ${bcaDs.duration || '3 Years (6 Semesters)'}\n• **Eligibility:** ${bcaDs.eligibility || '10+2 / PUC with Mathematics/Statistics'}\n• **Fees:** ${bcaDs.fees || 'Rs. 50,000 / Year'}\n• **Seats:** ${bcaDs.seats || '40 Seats'}\n• **Overview:** ${bcaDs.description || 'Specialized program covering Artificial Intelligence, Big Data, and Machine Learning.'}`;
      }
    }

    if (q.includes('bca') || q.includes('bachelor of computer applications')) {
      const pureBca = activeCourses.find(c => {
        const name = (c.name || '').toLowerCase();
        const code = (c.code || '').toLowerCase();
        return (code === 'bca' || name.includes('bachelor of computer applications')) && !name.includes('data science');
      }) || activeCourses[0];

      if (pureBca) {
        return `📚 **${pureBca.name} (${pureBca.code || 'BCA'}):**\n• **Duration:** ${pureBca.duration || '3 Years (6 Semesters)'}\n• **Eligibility:** ${pureBca.eligibility || '10+2 / PUC with Mathematics/Computer Science'}\n• **Fees:** ${pureBca.fees || 'Rs. 25,000 / Year'}\n• **Seats:** ${pureBca.seats || '60 Seats'}\n• **Overview:** ${pureBca.description || 'Comprehensive programming, databases, web development, and cloud computing.'}`;
      }
    }

    if (q.includes('bsc') || q.includes('b.sc')) {
      const bsc = activeCourses.find(c => (c.code || '').toLowerCase().includes('bsc') || (c.name || '').toLowerCase().includes('science'));
      if (bsc) {
        return `📚 **${bsc.name} (${bsc.code || 'B.Sc'}):**\n• **Duration:** ${bsc.duration || '3 Years (6 Semesters)'}\n• **Eligibility:** ${bsc.eligibility || '10+2 / PUC Science Stream'}\n• **Fees:** ${bsc.fees || 'Rs. 18,000 / Year'}\n• **Seats:** ${bsc.seats || '120 Seats'}\n• **Overview:** ${bsc.description || 'Core physical and biological sciences with lab practicals.'}`;
      }
    }

    // 🎯 PRIORITY 6: ALL COURSES LIST
    if (q.includes('cours') || q.includes('branch') || q.includes('program') || q.includes('degre')) {
      return `📚 **Offered Courses & Combinations (From Courses Page):**\n\n${activeCourses.map((c: any) => `• **${c.name}** (${c.duration || '3 Years'})\n  Eligibility: ${c.eligibility}\n  Fees: *${c.fees}* | Seats: ${c.seats}\n  ${c.description || ''}`).join('\n\n')}`;
    }

    // 🎯 PRIORITY 7: IMPORTANT DATES
    if (q.includes('date') || q.includes('schedule') || q.includes('deadline')) {
      const dateItems = activeAdmission.filter(a => (a.category || '').toLowerCase() === 'important_dates');
      if (dateItems.length > 0) {
        return `📅 **Important Dates & Schedule (From Admission Page):**\n\n${dateItems.map(d => `• **${d.title}:**\n  ${d.content}`).join('\n\n')}`;
      }
    }

    // 🎯 PRIORITY 8: CONTACT DETAILS
    if (q.includes('contact') || q.includes('phone') || q.includes('call') || q.includes('email') || q.includes('address') || q.includes('locat')) {
      return `📍 **Campus Contact Details (From Contact Page):**\n• **Institution:** ${webData.settings.college_name}\n• **Address:** ${webData.settings.address}\n• **Phone:** 📞 **${webData.settings.phone || '0816-2203500'}**\n• **Email:** 📧 **${webData.settings.email}**\n• **Website:** 🌐 ${webData.settings.website}`;
    }

    // 🎯 PRIORITY 9: FAQ EXACT QUESTION MATCH (Matches Question String Only, NEVER Answer Body)
    for (const f of webData.faqs) {
      const fQ = (f.question || '').toLowerCase();
      if (q === fQ || (q.length > 15 && fQ.includes(q)) || (fQ.length > 15 && q.includes(fQ))) {
        return `💡 **FAQ - ${f.question}:**\n\n${f.answer}`;
      }
    }

    // 🎯 PRIORITY 10: TRAINED AI KNOWLEDGE BASE
    for (const kb of webData.knowledge) {
      const topic = (kb.topic || '').toLowerCase();
      if (q.includes(topic)) {
        return kb.content;
      }
    }

    // GREETINGS
    if (['hi', 'hello', 'hey', 'namaste', 'start'].some(g => q.startsWith(g))) {
      return `Hello! 👋 Welcome to **University College of Science, Tumkur**.\nHow can I help you regarding **Admissions, Courses, Department HODs, Fees, Hostels, or Contact details**?`;
    }

    return `🏛️ **UCS Tumkur Campus Helpdesk:**\n• We offer **BCA, B.Sc, and M.Sc** programs across 4 departments.\n• For specific inquiries, contact the helpdesk at 📞 **${webData.settings.phone || '0816-2203500'}** or visit https://tumkuruniversity.ac.in`;
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
    }, 100);
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
                  <span>Online (Synchronized with All Pages)</span>
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

          {/* Transcript Message Feed */}
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

          {/* Fixed Bottom Input Box */}
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
