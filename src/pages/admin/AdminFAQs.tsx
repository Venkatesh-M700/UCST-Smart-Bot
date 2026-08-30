import { HelpCircle } from 'lucide-react';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { CrudManager, FormField, CardActions, type FieldDef } from '@/pages/admin/CrudManager';
import type { FAQ } from '@/types/database';
import type { Route } from '@/types/route';

interface Props {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  onSignOut: () => void;
}

const FAQ_CATEGORIES = ['General', 'Admission', 'Courses', 'Fees', 'Facilities', 'Placements', 'Other'];

const fields: FieldDef[] = [
  { name: 'question', label: 'Question', type: 'text', required: true, placeholder: 'e.g. How do I apply for BCA?' },
  { name: 'answer', label: 'Answer', type: 'textarea', required: true, placeholder: 'Detailed answer...' },
  { name: 'category', label: 'Category', type: 'text', required: true, options: FAQ_CATEGORIES },
  { name: 'sort_order', label: 'Sort Order', type: 'number' },
];

export function AdminFAQs({ currentRoute, onNavigate, onSignOut }: Props) {
  return (
    <AdminLayout currentRoute={currentRoute} onNavigate={onNavigate} onSignOut={onSignOut} title="Manage FAQs" subtitle="Add, edit, or delete frequently asked questions">
      <CrudManager<FAQ>
        table="faqs"
        fields={fields}
        title="FAQs"
        emptyIcon={HelpCircle}
        emptyTitle="No FAQs yet"
        orderBy={{ column: 'sort_order', ascending: true }}
        defaultItem={{ sort_order: 0, category: 'General' }}
        renderCard={(item, onEdit, onDelete) => (
          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 flex items-start gap-3 transition-all hover:border-slate-600 hover:shadow-xl hover:shadow-blue-600/10">
            <div className="h-9 w-9 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
              <HelpCircle size={18} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 text-xs font-bold mb-1">{item.category}</span>
              <p className="text-sm font-bold text-white">{item.question}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.answer}</p>
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
                value={item?.[f.name as keyof FAQ] as string | boolean | number | undefined}
                onChange={(val) => onChange(f.name, val)}
              />
            ))}
          </div>
        )}
      />
    </AdminLayout>
  );
}
