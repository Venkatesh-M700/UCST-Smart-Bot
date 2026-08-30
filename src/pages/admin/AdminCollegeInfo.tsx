import { Building2 } from 'lucide-react';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { CrudManager, FormField, CardActions, type FieldDef } from '@/pages/admin/CrudManager';
import type { CollegeInformation } from '@/types/database';
import type { Route } from '@/types/route';

interface Props {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  onSignOut: () => void;
}

const CATEGORIES = ['about', 'admission', 'eligibility', 'fees', 'facilities', 'important_dates', 'departments', 'other'];

const fields: FieldDef[] = [
  { name: 'category', label: 'Category', type: 'text', required: true, options: CATEGORIES },
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. BCA Admission Process' },
  { name: 'content', label: 'Content', type: 'textarea', required: true, placeholder: 'Detailed information...' },
  { name: 'sort_order', label: 'Sort Order', type: 'number' },
];

export function AdminCollegeInfo({ currentRoute, onNavigate, onSignOut }: Props) {
  return (
    <AdminLayout currentRoute={currentRoute} onNavigate={onNavigate} onSignOut={onSignOut} title="College Information" subtitle="Manage about, admission, eligibility, fees, facilities, and important dates content">
      <CrudManager<CollegeInformation>
        table="college_information"
        fields={fields}
        title="Information"
        emptyIcon={Building2}
        emptyTitle="No information entries yet"
        orderBy={{ column: 'sort_order', ascending: true }}
        defaultItem={{ sort_order: 0, category: 'about' }}
        renderCard={(item, onEdit, onDelete) => (
          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 flex items-start gap-3 transition-all hover:border-slate-600 hover:shadow-xl hover:shadow-blue-600/10">
            <div className="h-9 w-9 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-xs font-bold capitalize">{item.category}</span>
              </div>
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.content}</p>
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
                value={item?.[f.name as keyof CollegeInformation] as string | boolean | number | undefined}
                onChange={(val) => onChange(f.name, val)}
              />
            ))}
          </div>
        )}
      />
    </AdminLayout>
  );
}
