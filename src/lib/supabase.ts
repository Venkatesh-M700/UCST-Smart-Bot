import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buwfnteczrzsokgztfpa.supabase.co';
const supabaseAnonKey = 'sb_publishable_DQdJDua0XzIcZ4cVG2psjQ_tfRxQWLk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const STORAGE_BUCKET = 'college-assets';
