export interface AdminSession {
  email: string;
  role: 'admin';
  full_name: string;
  loginAt: number;
}

export interface StudentSession {
  email: string;
  full_name: string;
  role: 'student';
  loginAt: number;
}

const ADMIN_EMAIL = 'admin@college.edu';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_STORAGE_KEY = 'ucs_admin_session';
const STUDENT_STORAGE_KEY = 'ucs_student_session';
const USERS_DB_KEY = 'ucs_users_db';

interface StoredUser {
  email: string;
  full_name: string;
  password: string;
}

// --- Admin auth ---

export function mockAdminLogin(email: string, password: string): AdminSession {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    throw new Error('Invalid admin credentials.');
  }
  const session: AdminSession = {
    email: ADMIN_EMAIL,
    role: 'admin',
    full_name: 'College Administrator',
    loginAt: Date.now(),
  };
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

export const ADMIN_CREDENTIALS = {
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
};

// --- Student auth (localStorage only, no Supabase) ---

function getUsersDB(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function saveUsersDB(users: StoredUser[]): void {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

export function mockStudentRegister(email: string, password: string, fullName: string): StudentSession {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsersDB();
  if (users.some((u) => u.email === normalizedEmail)) {
    throw new Error('An account with this email already exists. Please log in instead.');
  }
  users.push({ email: normalizedEmail, full_name: fullName, password });
  saveUsersDB(users);

  const session: StudentSession = {
    email: normalizedEmail,
    full_name: fullName,
    role: 'student',
    loginAt: Date.now(),
  };
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function mockStudentLogin(email: string, password: string): StudentSession {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsersDB();
  const user = users.find((u) => u.email === normalizedEmail);
  if (!user || user.password !== password) {
    throw new Error('Incorrect email or password. Please try again.');
  }
  const session: StudentSession = {
    email: user.email,
    full_name: user.full_name,
    role: 'student',
    loginAt: Date.now(),
  };
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function getStudentSession(): StudentSession | null {
  try {
    const raw = localStorage.getItem(STUDENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudentSession;
  } catch {
    return null;
  }
}

export function clearStudentSession(): void {
  localStorage.removeItem(STUDENT_STORAGE_KEY);
}
