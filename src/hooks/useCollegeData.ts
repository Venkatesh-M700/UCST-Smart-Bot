import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useCollegeSettings() {
  const [settings, setSettings] = useState<any>(() => {
    try {
      const local = localStorage.getItem('ucs_college_settings');
      return local ? JSON.parse(local) : {
        college_name: 'University College Of Science, Tumkur',
        tagline: 'Tumkur University Campus, BH Road, Tumkur',
        logo_url: '',
        address: 'BH Road, Tumkur - 572103',
        phone: '0816-2203500',
        email: 'ucscience@tumkuruniversity.ac.in',
        website: 'https://tumkuruniversity.ac.in',
        about_text: 'University College of Science, Tumkur is a premier constituent institution dedicated to excellence in science and computing education.'
      };
    } catch {
      return null;
    }
  });

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('college_settings').select('*').limit(1).maybeSingle();
      if (data) {
        setSettings(data);
        localStorage.setItem('ucs_college_settings', JSON.stringify(data));
      }
    } catch {}
  };

  useEffect(() => {
    fetchSettings();
    window.addEventListener('storage', fetchSettings);
    return () => window.removeEventListener('storage', fetchSettings);
  }, []);

  return { settings, refreshSettings: fetchSettings };
}

export function useCourses() {
  const [courses, setCourses] = useState<any[]>(() => {
    try {
      const local = localStorage.getItem('ucs_crud_courses');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('college_courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setCourses(data);
        localStorage.setItem('ucs_crud_courses', JSON.stringify(data));
      }
    } catch {}
  };

  useEffect(() => {
    fetchCourses();
    window.addEventListener('storage', fetchCourses);
    return () => window.removeEventListener('storage', fetchCourses);
  }, []);

  return { courses, refreshCourses: fetchCourses };
}

export function useDepartments() {
  const [departments, setDepartments] = useState<any[]>([
    { id: '1', name: 'Computer Science' },
    { id: '2', name: 'Physics' },
    { id: '3', name: 'Chemistry' },
    { id: '4', name: 'Mathematics' },
    { id: '5', name: 'Electronics' },
    { id: '6', name: 'Biotechnology' }
  ]);

  const fetchDepts = async () => {
    try {
      const { data } = await supabase.from('college_departments').select('*');
      if (data && data.length > 0) {
        setDepartments(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  return { departments, refreshDepartments: fetchDepts };
}
