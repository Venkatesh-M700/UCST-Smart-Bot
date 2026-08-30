/*
# College content tables, chat history, and storage

1. New Tables
- college_settings: single-row college metadata
- announcements: scrolling ticker messages with enable/disable + expiry
- college_information: categorized info pages
- departments: academic departments list
- courses: course catalog with eligibility, fees, duration
- faqs: frequently asked questions
- chatbot_knowledge: knowledge chunks for the RAG chatbot
- chat_history: per-user chat message log

2. Storage
- Bucket 'college-assets' for logo uploads, public read, admin-only write.

3. Security
- Public-content tables readable by anon + authenticated.
- Admin-only writes, scoped via is_admin().
- chat_history: each user reads/inserts/deletes only their own rows; admins can read all.
*/

-- college_settings
CREATE TABLE IF NOT EXISTS public.college_settings (
  id integer PRIMARY KEY DEFAULT 1,
  college_name text NOT NULL DEFAULT 'University College Of Science, Tumkur University Campus',
  address text NOT NULL DEFAULT 'BH Road, Tumkur - 572103',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  logo_url text,
  hero_subtitle text NOT NULL DEFAULT '',
  about_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
ALTER TABLE public.college_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "college_settings_select" ON public.college_settings;
CREATE POLICY "college_settings_select" ON public.college_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "college_settings_admin_insert" ON public.college_settings;
CREATE POLICY "college_settings_admin_insert" ON public.college_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "college_settings_admin_update" ON public.college_settings;
CREATE POLICY "college_settings_admin_update" ON public.college_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "college_settings_admin_delete" ON public.college_settings;
CREATE POLICY "college_settings_admin_delete" ON public.college_settings FOR DELETE
  TO authenticated USING (public.is_admin());

-- announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select_active" ON public.announcements;
CREATE POLICY "announcements_select_active" ON public.announcements FOR SELECT
  TO anon, authenticated USING (is_active AND (expires_at IS NULL OR expires_at > now()));
DROP POLICY IF EXISTS "announcements_admin_insert" ON public.announcements;
CREATE POLICY "announcements_admin_insert" ON public.announcements FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "announcements_admin_update" ON public.announcements;
CREATE POLICY "announcements_admin_update" ON public.announcements FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "announcements_admin_delete" ON public.announcements;
CREATE POLICY "announcements_admin_delete" ON public.announcements FOR DELETE
  TO authenticated USING (public.is_admin());

-- college_information
CREATE TABLE IF NOT EXISTS public.college_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.college_information ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "college_info_select" ON public.college_information;
CREATE POLICY "college_info_select" ON public.college_information FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "college_info_admin_insert" ON public.college_information;
CREATE POLICY "college_info_admin_insert" ON public.college_information FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "college_info_admin_update" ON public.college_information;
CREATE POLICY "college_info_admin_update" ON public.college_information FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "college_info_admin_delete" ON public.college_information;
CREATE POLICY "college_info_admin_delete" ON public.college_information FOR DELETE
  TO authenticated USING (public.is_admin());

-- departments
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  head text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_select" ON public.departments;
CREATE POLICY "departments_select" ON public.departments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "departments_admin_insert" ON public.departments;
CREATE POLICY "departments_admin_insert" ON public.departments FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "departments_admin_update" ON public.departments;
CREATE POLICY "departments_admin_update" ON public.departments FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "departments_admin_delete" ON public.departments;
CREATE POLICY "departments_admin_delete" ON public.departments FOR DELETE
  TO authenticated USING (public.is_admin());

-- courses
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  eligibility text NOT NULL DEFAULT '',
  fees text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select" ON public.courses;
CREATE POLICY "courses_select" ON public.courses FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "courses_admin_insert" ON public.courses;
CREATE POLICY "courses_admin_insert" ON public.courses FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "courses_admin_update" ON public.courses;
CREATE POLICY "courses_admin_update" ON public.courses FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "courses_admin_delete" ON public.courses;
CREATE POLICY "courses_admin_delete" ON public.courses FOR DELETE
  TO authenticated USING (public.is_admin());

-- faqs
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faqs_select" ON public.faqs;
CREATE POLICY "faqs_select" ON public.faqs FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "faqs_admin_insert" ON public.faqs;
CREATE POLICY "faqs_admin_insert" ON public.faqs FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "faqs_admin_update" ON public.faqs;
CREATE POLICY "faqs_admin_update" ON public.faqs FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "faqs_admin_delete" ON public.faqs;
CREATE POLICY "faqs_admin_delete" ON public.faqs FOR DELETE
  TO authenticated USING (public.is_admin());

-- chatbot_knowledge
CREATE TABLE IF NOT EXISTS public.chatbot_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  question_patterns text NOT NULL DEFAULT '',
  keywords text NOT NULL DEFAULT '',
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "knowledge_select" ON public.chatbot_knowledge;
CREATE POLICY "knowledge_select" ON public.chatbot_knowledge FOR SELECT
  TO anon, authenticated USING (is_active);
DROP POLICY IF EXISTS "knowledge_admin_insert" ON public.chatbot_knowledge;
CREATE POLICY "knowledge_admin_insert" ON public.chatbot_knowledge FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "knowledge_admin_update" ON public.chatbot_knowledge;
CREATE POLICY "knowledge_admin_update" ON public.chatbot_knowledge FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "knowledge_admin_delete" ON public.chatbot_knowledge;
CREATE POLICY "knowledge_admin_delete" ON public.chatbot_knowledge FOR DELETE
  TO authenticated USING (public.is_admin());

-- chat_history
CREATE TABLE IF NOT EXISTS public.chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_history_select_own" ON public.chat_history;
CREATE POLICY "chat_history_select_own" ON public.chat_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "chat_history_insert_own" ON public.chat_history;
CREATE POLICY "chat_history_insert_own" ON public.chat_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "chat_history_delete_own" ON public.chat_history;
CREATE POLICY "chat_history_delete_own" ON public.chat_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements (is_active);
CREATE INDEX IF NOT EXISTS idx_college_info_category ON public.college_information (category);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs (category);
CREATE INDEX IF NOT EXISTS idx_chat_history_user ON public.chat_history (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_active ON public.chatbot_knowledge (is_active);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('college-assets', 'college-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "college_assets_public_read" ON storage.objects;
CREATE POLICY "college_assets_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'college-assets');
DROP POLICY IF EXISTS "college_assets_admin_write" ON storage.objects;
CREATE POLICY "college_assets_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'college-assets' AND public.is_admin());
DROP POLICY IF EXISTS "college_assets_admin_update" ON storage.objects;
CREATE POLICY "college_assets_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'college-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'college-assets' AND public.is_admin());
DROP POLICY IF EXISTS "college_assets_admin_delete" ON storage.objects;
CREATE POLICY "college_assets_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'college-assets' AND public.is_admin());
