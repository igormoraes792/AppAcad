import type { UserProfile, UserRole } from '../types';
import { getSupabaseClient, supabaseFetchProfile, supabaseSaveProfile, supabaseFetchStudents } from './supabase';

const CURRENT_USER_KEY = 'fittrack_current_user';
const USERS_LIST_KEY = 'fittrack_users_list';

// Contas de teste padrão pré-configuradas para demonstração imediata
export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'prof-igor',
    name: 'Igor Personal',
    email: 'igor@personal.com',
    role: 'professor',
    phone: '(11) 98888-7777',
    createdAt: '2026-09-01',
  },
  {
    id: 'aluno-lucas',
    name: 'Lucas Silva',
    email: 'lucas@aluno.com',
    role: 'aluno',
    instructorId: 'prof-igor',
    instructorName: 'Igor Personal',
    phone: '(11) 97777-6666',
    createdAt: '2026-09-10',
  },
  {
    id: 'aluna-mariana',
    name: 'Mariana Souza',
    email: 'mariana@aluno.com',
    role: 'aluno',
    instructorId: 'prof-igor',
    instructorName: 'Igor Personal',
    phone: '(11) 96666-5555',
    createdAt: '2026-09-20',
  },
];

export function getStoredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_LIST_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(USERS_LIST_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

export function saveStoredUsers(users: UserProfile[]) {
  localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function setCurrentUser(user: UserProfile | null) {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

/**
 * Realiza login. Se o Supabase estiver configurado com credenciais válidas, tenta autenticar nele.
 * Senão, utiliza o armazenamento local/demo.
 */
export async function loginUser(email: string, _password?: string): Promise<{ user: UserProfile | null; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabaseClient();

  // 1. Tentar login via Supabase se configurado
  if (supabase && _password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: _password,
      });

      if (!error && data.user) {
        let profile = await supabaseFetchProfile(data.user.id);
        if (!profile) {
          // Fallback caso não haja profile criado ainda no Supabase
          profile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: data.user.user_metadata?.name || 'Usuário',
            role: (data.user.user_metadata?.role as UserRole) || 'aluno',
            instructorId: data.user.user_metadata?.instructor_id,
            instructorName: data.user.user_metadata?.instructor_name,
            createdAt: new Date().toISOString(),
          };
          await supabaseSaveProfile(profile);
        }
        setCurrentUser(profile);
        return { user: profile };
      }
    } catch (e: any) {
      console.warn('Erro ao autenticar com Supabase, tentando local:', e?.message);
    }
  }

  // 2. Fallback de Usuários Locais / Demonstração
  const users = getStoredUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (found) {
    setCurrentUser(found);
    return { user: found };
  }

  return { user: null, error: 'Usuário não encontrado. Crie uma conta ou use o acesso de teste.' };
}

/**
 * Cadastro de novo usuário (Aluno ou Professor)
 */
export async function registerUser(
  name: string,
  email: string,
  password?: string,
  role: UserRole = 'aluno',
  instructorId?: string,
  instructorName?: string
): Promise<{ user: UserProfile | null; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabaseClient();

  // 1. Tenta cadastrar no Supabase se configurado
  if (supabase && password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: name.trim(),
            role: role,
            instructor_id: instructorId || null,
            instructor_name: instructorName || null,
          },
        },
      });

      if (!error && data.user) {
        const newProfile: UserProfile = {
          id: data.user.id,
          email: cleanEmail,
          name: name.trim(),
          role: role,
          instructorId: instructorId,
          instructorName: instructorName,
          createdAt: new Date().toISOString(),
        };
        await supabaseSaveProfile(newProfile);
        setCurrentUser(newProfile);

        // Atualiza lista local também
        const users = getStoredUsers();
        saveStoredUsers([...users, newProfile]);

        return { user: newProfile };
      }
    } catch (e: any) {
      console.warn('Erro no signUp do Supabase, salvando local:', e?.message);
    }
  }

  // 2. Cadastro Local
  const users = getStoredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { user: null, error: 'Este e-mail já está cadastrado.' };
  }

  const newProfile: UserProfile = {
    id: `user-${Date.now()}`,
    email: cleanEmail,
    name: name.trim(),
    role: role,
    instructorId: instructorId,
    instructorName: instructorName,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newProfile];
  saveStoredUsers(updatedUsers);
  setCurrentUser(newProfile);

  return { user: newProfile };
}

/**
 * Busca a lista de alunos de um determinado professor
 */
export async function getStudentsForInstructor(instructorId: string): Promise<UserProfile[]> {
  // Tenta buscar no Supabase
  const cloudStudents = await supabaseFetchStudents(instructorId);
  if (cloudStudents.length > 0) {
    return cloudStudents;
  }

  // Fallback local
  const users = getStoredUsers();
  return users.filter((u) => u.role === 'aluno' && (!u.instructorId || u.instructorId === instructorId));
}

/**
 * Professor cadastra um aluno diretamente pelo painel
 */
export async function createStudentByInstructor(
  instructor: UserProfile,
  studentName: string,
  studentEmail: string,
  phone?: string
): Promise<UserProfile> {
  const newStudent: UserProfile = {
    id: `aluno-${Date.now()}`,
    name: studentName.trim(),
    email: studentEmail.trim().toLowerCase(),
    role: 'aluno',
    instructorId: instructor.id,
    instructorName: instructor.name,
    phone: phone?.trim(),
    createdAt: new Date().toISOString(),
  };

  // Salva no Supabase se disponível
  await supabaseSaveProfile(newStudent);

  // Salva localmente
  const users = getStoredUsers();
  saveStoredUsers([...users, newStudent]);

  return newStudent;
}

export function logoutUser() {
  setCurrentUser(null);
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.auth.signOut().catch(() => {});
  }
}

