import { Brain, Sparkles } from 'lucide-react';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { CrudManager, FormField, CardActions, type FieldDef } from '@/pages/admin/CrudManager';
import type { ChatbotKnowledge } from '@/types/database';
import type { Route } from '@/types/route';

interface Props {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  onSignOut: () => void;
}

const fields: FieldDef[] = [
  { name: 'topic', label: 'Topic', type: 'text', required: true, placeholder: 'e.g. BCA Eligibility' },
  { name: 'question_patterns', label: 'Question Patterns (comma-separated)', type: 'textarea', required: true, placeholder: 'bca eligibility, can i join bca, bca ge eligibility, bca eligibility ಏನು' },
  { name: 'keywords', label: 'Keywords (space or comma-separated)', type: 'textarea', required: true, placeholder: 'bca eligibility puc 12th pass science mathematics' },
  { name: 'content', label: 'Knowledge Content (the answer)', type: 'textarea', required: true, placeholder: 'Full answer that the AI will give when this knowledge is matched...' },
  { name: 'is_active', label: 'Active', type: 'boolean' },
];

export function AdminKnowledge({ currentRoute, onNavigate, onSignOut }: Props) {
  return (
    <AdminLayout currentRoute={currentRoute} onNavigate={onNavigate} onSignOut={onSignOut} title="AI Chatbot Knowledge" subtitle="Manage the knowledge base the AI uses to answer student questions. Add detailed, accurate info for each topic.">
      <div className="mb-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">How the AI Knowledge Base Works</p>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              When a student asks a question, the AI searches all active knowledge entries by matching their question against the topic, question patterns, and keywords. The best-matching entries are combined into a natural answer. Include varied question patterns (English + Kannada) and relevant keywords for best results. The AI will only answer from this knowledge — it will never invent information.
            </p>
          </div>
        </div>
      </div>

      <CrudManager<ChatbotKnowledge>
        table="chatbot_knowledge"
        fields={fields}
        title="Knowledge Entries"
        emptyIcon={Brain}
        emptyTitle="No knowledge entries yet"
        defaultItem={{ is_active: true }}
        renderCard={(item, onEdit, onDelete) => (
          <div className="bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
                <Brain size={18} className="text-pink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-white">{item.topic}</p>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${item.is_active ? 'bg-green-500/15 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.content}</p>
                {item.question_patterns && (
                  <p className="text-[10px] text-slate-500 mt-1.5 truncate">Patterns: {item.question_patterns.slice(0, 100)}{item.question_patterns.length > 100 ? '...' : ''}</p>
                )}
              </div>
              <CardActions onEdit={onEdit} onDelete={onDelete} />
            </div>
          </div>
        )}
        renderForm={(item, _fields, onChange) => (
          <div className="space-y-4">
            {fields.map((f) => (
              <FormField
                key={f.name}
                field={f}
                value={item?.[f.name as keyof ChatbotKnowledge] as string | boolean | number | undefined}
                onChange={(val) => onChange(f.name, val)}
              />
            ))}
          </div>
        )}
      />
    </AdminLayout>
  );
}
