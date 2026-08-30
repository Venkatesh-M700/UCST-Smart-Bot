import { GraduationCap } from 'lucide-react';

interface LogoProps {
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ logoUrl, size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-9 w-9',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const iconSizes = {
    sm: 18,
    md: 26,
    lg: 36,
  };

  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <img
        src={logoUrl}
        alt="College Logo"
        className={`${sizeClasses[size]} object-contain rounded-xl drop-shadow-sm ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-teal-900 flex items-center justify-center shadow-md ${className}`}
    >
      <GraduationCap size={iconSizes[size]} />
    </div>
  );
}

export default Logo;
