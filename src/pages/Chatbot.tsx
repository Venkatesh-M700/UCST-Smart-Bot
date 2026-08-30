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
import { useCollegeSettings, useCourses } from '@/hooks/useCollegeData';
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
  { id: 'kn-1', topic: 'NSS & Activities', content: '**UCS Tumkur** has active **NSS** and *Youth Red Cross* wings encouraging students to participate in community service, tree plantation, and annual special blood donation camps.' },
  { id: 'kn-2', topic: 'Courses Offered', content: 'We offer premier programs:\n• **BCA** (Bachelor of Computer Applications)\n• **B.Sc** (PMCs, CBZ, Electronics, Biotechnology)\n• **M.Sc** programs with top-tier faculty and lab facilities.' },
  { id: 'kn-3', topic: 'Fees & Scholarships', content: 'Tuition fees follow **Karnataka state government norms** (Approx *Rs. 25,000/year* for BCA). Post-matric SSP, NSP scholarships and category fee concessions are available.' },
  { id: 'kn-4', topic: 'Hostel Facilities', content: '**UCS Tumkur** provides secure hostel accommodation with hygienic mess facilities, 24/7 security, and study halls for both boys and girls near the campus.' },
  { id: 'kn-5', topic: 'College Helpdesk & Contact', content: '📍 **Address:** BH Road, Tumkur - 572103\n📞 **Phone:** 0816-2203500\n📧 **Email:** ucscience@tumkuruniversity.ac.in\n🌐 **Official Website:** https://tumkuruniversity.ac.in' },
  { id: 'kn-6', topic: 'Sports & Gymnasium', content: '**UCS Tumkur** features dedicated sports facilities including cricket, volleyball, kabaddi grounds, indoor badminton, table tennis, and a modern student gym.' }
];

const DEFAULT_PROMPTS: QuickPrompt[] = [
  { id: '1', label: 'Available Courses', prompt: 'What courses are offered?' },
  { id: '2', label: 'Hostel & Campus', prompt: 'Tell me about hostel and facilities' },
  { id: '3', label: 'Admission Process', prompt: 'How do I apply for BCA / B.Sc admissions?' },
  { id: '4', label: 'Contact Helpdesk', prompt: 'How to contact college office?' },
];

const KNOWLEDGE_KEY = 'ucs_admin_knowledge';

