import { useEffect, useState } from 'react';
import { GraduationCap, Calendar, IndianRupee, CheckSquare, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { PageContainer, PageHeader, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const INFO_STORAGE_KEY = 'ucs_crud_college_information';

const DEFAULT_INFO = [
  {
    id: 'info-1',
    category: 'admission',
    title: 'Admission Guidelines',
    content: 'Candidates seeking admission to BCA/B.Sc must submit 10+2 marks cards along with TC and application form.',
  },
  {
    id: 'info-2',
    category: 'eligibility',
    title: 'General Eligibility Guidelines',
    content: 'Applicants must have cleared the Karnataka 2nd PUC examination or any recognized 10+2 equivalent with minimum qualifying aggregate percentage.',
  },
  {
    id: 'info-3',
    category: 'fees',
    title: 'Fee Payment & Concessions',
    content: 'Tuition fees must be paid per academic semester/year. Post-metric scholarships, SSP, and fee reimbursements apply for eligible candidates.',
  },
  {
    id: 'info-4',
    category: 'important_dates',
    title: 'Admission Schedule 2026-27',
    content: 'Application Submission Deadline: July 31, 2026\nDocument Verification: First week of August 2026\nCommencement of Classes: Mid August 2026',
  },
];

export function Admission() {
  const { isAdmin: contextIsAdmin, user } = useAuth();

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

  const [info, setInfo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Info Modal State
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editingInfoId, setEditingInfoId] = useState<string | null>(null);
  const [infoCategory, setInfoCategory] = useState('admission');
  const [infoTitle, setInfoTitle] = useState('');
  const [infoContent, setInfoContent] = useState('');

  const fetchInfoData = async () => {
    try {
      const { data, error } = await supabase
        .from('college_information')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch info error:', error);
      } else if (data && data.length > 0) {
        setInfo(data);
        localStorage.setItem(INFO_STORAGE_KEY, JSON.stringify(data));
      } else {
        const rawInfo = localStorage.getItem(INFO_STORAGE_KEY);
        setInfo(rawInfo ? JSON.parse(rawInfo) : DEFAULT_INFO);
      }
    } catch {
      const rawInfo = localStorage.getItem(INFO_STORAGE_KEY);
      setInfo(rawInfo ? JSON.parse(rawInfo) : DEFAULT_INFO);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfoData();
    window.addEventListener('storage', fetchInfoData);
    return () => window.removeEventListener('storage', fetchInfoData);
  }, []);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoTitle.trim()) return;

    const payload = {
      category: infoCategory,
      title: infoTitle.trim(),
      content: infoContent.trim(),
    };

    if (editingInfoId) {
      const { error } = await supabase
        .from('college_information')
        .update(payload)
        .eq('id', editingInfoId);

      if (error) {
        alert('Supabase Update Error: ' + error.message);
        return;
      }

      setEditingInfoId(null);
    } else {
      const newInfoItem = {
        id: 'info-' + Date.now(),
        ...payload,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('college_information')
        .insert([newInfoItem]);

      if (error) {
        alert('Supabase Insert Error: ' + error.message);
        return;
      }
    }

    setInfoTitle('');
    setInfoContent('');
    setShowInfoModal(false);

    // Refresh immediately from Supabase Cloud
    await fetchInfoData();
  };

  const handleDeleteInfo = async (id: string) => {
    if (window.confirm('Delete this guideline?')) {
      const { error } = await supabase
        .from('college_information')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Supabase Delete Error: ' + error.message);
      } else {
        await fetchInfoData();
      }
    }
  };

  const grouped = info.reduce<Record<string, any[]>>((acc, item) => {
    const cat = (item.category || 'admission').toLowerCase();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoryConfig = [
    { key: 'admission', title: 'Admission Process', icon: GraduationCap, color: 'bg-sky-50 text-sky-600' },
    { key: 'eligibility', title: 'Eligibility Criteria', icon: CheckSquare, color: 'bg-emerald-50 text-emerald-600' },
    { key: 'fees', title: 'Fee Structure', icon: IndianRupee, color: 'bg-amber-50 text-amber-600' },
    { key: 'important_dates', title: 'Important Dates', icon: Calendar, color: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <PageContainer>
      <PageHeader icon={GraduationCap} title="Admission Information" subtitle="Everything you need to know about getting admitted" />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
          {/* CATEGORY SECTIONS (Admission Process, Eligibility, Fees, Important Dates) */}
          {categoryConfig.map(({ key, title, icon: Icon, color }) => {
            const items = grouped[key];
            return (
              <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon size={16} />
                    </div>
                    <span>{title}</span>
                  </h3>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingInfoId(null);
                        setInfoCategory(key);
                        setInfoTitle('');
                        setInfoContent('');
                        setShowInfoModal(true);
                      }}
                      className="self-start sm:self-auto text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus size={14} />
                      <span>Add to {title}</span>
                    </button>
                  )}
                </div>

                {(!items || items.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No information added yet for this section.</p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="border-l-2 border-sky-400 pl-4 py-1 relative">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                          {isAdmin && (
                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-md border border-gray-200">
                              <button
                                onClick={() => {
                                  setEditingInfoId(item.id);
                                  setInfoCategory(item.category || key);
                                  setInfoTitle(item.title);
                                  setInfoContent(item.content);
                                  setShowInfoModal(true);
                                }}
                                title="Edit"
                                className="p-1 text-sky-600 hover:bg-white rounded cursor-pointer"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteInfo(item.id)}
                                title="Delete"
                                className="p-1 text-rose-600 hover:bg-white rounded cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add/Edit Info Modal */}
      {isAdmin && showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-800">
                {editingInfoId ? 'Modify Guideline' : 'Add Admission Guideline'}
              </h3>
              <button onClick={() => setShowInfoModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Section</label>
                <select
                  value={infoCategory}
                  onChange={(e) => setInfoCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-sky-600 font-bold"
                >
                  <option value="admission">Admission Process</option>
                  <option value="eligibility">Eligibility Criteria</option>
                  <option value="fees">Fee Structure</option>
                  <option value="important_dates">Important Dates</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={infoTitle}
                  onChange={(e) => setInfoTitle(e.target.value)}
                  placeholder="e.g. Admission Guidelines"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description / Steps</label>
                <textarea
                  rows={4}
                  required
                  value={infoContent}
                  onChange={(e) => setInfoContent(e.target.value)}
                  placeholder="Write clear instructions..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-sky-600 leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{editingInfoId ? 'Update Guideline' : 'Save Guideline'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInfoModal(false)}
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

export default Admission;
