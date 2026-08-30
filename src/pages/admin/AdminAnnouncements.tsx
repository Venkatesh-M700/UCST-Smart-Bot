import { Megaphone, Calendar, Power } from 'lucide-react';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { CrudManager, FormField, CardActions, type FieldDef } from '@/pages/admin/CrudManager';
import type { Announcement } from '@/types/database';
import type { Route } from '@/types/route';

interface Props {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  onSignOut: () => void;
}

const fields: FieldDef[] = [
  { name: 'message', label: 'Announcement Message', type: 'text', required: true, placeholder: 'e.g. Admissions Open for BCA 2026-27!' },
  { name: 'is_active', label: 'Active', type: 'boolean' },
  { name: 'expires_at', label: 'Expiry Date (optional)', type: 'date' },
  { name: 'sort_order', label: 'Sort Order', type: 'number' },
];

export function AdminAnnouncements({ currentRoute, onNavigate, onSignOut }: Props) {
  return (
    <AdminLayout currentRoute={currentRoute} onNavigate={onNavigate} onSignOut={onSignOut} title="Manage Announcements" subtitle="Add, edit, enable/disable, or delete scrolling ticker messages">
      <CrudManager<Announcement>
        table="announcements"
        fields={fields}
        title="Announcements"
        emptyIcon={Megaphone}
        emptyTitle="No announcements yet"
        orderBy={{ column: 'sort_order', ascending: true }}
        defaultItem={{ is_active: true, sort_order: 0 }}
        renderCard={(item, onEdit, onDelete) => (
          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 flex items-start gap-3 transition-all hover:border-slate-600 hover:shadow-xl hover:shadow-blue-600/10">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Megaphone size={18} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 font-medium">{item.message}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${item.is_active ? 'bg-green-500/15 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                  <Power size={10} />
                  {item.is_active ? 'Active' : 'Disabled'}
                </span>
                {item.expires_at && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Calendar size={10} />
                    Expires: {new Date(item.expires_at).toLocaleDateString()}
                  </span>
                )}
              </div>
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
                value={item?.[f.name as keyof Announcement] as string | boolean | number | undefined}
                onChange={(val) => onChange(f.name, val)}
              />
            ))}
          </div>
        )}
      />
    </AdminLayout>
  );
}
