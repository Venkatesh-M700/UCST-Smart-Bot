export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface CollegeSettings {
  id: number;
  college_name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string | null;
  hero_subtitle: string;
  about_text: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  message: string;
  is_active: boolean;
  expires_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface CollegeInformation {
  id: string;
  category: string;
  title: string;
  content: string;
  sort_order: number;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  duration: string;
  eligibility: string;
  fees: string;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  created_at: string;
}

export interface ChatbotKnowledge {
  id: string;
  topic: string;
  question_patterns: string;
  keywords: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
