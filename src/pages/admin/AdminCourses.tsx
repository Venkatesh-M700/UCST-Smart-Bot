import { BookOpen } from 'lucide-react';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { CrudManager, FormField, CardActions, type FieldDef } from '@/pages/admin/CrudManager';
import type { Course } from '@/types/database';
import type { Route } from '@/types/route';

interface Props {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  onSignOut: () => void;
}

const fields: FieldDef[] = [
  { name: 'name', label: 'Course Name', type: 'text', required: true, placeholder: 'e.g. Bachelor of Computer Applications' },
  { name: 'code', label: 'Course Code', type: 'text', placeholder: 'e.g. BCA' },
  { name: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 3 Years (6 Semesters)' },
  { name: 'eligibility', label: 'Eligibility', type: 'textarea', required: true, placeholder: 'PUC/10+2 pass with...' },
  { name: 'fees', label: 'Fees', type: 'text', placeholder: 'e.g. Rs. 25,000 per year' },
  { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Course description...' },
  { name: 'sort_order', label: 'Sort Order', type: 'number' },
];

export function AdminCourses({ currentRoute, onNavigate, onSignOut }: Props) {
  return (
    <AdminLayout currentRoute={currentRoute} onNavigate={onNavigate} onSignOut={onSignOut} title="Manage Courses" subtitle="Add, edit, or delete course information including eligibility and fees">
      <CrudManager<Course>
        table="courses"
        fields={fields}
        title="Courses"
        emptyIcon={BookOpen}
        emptyTitle="No courses yet"
        orderBy={{ column: 'sort_order', ascending: true }}
        defaultItem={{ sort_order: 0 }}
        renderCard={(item, onEdit, onDelete) => (
          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 flex items-start gap-3 transition-all hover:border-slate-600 hover:shadow-xl hover:shadow-blue-600/10">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-white">{item.name}</p>
                {item.code && <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-bold">{item.code}</span>}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{item.duration}</p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.eligibility}</p>
            </div>
            <CardActions onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
        renderForm={(item, _fields, onChange) => (
          <div className="space-y-4">
            {fields.map((f) => (
              <FormField
                key={f.name}
                field={f}
                value={item?.[f.name as keyof Course] as string | boolean | number | undefined}
                onChange={(val) => onChange(f.name, val)}
              />
            ))}
          </div>
        )}
      />
    </AdminLayout>
  );
}
