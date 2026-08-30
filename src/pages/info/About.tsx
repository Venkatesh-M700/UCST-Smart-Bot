import { useEffect, useState } from 'react';
import { School, Building2, MapPin, Phone, Mail, Globe, BookOpen, Users, Award, Sparkles, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { PageContainer, PageHeader, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'ucs_crud_departments';

interface Department {
  id: string;
  name: string;
  head: string;
  description: string;
}

const DEFAULT_DEPTS: Department[] = [
  {
    id: 'dept-1',
    name: 'Department of Computer Science & BCA',
    head: 'Dr. Ramani',
    description: 'Offering state-of-the-art education in software engineering, AI, data science, and web development with modern computer labs.'
  },
  {
    id: 'dept-2',
    name: 'Department of Physics & Electronics',
    head: 'Dr. Shwetha N.',
    description: 'Equipped with advanced research laboratories focusing on electronics, material science, and computational physics.'
  },
  {
    id: 'dept-3',
    name: 'Department of Mathematics & Statistics',
    head: 'Prof. Manjunath B.',
    description: 'Fostering analytical mindset, mathematical modeling, data analytics, and pure research.'
  },
  {
    id: 'dept-4',
    name: 'Department of Chemistry & Biochemistry',
    head: 'Dr. Geetha S.',
    description: 'Engaged in organic synthesis, environmental chemistry, and pharmaceutical analysis.'
  }
];

export function About() {
  const { isAdmin: contextIsAdmin, user } = useAuth();

  const getAdminStatus = () => {
    try {
      const raw = localStorage.getItem('ucs_auth_user');
      const adminFlag = localStorage.getItem('ucs_admin_session');
      const parsed = raw ? JSON.parse(raw) : null;
      return Boolean(
        contextIsAdmin ||
        user?.role === 'admin' ||
        parsed?.role === 'admin' ||
        parsed?.email?.toLowerCase().includes('admin') ||
        adminFlag === 'true'
      );
    } catch {
      return false;
    }
  };

  // Helper function to keep Computer Science always on top
  const sortWithCSFirst = (list: Department[]) => {
    return [...list].sort((a, b) => {
      const aIsCS = a.name.toLowerCase().includes('computer science');
      const bIsCS = b.name.toLowerCase().includes('computer science');
      if (aIsCS && !bIsCS) return -1;
      if (!aIsCS && bIsCS) return 1;
      return 0;
    });
  };

  const [isAdmin, setIsAdmin] = useState(getAdminStatus);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dbSettingsId, setDbSettingsId] = useState<any>(null);

  // Banner Details
  const [title, setTitle] = useState('University College of Science');
  const [tagline, setTagline] = useState('Tumkur University Campus, BH Road, Tumkur');
  const [description, setDescription] = useState('University College of Science, Tumkur is a premier constituent institution dedicated to excellence in science education. It fosters innovation and student growth through state-of-the-art laboratory infrastructure and experienced faculty.');

  // Contact Details
  const [address, setAddress] = useState('Tumkur University Campus, BH Road, Tumkur - 572103');
  const [phone, setPhone] = useState('0816-2203500');
  const [email, setEmail] = useState('ucscience@tumkuruniversity.ac.in');
  const [website, setWebsite] = useState('https://tumkuruniversity.ac.in');

  // Modals
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  // Form Temp States
  const [tempTitle, setTempTitle] = useState('');
  const [tempTagline, setTempTagline] = useState('');
  const [tempDesc, setTempDesc] = useState('');

  const [tempAddr, setTempAddr] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempWeb, setTempWeb] = useState('');

  const [deptName, setDeptName] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  const loadAllAboutData = async () => {
    // 1. Settings Fetch
    try {
      const { data: sData } = await supabase.from('college_settings').select('*').limit(1).maybeSingle();
      if (sData) {
        setDbSettingsId(sData.id);
        if (sData.college_name) setTitle(sData.college_name);
        if (sData.tagline) setTagline(sData.tagline);
        if (sData.about_text) setDescription(sData.about_text);
        if (sData.address) setAddress(sData.address);
        if (sData.phone) setPhone(sData.phone);
        if (sData.email) setEmail(sData.email);
        if (sData.website) setWebsite(sData.website);
      }
    } catch (err) {
      console.error('Settings load error:', err);
    }

    // 2. Departments Fetch
    try {
      const { data, error } = await supabase
        .from('college_departments')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const sorted = sortWithCSFirst(data);
        setDepartments(sorted);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      } else {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : DEFAULT_DEPTS;
        setDepartments(sortWithCSFirst(parsed));
      }
    } catch (err) {
      console.error('Dept load error:', err);
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : DEFAULT_DEPTS;
      setDepartments(sortWithCSFirst(parsed));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsAdmin(getAdminStatus());
    loadAllAboutData();
  }, [user, contextIsAdmin]);

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitle(tempTitle);
    setTagline(tempTagline);
    setDescription(tempDesc);
    setShowBannerModal(false);

    try {
      if (dbSettingsId) {
        await supabase.from('college_settings').update({
          college_name: tempTitle,
          tagline: tempTagline,
          about_text: tempDesc
        }).eq('id', dbSettingsId);
      } else {
        const { data } = await supabase.from('college_settings').insert([{
          college_name: tempTitle,
          tagline: tempTagline,
          about_text: tempDesc
        }]).select().single();
        if (data?.id) setDbSettingsId(data.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddress(tempAddr);
    setPhone(tempPhone);
    setEmail(tempEmail);
    setWebsite(tempWeb);
    setShowContactModal(false);

    try {
      if (dbSettingsId) {
        await supabase.from('college_settings').update({
          address: tempAddr,
          phone: tempPhone,
          email: tempEmail,
          website: tempWeb
        }).eq('id', dbSettingsId);
      } else {
        const { data } = await supabase.from('college_settings').insert([{
          address: tempAddr,
          phone: tempPhone,
          email: tempEmail,
          website: tempWeb
        }]).select().single();
        if (data?.id) setDbSettingsId(data.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    const trimmedName = deptName.trim();
    const trimmedHead = deptHead.trim() || 'Head of Department';
    const trimmedDesc = deptDesc.trim();

    if (editingDeptId) {
      const updated = departments.map((d) =>
        d.id === editingDeptId
          ? { ...d, name: trimmedName, head: trimmedHead, description: trimmedDesc }
          : d
      );
      const sortedUpdated = sortWithCSFirst(updated);
      setDepartments(sortedUpdated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedUpdated));

      try {
        const { error } = await supabase
          .from('college_departments')
          .upsert({
            id: editingDeptId,
            name: trimmedName,
            head: trimmedHead,
            description: trimmedDesc
          });

        if (error) console.error('Supabase update error:', error.message);
      } catch (err) {
        console.error('Update catch error:', err);
      }
      setEditingDeptId(null);
    } else {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'dept-' + Date.now();
      const newDept: Department = {
        id: newId,
        name: trimmedName,
        head: trimmedHead,
        description: trimmedDesc
      };

      const updated = [...departments, newDept];
      const sortedUpdated = sortWithCSFirst(updated);
      setDepartments(sortedUpdated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedUpdated));

      try {
        const { error } = await supabase.from('college_departments').insert([newDept]);
        if (error) console.error('Supabase insert error:', error.message);
      } catch (err) {
        console.error('Insert catch error:', err);
      }
    }

    setShowDeptModal(false);
  };

  const handleDeleteDept = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      const updated = departments.filter((d) => d.id !== id);
      const sortedUpdated = sortWithCSFirst(updated);
      setDepartments(sortedUpdated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedUpdated));

      try {
        const { error } = await supabase.from('college_departments').delete().eq('id', id);
        if (error) console.error('Supabase delete error:', error.message);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <PageContainer>
      <PageHeader icon={School} title="About Institution" subtitle="Our campus heritage, academic departments, and contact details" />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
          {/* Header Overview Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="text-xs text-primary-600 font-semibold flex items-center gap-1 mt-0.5">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>{tagline}</span>
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setTempTitle(title);
                    setTempTagline(tagline);
                    setTempDesc(description);
                    setShowBannerModal(true);
                  }}
                  className="self-start sm:self-auto text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-xl border border-primary-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Edit3 size={13} />
                  <span>Edit Overview</span>
                </button>
              )}
            </div>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed pt-2 border-t border-gray-100 mt-3 whitespace-pre-wrap">
              {description}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center space-y-1">
              <BookOpen size={20} className="mx-auto text-primary-600" />
              <h3 className="text-xl font-black text-slate-900">4+</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courses</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center space-y-1">
              <Building2 size={20} className="mx-auto text-emerald-600" />
              <h3 className="text-xl font-black text-slate-900">{departments.length}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departments</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center space-y-1">
              <Award size={20} className="mx-auto text-amber-500" />
              <h3 className="text-xl font-black text-slate-900">3 Yrs</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UG Programs</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center space-y-1">
              <Users size={20} className="mx-auto text-indigo-600" />
              <h3 className="text-xl font-black text-slate-900">1000+</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students</p>
            </div>
          </div>

          {/* Campus Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-primary-700 uppercase tracking-wide">Campus Details</h3>
              {isAdmin && (
                <button
                  onClick={() => {
                    setTempAddr(address);
                    setTempPhone(phone);
                    setTempEmail(email);
                    setTempWeb(website);
                    setShowContactModal(true);
                  }}
                  className="self-start sm:self-auto text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-xl border border-primary-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Edit3 size={13} />
                  <span>Edit Contact Details</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200/80 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white text-primary-600 shadow-xs shrink-0"><MapPin size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Address</p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{address}</p>
                </div>
              </div>

              <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200/80 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white text-primary-600 shadow-xs shrink-0"><Phone size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{phone}</p>
                </div>
              </div>

              <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200/80 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white text-primary-600 shadow-xs shrink-0"><Mail size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{email}</p>
                </div>
              </div>

              <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200/80 shadow-sm flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white text-primary-600 shadow-xs shrink-0"><Globe size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Website</p>
                  <p className="text-xs font-semibold text-primary-600 mt-0.5 break-all">{website}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Departments */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building2 size={20} className="text-primary-600" />
                <span>Our Departments</span>
              </h3>

              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingDeptId(null);
                    setDeptName('');
                    setDeptHead('');
                    setDeptDesc('');
                    setShowDeptModal(true);
                  }}
                  className="self-start sm:self-auto text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3.5 py-2 rounded-xl border border-primary-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={14} />
                  <span>Add Department</span>
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5">
              {departments.map((dept) => (
                <div key={dept.id} className="bg-gray-50/90 rounded-2xl p-4.5 border border-gray-200/80 shadow-sm relative space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-extrabold text-slate-800 text-sm">{dept.name}</p>
                      <span className="text-[11px] font-bold text-primary-600">Head: {dept.head}</span>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <button
                          onClick={() => {
                            setEditingDeptId(dept.id);
                            setDeptName(dept.name);
                            setDeptHead(dept.head);
                            setDeptDesc(dept.description);
                            setShowDeptModal(true);
                          }}
                          title="Edit Department"
                          className="p-1 text-primary-600 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteDept(dept.id)}
                          title="Delete Department"
                          className="p-1 text-rose-600 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-gray-200/60">
                    {dept.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Edit Banner */}
      {isAdmin && showBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-800">Edit Institution Overview</h3>
              <button onClick={() => setShowBannerModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveBanner} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Institution Name</label>
                <input required value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tagline / Location</label>
                <input value={tempTagline} onChange={(e) => setTempTagline(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Overview Description</label>
                <textarea rows={4} value={tempDesc} onChange={(e) => setTempDesc(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600 leading-relaxed" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5">
                  <Save size={14} />
                  <span>Save Overview</span>
                </button>
                <button type="button" onClick={() => setShowBannerModal(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Contact */}
      {isAdmin && showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-800">Edit Campus Details</h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveContact} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Address</label>
                <input value={tempAddr} onChange={(e) => setTempAddr(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                <input value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                <input value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Website URL</label>
                <input value={tempWeb} onChange={(e) => setTempWeb(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5">
                  <Save size={14} />
                  <span>Save Details</span>
                </button>
                <button type="button" onClick={() => setShowContactModal(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Department */}
      {isAdmin && showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-800">
                {editingDeptId ? 'Modify Department' : 'Add New Department'}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveDept} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Department Name</label>
                <input required value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g. Department of Computer Science & BCA" className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Head of Department (HOD)</label>
                <input value={deptHead} onChange={(e) => setDeptHead(e.target.value)} placeholder="e.g. Dr. Ramani" className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea rows={3} value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} placeholder="Faculty and laboratory facilities..." className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600 leading-relaxed" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5">
                  <Save size={14} />
                  <span>{editingDeptId ? 'Update Department' : 'Save Department'}</span>
                </button>
                <button type="button" onClick={() => setShowDeptModal(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default About;
