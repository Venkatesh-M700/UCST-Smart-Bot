import { useState, useEffect, type ReactNode } from 'react';
import { Plus, Pencil, Trash2, X, Save, AlertCircle } from 'lucide-react';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface CrudManagerProps<T extends { id: string }> {
  table: string;
  fields: FieldDef[];
  title: string;
  subtitle?: string;
  emptyIcon: typeof AlertCircle;
  emptyTitle: string;
  orderBy?: { column: string; ascending?: boolean };
  renderCard: (item: T, onEdit: () => void, onDelete: () => void) => ReactNode;
  renderForm: (item: Partial<T> | null, fields: FieldDef[], onChange: (name: string, value: string | boolean | number) => void) => ReactNode;
  defaultItem?: Partial<T>;
}

// ಆರಂಭಿಕ ಡೀಫಾಲ್ಟ್ ಡೇಟಾ (Initial Mock Data)
const INITIAL_DATA: Record<string, any[]> = {
  announcements: [
    {
      id: 'ann-1',
      message: 'Admissions Open for BCA & B.Sc courses for 2026-27!',
      is_active: true,
      sort_order: 1,
      expires_at: '2026-12-31',
    },
    {
      id: 'ann-2',
      message: 'Semester examination results announced. Check your department notice board.',
      is_active: true,
      sort_order: 2,
    },
  ],
  college_information: [
    {
      id: 'info-1',
      title: 'About University College of Science',
      content: 'University College of Science, Tumkur is a premier constituent college under Tumkur University.',
      category: 'About',
      sort_order: 1,
    },
    {
      id: 'info-2',
      title: 'Admission Guidelines',
      content: 'Candidates seeking admission to BCA/B.Sc must submit 10+2 marks cards along with TC and application form.',
      category: 'Admission',
      sort_order: 2,
    },
  ],
  courses: [
    {
      id: 'c-1',
      title: 'Bachelor of Computer Applications (BCA)',
      code: 'BCA',
      duration: '3 Years (6 Semesters)',
      eligibility: '10+2 / PUC Pass with Mathematics or CS',
      fees: 'Rs. 25,000 / Year',
      description: 'Comprehensive software development and web technologies program.',
      sort_order: 1,
    },
    {
      id: 'c-2',
      title: 'Bachelor of Science (B.Sc)',
      code: 'B.Sc (PMCs / CBZ)',
      duration: '3 Years (6 Semesters)',
      eligibility: '10+2 / PUC Science Stream',
      fees: 'Rs. 18,000 / Year',
      description: 'Undergraduate science program in Physics, Math, CS, Chemistry, and Biology.',
      sort_order: 2,
    },
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'How to apply for BCA admission?',
      answer: 'Collect the application form from the college office or online, and submit with documents.',
      category: 'Admission',
      sort_order: 1,
      is_active: true,
    },
    {
      id: 'faq-2',
      question: 'What are the college library timings?',
      answer: 'The central library is open from 9:30 AM to 5:30 PM on all working days.',
      category: 'Facilities',
      sort_order: 2,
      is_active: true,
    },
  ],
  chatbot_knowledge: [
    {
      id: 'k-1',
      topic: 'Hostel Facilities',
      keywords: 'hostel, room, stay, lodging, mess',
      content: 'Separate hostel facilities are provided for boys and girls near Tumkur University campus.',
      category: 'Facilities',
      is_active: true,
    },
    {
      id: 'k-2',
      topic: 'Placement Training',
      keywords: 'placement, job, company, interview',
      content: 'Active placement training cell conducting drives with top IT recruiters.',
      category: 'Career',
      is_active: true,
    },
  ],
  chat_history: [
    {
      id: 'ch-1',
      user_message: 'What is the BCA fees?',
      bot_response: 'Annual tuition fee for BCA is approx Rs. 25,000/year.',
      created_at: new Date().toISOString(),
    },
  ],
};

export function CrudManager<T extends { id: string }>({
  table,
  title,
  subtitle,
  emptyIcon,
  emptyTitle,
  renderCard,
  renderForm,
  defaultItem,
}: CrudManagerProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const storageKey = `ucs_crud_${table}`;

  // LocalStorage ನಿಂದ ಡೇಟಾ ತರುವುದು (No Network/Supabase Errors)
  const fetchItems = () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setItems(JSON.parse(raw));
      } else {
        const initial = INITIAL_DATA[table] || [];
        localStorage.setItem(storageKey, JSON.stringify(initial));
        setItems(initial as T[]);
      }
      setError('');
    } catch (err: any) {
      setError('Failed to load local data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [table]);

  // ಹೊಸ ಐಟಂ ಸೇವ್ ಮಾಡುವುದು ಅಥವಾ ಎಡಿಟ್ ಮಾಡುವುದು
  const handleSave = () => {
    if (!editing) return;
    setSaving(true);
    setFormError('');

    try {
      let updated: T[];
      if (editing.id) {
        updated = items.map((i) => (i.id === editing.id ? ({ ...i, ...editing } as T) : i));
      } else {
        const newItem = {
          ...defaultItem,
          ...editing,
          id: `${table.slice(0, 3)}-${Date.now()}`,
          created_at: new Date().toISOString(),
        } as T;
        updated = [newItem, ...items];
      }

      localStorage.setItem(storageKey, JSON.stringify(updated));
      setItems(updated);
      setEditing(null);
    } catch (err: any) {
      setFormError('Failed to save data.');
    } finally {
      setSaving(false);
    }
  };

  // ಐಟಂ ಡಿಲೀಟ್ ಮಾಡುವುದು
  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    const updated = items.filter((i) => i.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setItems(updated);
  };

  const handleChange = (name: string, value: string | boolean | number) => {
    setEditing((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
        <button
          onClick={() => setEditing(defaultItem ?? {})}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add New</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 flex items-start gap-2.5">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading...</p>
        </div>
      ) : items.length === 0 && !editing ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-4">
            {(() => { const Icon = emptyIcon; return <Icon size={28} className="text-slate-500" />; })()}
          </div>
          <h3 className="text-base font-bold text-slate-300">{emptyTitle}</h3>
          <p className="text-sm text-slate-500 mt-1">Click 'Add New' to create one.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => renderCard(item, () => setEditing(item), () => handleDelete(item.id)))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setEditing(null)}>
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50 sticky top-0 bg-slate-900 rounded-t-2xl">
              <h3 className="font-bold text-white">
                {editing.id ? 'Edit' : 'Add New'} {title.replace(/s$/, '')}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5">
              {formError && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300 font-medium">{formError}</p>
                </div>
              )}
              {renderForm(editing, [], handleChange)}
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-700/50 sticky bottom-0 bg-slate-900 rounded-b-2xl">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60"
              >
                {saving ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FormField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string | boolean | number | undefined;
  onChange: (value: string | boolean | number) => void;
}) {
  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all text-sm';

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      ) : field.type === 'boolean' ? (
        <label className="flex items-center gap-2.5 cursor-pointer">
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-sm text-slate-300">{value ? 'Enabled' : 'Disabled'}</span>
        </label>
      ) : field.type === 'number' ? (
        <input
          type="number"
          value={(value as number) ?? ''}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          className={inputClass}
        />
      ) : field.type === 'date' ? (
        <input
          type="datetime-local"
          value={value ? new Date(value as string).toISOString().slice(0, 16) : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
          className={`${inputClass} [color-scheme:dark]`}
        />
      ) : field.options ? (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} [color-scheme:dark]`}
        >
          <option value="">Select {field.label}</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

export function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={onEdit}
        className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
        title="Edit"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
        title="Delete"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
