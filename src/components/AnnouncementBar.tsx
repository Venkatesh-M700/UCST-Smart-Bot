import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ANNOUNCEMENT_STORAGE_KEY = 'ucs_announcements_data';

const DEFAULT_ANNOUNCEMENTS = [
  '📢 Semester examination results announced. Check your department notice board.',
  '🎓 Admissions Open for BCA & B.Sc courses for academic year 2026-27.',
  '🏆 NSS Special Annual Camp registrations are now open for all students.'
];

export function AnnouncementBar() {
  // ತಕ್ಷಣವೇ ಡಿಫಾಲ್ಟ್ ಅಥವಾ ಲೋಕಲ್ ಡೇಟಾದಿಂದ ಸ್ಕ್ರೋಲಿಂಗ್ ಶುರುವಾಗುತ್ತದೆ (Zero Delay)
  const [announcements, setAnnouncements] = useState<string[]>(() => {
    try {
      const local = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_ANNOUNCEMENTS;
    } catch {
      return DEFAULT_ANNOUNCEMENTS;
    }
  });

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('college_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const textList = data.map((d: any) => d.text);
        setAnnouncements(textList);
        localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(textList));
      }
    } catch {}
  };

  useEffect(() => {
    fetchAnnouncements();
    window.addEventListener('storage', fetchAnnouncements);
    return () => window.removeEventListener('storage', fetchAnnouncements);
  }, []);

  const marqueeText = announcements.join(' \u00A0\u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0\u00A0 ');

  return (
    <div className="bg-amber-400 text-amber-950 font-bold py-2.5 px-3 shadow-sm border-y border-amber-500/30 flex items-center overflow-hidden">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-amber-950 rounded-lg text-xs shrink-0 z-10 shadow-xs">
        <Megaphone size={14} className="animate-bounce" />
        <span className="uppercase tracking-wider font-extrabold text-[11px]">Notice:</span>
      </div>

      <div className="flex-1 overflow-hidden whitespace-nowrap ml-2">
        <marquee
          behavior="scroll"
          direction="left"
          scrollamount="6"
          className="text-xs md:text-sm font-semibold tracking-wide flex items-center cursor-default pt-0.5"
        >
          {marqueeText}
        </marquee>
      </div>
    </div>
  );
}

export default AnnouncementBar;
