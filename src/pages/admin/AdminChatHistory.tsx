import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, User, Clock, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Route } from '@/types/route';

interface AdminChatHistoryProps {
  currentRoute?: Route;
  onNavigate: (route: Route) => void;
  onSignOut?: () => void;
}

export function AdminChatHistory({ onNavigate, onSignOut }: AdminChatHistoryProps) {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(false);

  // 1. Supabase & LocalStorage ಎರಡರಿಂದಲೂ ಚಾಟ್ ಹಿಸ್ಟರಿ ತರುವುದು
  const fetchChats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setChats(data);
      } else {
        // Fallback to LocalStorage
        const local = localStorage.getItem('ucs_chat_history');
        const list = local ? JSON.parse(local) : [];
        setChats(list);
      }
    } catch (err) {
      console.error('Fetch chats error:', err);
      const local = localStorage.getItem('ucs_chat_history');
      const list = local ? JSON.parse(local) : [];
      setChats(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // 2. ಒಂದೇ ಚಾಟ್ ಡಿಲೀಟ್ ಮಾಡುವುದು
  const handleDeleteSingle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chat record?')) return;
    try {
      await supabase.from('chat_history').delete().eq('id', id);
      const updated = chats.filter((c) => c.id !== id);
      setChats(updated);
      localStorage.setItem('ucs_chat_history', JSON.stringify(updated));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // 3. 🌟 Clear All - Supabase & LocalStorage ಎರಡರಿಂದಲೂ ಸಂಪೂರ್ಣವಾಗಿ ಅಳಿಸುವುದು 🌟
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to permanently delete ALL chat history from the database?')) return;
    
    setDeleting(true);
    try {
      await supabase.from('chat_history').delete().neq('user_email', '___never_match___');
      setChats([]);
      localStorage.removeItem('ucs_chat_history');
      localStorage.removeItem('ucs_admin_chat_logs');
    } catch (err: any) {
      console.error('Clear all error:', err);
      setChats([]);
      localStorage.removeItem('ucs_chat_history');
    } finally {
      setDeleting(false);
    }
  };

  const filteredChats = chats.filter((c) => {
    const name = (c.user_name || c.user || '').toLowerCase();
    const email = (c.user_email || '').toLowerCase();
    const query = (c.message || c.user_query || c.userQuery || '').toLowerCase();
    const reply = (c.response || c.bot_reply || c.botReply || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    return name.includes(term) || email.includes(term) || query.includes(term) || reply.includes(term);
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <MessageSquare className="text-blue-500" />
            <span>AI Chatbot History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time student enquiry logs from Supabase Cloud Database</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchChats}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {chats.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={deleting}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{deleting ? 'Clearing...' : 'Clear All History'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by student name, email, or question keyword..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-100 text-sm focus:border-blue-500 outline-none"
        />
      </div>

      {/* Chat Logs List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center gap-3">
          <span className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Fetching chat records from database...</span>
        </div>
      ) : filteredChats.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80">
          <AlertCircle size={36} className="mx-auto text-slate-600 mb-2" />
          <p className="text-slate-400 text-sm font-semibold">No chat history records found.</p>
          <p className="text-xs text-slate-500 mt-1">Ask a question in the Chatbot, then check back here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChats.map((item, idx) => {
            const userText = item.message || item.user_query || item.userQuery || 'No question recorded';
            const botText = item.response || item.bot_reply || item.botReply || 'No response recorded';
            const displayName = item.user_name || item.user || 'Student Candidate';

            return (
              <div key={item.id || idx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md">
                <div className="flex justify-between items-start mb-3 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      <User size={14} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{displayName}</h4>
                      <p className="text-[11px] text-slate-400">{item.user_email || 'Enquiry Record'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </span>
                    {item.id && (
                      <button
                        onClick={() => handleDeleteSingle(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                        title="Delete this record"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Conversation Box */}
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-800/60 rounded-xl">
                    <span className="font-bold text-blue-400 block mb-1">Student Question:</span>
                    <p className="text-slate-200">{userText}</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
                    <span className="font-bold text-emerald-400 block mb-1">AI Response:</span>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{botText}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default AdminChatHistory;
