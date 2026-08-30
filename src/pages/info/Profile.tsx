import { useState } from 'react';
import { User, Mail, Shield, Calendar, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageContainer, PageHeader } from '@/components/ui';

export function Profile() {
  const { studentSession } = useAuth();
  const [fullName, setFullName] = useState(studentSession?.full_name ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Update locally — mock auth, so just update the display
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <PageContainer>
      <PageHeader icon={User} title="My Profile" subtitle="View and update your account information" />

      <div className="grid md:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center md:col-span-1">
          <div className="h-20 w-20 rounded-full gradient-blue flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-extrabold text-white">
              {(studentSession?.full_name || studentSession?.email || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <h3 className="font-extrabold text-primary-900 text-lg">{studentSession?.full_name || 'Student'}</h3>
          <p className="text-sm text-gray-500 mt-1 break-all">{studentSession?.email}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold">
            <Shield size={12} />
            Student
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Calendar size={12} />
            {studentSession?.loginAt ? `Joined ${new Date(studentSession.loginAt).toLocaleDateString()}` : 'Recently'}
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:col-span-2">
          <h3 className="font-bold text-primary-900 mb-4">Edit Information</h3>
          {saved && (
            <div className="mb-4 p-3.5 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 size={18} className="text-green-600" />
              <p className="text-sm text-green-700 font-medium">Profile updated successfully!</p>
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email (cannot be changed)</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={studentSession?.email ?? ''}
                  disabled
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-200 transition-all"
            >
              <Save size={16} />
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
