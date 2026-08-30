import { useEffect, useState } from 'react';
import { BookOpen, Plus, Edit3, Trash2, Save, X, Clock, Award, Users } from 'lucide-react';
import { PageContainer, PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const DEFAULT_COURSES = [
  {
    id: 'course-1',
    name: 'Bachelor of Computer Applications (BCA)',
    code: 'BCA',
    duration: '3 Years (6 Semesters)',
    eligibility: '10+2 / PUC Pass with Mathematics, Statistics, or Computer Science',
    fees: 'Rs. 25,000 / Year',
    seats: '60 Seats',
    description: 'Comprehensive curriculum in programming languages, databases, web technologies, and software engineering.',
  },
  {
    id: 'course-2',
    name: 'Bachelor of Science (B.Sc)',
    code: 'B.Sc (PMCs / CBZ)',
    duration: '3 Years (6 Semesters)',
    eligibility: '10+2 / PUC Science Stream',
    fees: 'Rs. 18,000 / Year',
    seats: '120 Seats',
    description: 'Core physical and biological science disciplines with state-of-the-art laboratory practicals.',
  },
];

export function Courses() {
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

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseDuration, setCourseDuration] = useState('3 Years (6 Semesters)');
  const [courseEligibility, setCourseEligibility] = useState('');
  const [courseFees, setCourseFees] = useState('');
  const [courseSeats, setCourseSeats] = useState('60 Seats');
  const [courseDescription, setCourseDescription] = useState('');

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('college_courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
      } else if (data && data.length > 0) {
        setCourses(data);
      } else {
        setCourses(DEFAULT_COURSES);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setCourses(DEFAULT_COURSES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    if (editingCourseId) {
      const updatePayload = {
        name: courseName.trim(),
        code: courseCode.trim(),
        duration: courseDuration.trim(),
        eligibility: courseEligibility.trim(),
        fees: courseFees.trim(),
        seats: courseSeats.trim(),
        description: courseDescription.trim(),
      };

      const { error } = await supabase
        .from('college_courses')
        .update(updatePayload)
        .eq('id', editingCourseId);

      if (error) {
        alert('Supabase Update Error: ' + error.message);
        return;
      }

      setEditingCourseId(null);
    } else {
      const newCourseItem = {
        id: 'crs-' + Date.now(),
        name: courseName.trim(),
        code: courseCode.trim() || 'UG',
        duration: courseDuration.trim() || '3 Years (6 Semesters)',
        eligibility: courseEligibility.trim() || '10+2 / PUC',
        fees: courseFees.trim() || 'As per Govt Norms',
        seats: courseSeats.trim() || '60 Seats',
        description: courseDescription.trim(),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('college_courses')
        .insert([newCourseItem]);

      if (error) {
        alert('Supabase Insert Error: ' + error.message);
        return;
      }
    }

    setCourseName('');
    setCourseCode('');
    setCourseDuration('3 Years (6 Semesters)');
    setCourseEligibility('');
    setCourseFees('');
    setCourseSeats('60 Seats');
    setCourseDescription('');
    setShowCourseModal(false);

    // Refresh immediately from Supabase Cloud
    await fetchCourses();
  };

  const handleDeleteCourse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this course?')) {
      const { error } = await supabase
        .from('college_courses')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Supabase Delete Error: ' + error.message);
      } else {
        await fetchCourses();
      }
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <PageHeader 
          icon={BookOpen} 
          title="Offered Courses & Combinations" 
          subtitle="Explore undergraduate and postgraduate degree programs" 
        />
        {isAdmin && (
          <button
            onClick={() => {
              setEditingCourseId(null);
              setCourseName('');
              setCourseCode('');
              setCourseDuration('3 Years (6 Semesters)');
              setCourseEligibility('');
              setCourseFees('');
              setCourseSeats('60 Seats');
              setCourseDescription('');
              setShowCourseModal(true);
            }}
            className="self-start sm:self-auto text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3.5 py-2 rounded-xl border border-primary-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            <span>Add Course</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : courses.length === 0 ? (
        <EmptyState 
          icon={BookOpen} 
          title="No courses available" 
          subtitle="Please check back later or ask the AI chatbot." 
        />
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div 
              key={course.id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative hover:border-gray-200 transition-all"
            >
              {/* Admin Action Buttons */}
              {isAdmin && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-white p-1 rounded-md border border-gray-200 shadow-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCourseId(course.id);
                      setCourseName(course.name);
                      setCourseCode(course.code || '');
                      setCourseDuration(course.duration || '3 Years (6 Semesters)');
                      setCourseEligibility(course.eligibility || '');
                      setCourseFees(course.fees || '');
                      setCourseSeats(course.seats || '60 Seats');
                      setCourseDescription(course.description || '');
                      setShowCourseModal(true);
                    }}
                    title="Edit Course"
                    className="p-1 text-primary-600 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCourse(course.id, e)}
                    title="Delete Course"
                    className="p-1 text-rose-600 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}

              <h3 className="text-base font-bold text-gray-900 pr-16">{course.name}</h3>
              {course.code && <p className="text-xs font-semibold text-primary-600 mt-0.5">{course.code}</p>}
              {course.description && (
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{course.description}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-primary-600" />
                  <span>{course.eligibility}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-amber-500" />
                  <span>{course.seats}</span>
                </div>
              </div>

              {course.fees && (
                <div className="mt-2 text-xs font-semibold text-emerald-600">
                  <span>Fees: {course.fees}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Add/Edit Course Modal */}
      {isAdmin && showCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-800">
                {editingCourseId ? 'Modify Course' : 'Add New Course'}
              </h3>
              <button
                onClick={() => setShowCourseModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Bachelor of Computer Applications (BCA)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Code / Short Name</label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. BCA"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Duration</label>
                  <input
                    type="text"
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(e.target.value)}
                    placeholder="3 Years (6 Sem)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Total Seats</label>
                  <input
                    type="text"
                    value={courseSeats}
                    onChange={(e) => setCourseSeats(e.target.value)}
                    placeholder="60 Seats"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tuition Fees</label>
                  <input
                    type="text"
                    value={courseFees}
                    onChange={(e) => setCourseFees(e.target.value)}
                    placeholder="e.g. Rs. 25,000 / Year"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Eligibility Criteria</label>
                <input
                  type="text"
                  required
                  value={courseEligibility}
                  onChange={(e) => setCourseEligibility(e.target.value)}
                  placeholder="e.g. 10+2 / PUC Pass with Mathematics"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Course Description</label>
                <textarea
                  rows={3}
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Provide course overview and career prospects..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-primary-600 leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{editingCourseId ? 'Update Course' : 'Save Course'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
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

export default Courses;
