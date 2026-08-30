import { useEffect, useState } from 'react';
import { HelpCircle, ChevronDown, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { PageContainer, PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'ucs_crud_faqs';

const DEFAULT_FAQS = [
  {
    id: 'faq-1',
    question: 'How do I apply for BCA admission in UCS Tumkur?',
    answer: 'You can apply online through this admission portal or visit the college admission desk with original and photocopies of your 10th & 12th/PUC marks cards.',
    category: 'Admission',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'faq-2',
    question: 'What are the college working and library hours?',
    answer: 'Regular theory and practical classes run from 9:30 AM to 4:30 PM. The central library and computer labs remain open until 5:30 PM on all working days.',
    category: 'General',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'faq-3',
    question: 'Are hostel facilities available for outstation students?',
    answer: 'Yes, separate hostel facilities with mess services are provided for both boys and girls near the Tumkur University campus with 24/7 security.',
    category: 'Facilities',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'faq-4',
    question: 'What scholarships are available for students?',
    answer: 'State Government SSP & NSP post-matric scholarships, fee concessions, and merit scholarships are available for eligible SC, ST, OBC, and minority students.',
    category: 'Scholarships',
    sort_order: 4,
    is_active: true,
  },
];

export function FAQPage() {
  const { isAdmin: contextIsAdmin, user } = useAuth();

  // Admin Verification
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

  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  // Admin In-place FAQ State
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqCategory, setFaqCategory] = useState('General');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  // Fetch from Supabase Cloud & Fallback to LocalStorage
  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('college_faqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setFaqs(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setFaqs(parsed.length > 0 ? parsed : DEFAULT_FAQS);
        } else {
          setFaqs(DEFAULT_FAQS);
        }
      }
    } catch {
      const raw = localStorage.getItem(STORAGE_KEY);
      setFaqs(raw ? JSON.parse(raw) : DEFAULT_FAQS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
    window.addEventListener('storage', fetchFaqs);
    return () => window.removeEventListener('storage', fetchFaqs);
  }, []);

  // Save or Update FAQ in Cloud & LocalStorage
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;

    const payload = {
      category: faqCategory.trim() || 'General',
      question: faqQuestion.trim(),
      answer: faqAnswer.trim(),
    };

    if (editingFaqId) {
      const { error } = await supabase
        .from('college_faqs')
        .update(payload)
        .eq('id', editingFaqId);

      if (error) {
        alert('Supabase Update Error: ' + error.message);
        return;
      }

      setEditingFaqId(null);
    } else {
      const newFaqItem = {
        id: 'faq-' + Date.now(),
        ...payload,
        sort_order: faqs.length + 1,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('college_faqs')
        .insert([newFaqItem]);

      if (error) {
        alert('Supabase Insert Error: ' + error.message);
        return;
      }
    }

    setFaqCategory('General');
    setFaqQuestion('');
    setFaqAnswer('');
    setShowFaqModal(false);

    // Refresh immediately from Supabase Cloud
    await fetchFaqs();
  };

  // Delete FAQ from Cloud & LocalStorage
  const handleDeleteFaq = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      const { error } = await supabase
        .from('college_faqs')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Supabase Delete Error: ' + error.message);
      } else {
        await fetchFaqs();
      }
    }
  };

  const categories = [...new Set(faqs.map((f) => f.category || 'General'))];

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <PageHeader icon={HelpCircle} title="Frequently Asked Questions" subtitle="Quick answers to common queries about the college" />
        {isAdmin && (
          <button
            onClick={() => {
              setEditingFaqId(null);
              setFaqCategory('General');
              setFaqQuestion('');
              setFaqAnswer('');
              setShowFaqModal(true);
            }}
            className="self-start sm:self-auto text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3.5 py-2 rounded-xl border border-primary-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            <span>Add FAQ</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : faqs.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No FAQs available" subtitle="Please check back later or ask the AI chatbot." />
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="text-sm font-bold text-primary-700 uppercase tracking-wide mb-3 px-1">{cat}</h3>
              <div className="space-y-2">
                {faqs
                  .filter((f) => (f.category || 'General') === cat)
                  .map((faq) => (
                    <div key={faq.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="w-full flex items-center justify-between gap-3 p-4 hover:bg-gray-50 transition-colors">
                        <button
                          onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                          className="flex-1 text-left flex items-center justify-between gap-3 font-semibold text-gray-800 text-sm cursor-pointer"
                        >
                          <span>{faq.question}</span>
                          <ChevronDown
                            size={18}
                            className={`text-gray-400 shrink-0 transition-transform ${openId === faq.id ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {/* Admin Action Buttons */}
                        {isAdmin && (
                          <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-md border border-gray-200 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFaqId(faq.id);
                                setFaqCategory(faq.category || 'General');
                                setFaqQuestion(faq.question);
                                setFaqAnswer(faq.answer);
                                setShowFaqModal(true);
                              }}
                              title="Edit FAQ"
                              className="p-1 text-primary-600 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteFaq(faq.id, e)}
                              title="Delete FAQ"
                              className="p-1 text-rose-600 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      {openId === faq.id && (
                        <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed animate-fade-in border-t border-gray-50 pt-2">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Add/Edit FAQ Modal */}
      {isAdmin && showFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-800">
                {editingFaqId ? 'Modify FAQ' : 'Add New FAQ'}
              </h3>
              <button
                onClick={() => setShowFaqModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Category (e.g. Admission, General, Facilities)</label>
                <input
                  type="text"
                  required
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
                  placeholder="e.g. Admission"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="e.g. What are the college library timings?"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Answer</label>
                <textarea
                  rows={3}
                  required
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Provide precise answer..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600 leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{editingFaqId ? 'Update FAQ' : 'Save FAQ'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default FAQPage;
