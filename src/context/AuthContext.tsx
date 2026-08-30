import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  loading: boolean;
  isAuthed: boolean;
  isAdmin: boolean;
  loginStudent: (identifier: string, pass: string) => void;
  loginAdmin: (email: string, pass: string) => void;
  registerStudent: (name: string, phone: string, email: string, pass: string) => void;
  logout: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(() => {
    try {
      const local = localStorage.getItem('ucs_auth_user');
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(false);

  const isAuthed = !!user;
  const isAdmin = user?.role === 'admin';

  // Synchronous State Update for Instant Screen Transition
  const loginStudent = (identifier: string, _pass: string) => {
    const authUser = {
      name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      email: identifier.includes('@') ? identifier : `${identifier}@student.ucs.edu`,
      phone: !identifier.includes('@') ? identifier : '',
      role: 'student'
    };
    localStorage.setItem('ucs_auth_user', JSON.stringify(authUser));
    setUser(authUser);
  };

  const loginAdmin = (email: string, _pass: string) => {
    const authUser = { name: 'Administrator', email, role: 'admin' };
    localStorage.setItem('ucs_auth_user', JSON.stringify(authUser));
    localStorage.setItem('ucs_admin_session', 'true');
    setUser(authUser);
  };

  const registerStudent = (name: string, phone: string, email: string, pass: string) => {
    const studentData = {
      name: name.trim(),
      full_name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password: pass.trim(),
      role: 'student',
      created_at: new Date().toISOString()
    };
    try {
      const local = localStorage.getItem('ucs_registered_students');
      const list = local ? JSON.parse(local) : [];
      localStorage.setItem('ucs_registered_students', JSON.stringify([studentData, ...list]));
    } catch {}
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('ucs_auth_user');
    localStorage.removeItem('ucs_admin_session');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthed, 
      isAdmin, 
      loginStudent, 
      loginAdmin, 
      registerStudent, 
      logout: () => signOut(), 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