// 🌟 Ultra-Clean Robust Parser for Bold, Italic & Clickable Hyperlinks 🌟
function FormattedText({ text }: { text: string }) {
  const parseContent = (input: string) => {
    // 1. Convert Clickable URL Links
    let parsed = input.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold underline bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors break-all">$1 ↗</a>'
    );

    // 2. Bold tags (**word**)
    parsed = parsed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-extrabold text-slate-900">$1</strong>');

    // 3. Italic tags (*word* or _word_)
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

  const generateBotReplyAsync = async (query: string): Promise<string> => {
    const q = query.toLowerCase().trim();
    const cleanWords = q.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 1);

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

    let bestMatch: { content: string; score: number } | null = null;

    for (const item of knowledgeSource) {
      const topic = (item.topic || '').toLowerCase().trim();
      const content = (item.content || '').toLowerCase();
      let score = 0;

      if (q === topic) {
        score += 30;
      } else if (q.includes(topic) || topic.includes(q)) {
        score += 20;
      }

      const topicTokens = topic.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 1);
      for (const t of topicTokens) {
        if (q.includes(t)) score += 10;
        if (cleanWords.some(w => w === t)) score += 8;
      }

      for (const word of cleanWords) {
        if (content.includes(word)) score += 1;
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { content: item.content, score };
      }
    }

    if (bestMatch && bestMatch.score >= 3) {
      return bestMatch.content;
    }

    if (['hi', 'hello', 'hey', 'namaste'].some(g => q.startsWith(g))) {
      return `Hello! 👋 How can I assist you with **admissions, courses, fees, hostels, or campus details** today?`;
    }

    if (q.includes('course') || q.includes('bca') || q.includes('bsc')) {
      if (courses && courses.length > 0) {
        return `We offer premier programs:\n\n${courses.map((c: any) => `• **${c.name}** (${c.duration || '3 Years'}) - Fees: *${c.fees || 'As per norms'}*`).join('\n')}\n\nCheck the **Courses** page for more detailed information.`;
      }
    }

    return `Thank you for your question! For specific queries regarding "${query}", please contact the college helpdesk directly at **${settings?.phone || '0816-2203500'}** or visit the official website: https://tumkuruniversity.ac.in`;
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
    return <IconComp size={14} className="text-primary-600 shrink-0" />;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 flex flex-col h-[calc(100vh-130px)] min-h-[580px]">
      
      {isPromptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <Sparkles size={18} className="text-primary-600" />
                <span>{editingPromptId ? 'Edit Quick Prompt' : 'Add Quick Prompt'}</span>
              </h3>
              <button onClick={() => setIsPromptModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleSavePrompt} className="space-y-3.5 text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Button Title</label>
                <input type="text" required value={promptLabel} onChange={e => setPromptLabel(e.target.value)} placeholder="e.g. Sports" className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-primary-600 font-medium" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prompt Question</label>
                <textarea required rows={2} value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Tell me about Sports" className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-primary-600 resize-none font-medium" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setIsPromptModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 cursor-pointer shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 Full Screen Height & Full Width Chat Container 🌟 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 w-full">
        
        {/* Compact Header Bar */}
        <div className="bg-gray-50/90 px-4 md:px-6 py-3 border-b border-gray-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-md">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black text-slate-800 flex items-center gap-1.5 leading-tight">
                <span>UCS AI Assistant</span>
                <span className="text-[10px] bg-primary-100 text-primary-700 font-bold px-2 py-0.5 rounded-full">v2.4</span>
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
                className="px-3.5 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShieldCheck size={15} />
                <span>Admin Panel</span>
              </button>
            )}
            <button 
              onClick={() => setMessages([messages[0]])} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
              title="Reset Conversation"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        {/* 🌟 Chat Transcripts - Expands across full width and height with zero clipping 🌟 */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-white">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.sender === 'bot' && (
                <div className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Bot size={18} />
                </div>
              )}

              <div className={`space-y-1 ${msg.sender === 'user' ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[95%] md:max-w-[88%]'}`}>
                <div className={`p-4 md:p-5 rounded-2xl shadow-xs ${msg.sender === 'user' ? 'bg-primary-600 text-white rounded-tr-none font-medium' : 'bg-gray-50/90 text-slate-800 border border-gray-200/80 rounded-tl-none'}`}>
                  {msg.sender === 'user' ? (
                    <p className="leading-relaxed text-sm md:text-base">{msg.text}</p>
                  ) : (
                    <FormattedText text={msg.text} />
                  )}
                </div>
                <p className={`text-[11px] text-slate-400 px-1 font-semibold ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
              </div>

              {msg.sender === 'user' && (
                <div className="h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <User size={18} />
                </div>
              )}

            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start items-center">
              <div className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center"><Bot size={18} /></div>
              <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="h-2 w-2 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 bg-teal-600 rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
            <Sparkles size={14} className="text-amber-500" />
            <span>Ask:</span>
          </span>

          {quickPrompts.map((p, idx) => (
            <div key={p.id || idx} className="inline-flex items-center gap-1 shrink-0">
              <button 
                type="button" 
                onClick={() => handleSend(undefined, p.prompt)} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-primary-50 hover:text-primary-700 text-slate-700 border border-gray-200 rounded-xl text-xs md:text-sm font-bold cursor-pointer transition-colors shadow-2xs"
              >
                {getPromptIcon(idx)}
                <span>{p.label}</span>
              </button>

              {isAdminState && (
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
                  <button type="button" onClick={(e) => handleOpenEditModal(p, e)} className="p-1 text-slate-400 hover:text-primary-600 cursor-pointer"><Edit2 size={11} /></button>
                  <button type="button" onClick={(e) => handleDeletePrompt(p.id, e)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 size={11} /></button>
                </div>
              )}
            </div>
          ))}

          {isAdminState && (
            <button type="button" onClick={handleOpenAddModal} className="px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs">
              <Plus size={14} />
            </button>
          )}
        </div>

        {/* Input Chat Box */}
        <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0">
          <form onSubmit={(e) => handleSend(e)} className="flex items-center gap-2">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ask about admissions, courses, fees, hostel, NSS, sports..." 
              className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary-600 focus:bg-white text-sm md:text-base font-medium outline-none transition-all" 
            />
            <button 
              type="submit" 
              disabled={!input.trim()} 
              className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center shadow-md disabled:opacity-50 cursor-pointer shrink-0 transition-all"
            >
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Chatbot;
