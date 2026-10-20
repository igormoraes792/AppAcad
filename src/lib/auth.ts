import type { UserProfile, UserRole, UserStatus } from '../types';
import {
  getSupabaseClient,
  supabaseFetchProfile,
  supabaseSaveProfile,
  supabaseFetchStudents,
  supabaseUpdateStudentStatus,
} from './supabase';

const CURRENT_USER_KEY = 'fittrack_current_user';
const USERS_LIST_KEY = 'fittrack_users_list';

export const MASTER_ADMIN_EMAIL = 'igormoraes792@gmail.com';

// Contas padrão do sistema
export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'admin-igor',
    name: 'Igor Moraes (Master)',
    email: MASTER_ADMIN_EMAIL,
    role: 'admin',
    status: 'ativo',
    isAdmin: true,
    phone: '(11) 99999-9999',
    createdAt: '2026-09-01',
  },
  {
    id: 'prof-igor',
    name: 'Igor Personal',
    email: 'igor@personal.com',
    role: 'professor',
    status: 'ativo',
    phone: '(11) 98888-7777',
    createdAt: '2026-09-01',
  },
  {
    id: 'aluno-lucas',
    name: 'Lucas Silva',
    email: 'lucas@aluno.com',
    role: 'aluno',
    status: 'ativo',
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
    status: 'ativo',
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
 * Realiza login no sistema com validação de status ativo/inativo e suporte cloud-first
 */
export async function loginUser(email: string, password?: string): Promise<{ user: UserProfile | null; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabaseClient();

  // 1. Verificar primeiro se o usuário existe no Supabase (perfis na nuvem)
  if (supabase) {
    try {
      const cloudProfile = await supabaseFetchProfile(cleanEmail);

      if (cloudProfile) {
        // Checar se a conta está desativada
        if (cloudProfile.status === 'inativo') {
          return {
            user: null,
            error: 'Esta conta foi desativada pelo personal. Entre em contato para reativar seu acesso.',
          };
        }

        // Se tem senha, tenta autenticar no Supabase Auth
        if (password) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: password,
          });

          if (!error && data.user) {
            setCurrentUser(cloudProfile);
            return { user: cloudProfile };
          }
        }

        // Se for a conta Master com senha padrão ou teste
        if (cleanEmail === MASTER_ADMIN_EMAIL) {
          setCurrentUser(cloudProfile);
          return { user: cloudProfile };
        }

        // Se o perfil existe no banco mas ainda não tem senha no Supabase Auth (ex: aluno recém cadastrado pelo personal)
        setCurrentUser(cloudProfile);
        return { user: cloudProfile };
      }
    } catch (e: any) {
      console.warn('Erro ao consultar Supabase no login:', e?.message);
    }
  }

  // 2. Fallback de Usuários Locais
  const users = getStoredUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (found) {
    if (found.status === 'inativo') {
      return {
        user: null,
        error: 'Esta conta foi desativada pelo personal. Entre em contato para reativar seu acesso.',
      };
    }
    setCurrentUser(found);
    return { user: found };
  }

  return { user: null, error: 'Usuário não encontrado. Verifique seu e-mail ou crie uma conta.' };
}

/**
 * Cadastro de novo usuário (Aluno, Professor ou Master Admin)
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
  const isMaster = cleanEmail === MASTER_ADMIN_EMAIL;
  const finalRole: UserRole = isMaster ? 'admin' : role;

  // 1. Tenta cadastrar no Supabase Auth se houver senha
  if (supabase && password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: name.trim(),
            role: finalRole,
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
          role: finalRole,
          status: 'ativo',
          isAdmin: isMaster,
          instructorId: instructorId,
          instructorName: instructorName,
          createdAt: new Date().toISOString(),
        };
        await supabaseSaveProfile(newProfile);
        setCurrentUser(newProfile);

        const users = getStoredUsers();
        saveStoredUsers([...users.filter((u) => u.email !== cleanEmail), newProfile]);

        return { user: newProfile };
      }
    } catch (e: any) {
      console.warn('Erro no signUp do Supabase:', e?.message);
    }
  }

  // 2. Cadastro de Perfil
  const newProfile: UserProfile = {
    id: isMaster ? 'admin-igor' : `user-${Date.now()}`,
    email: cleanEmail,
    name: name.trim(),
    role: finalRole,
    status: 'ativo',
    isAdmin: isMaster,
    instructorId: instructorId,
    instructorName: instructorName,
    createdAt: new Date().toISOString(),
  };

  if (supabase) {
    await supabaseSaveProfile(newProfile);
  }

  const users = getStoredUsers();
  const updatedUsers = [...users.filter((u) => u.email !== cleanEmail), newProfile];
  saveStoredUsers(updatedUsers);
  setCurrentUser(newProfile);

  return { user: newProfile };
}

/**
 * Busca a lista de alunos de um determinado professor (ou todos se for Admin Master)
 */
export async function getStudentsForInstructor(instructorId: string, isMaster: boolean = false): Promise<UserProfile[]> {
  const cloudStudents = await supabaseFetchStudents(instructorId, isMaster);
  if (cloudStudents.length > 0) {
    // Sincroniza lista local com a nuvem
    const currentUsers = getStoredUsers().filter((u) => u.role !== 'aluno');
    saveStoredUsers([...currentUsers, ...cloudStudents]);
    return cloudStudents;
  }

  const users = getStoredUsers();
  return users.filter((u) => u.role === 'aluno' && (isMaster || !u.instructorId || u.instructorId === instructorId));
}

/**
 * Personal convida um aluno por e-mail ou WhatsApp
 */
export async function inviteStudent(
  instructor: UserProfile,
  studentName: string,
  studentEmail: string,
  phone?: string
): Promise<{ student: UserProfile; emailSent: boolean; error?: string }> {
  const cleanEmail = studentEmail.trim().toLowerCase();
  const supabase = getSupabaseClient();

  const newStudent: UserProfile = {
    id: `aluno-${Date.now()}`,
    name: studentName.trim(),
    email: cleanEmail,
    role: 'aluno',
    status: 'ativo',
    instructorId: instructor.id,
    instructorName: instructor.name,
    phone: phone?.trim(),
    createdAt: new Date().toISOString(),
  };

  // Salva no Supabase
  if (supabase) {
    await supabaseSaveProfile(newStudent);
  }

  // Salva localmente
  const users = getStoredUsers();
  saveStoredUsers([...users.filter((u) => u.email !== cleanEmail), newStudent]);

  // Envia e-mail de recuperação/criação de senha no primeiro acesso
  let emailSent = false;
  let emailError: string | undefined;

  if (supabase) {
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });
      if (!error) {
        emailSent = true;
      } else {
        emailError = error.message;
      }
    } catch (e: any) {
      emailError = e?.message;
    }
  }

  return { student: newStudent, emailSent, error: emailError };
}

/**
 * Desativa ou reativa a conta de um aluno
 */
export async function setStudentActiveStatus(studentId: string, status: UserStatus): Promise<boolean> {
  const supabase = getSupabaseClient();

  if (supabase) {
    await supabaseUpdateStudentStatus(studentId, status);
  }

  // Atualiza localmente
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === studentId);
  if (index >= 0) {
    users[index].status = status;
    saveStoredUsers(users);
  }

  return true;
}

export function logoutUser() {
  setCurrentUser(null);
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.auth.signOut().catch(() => {});
  }
}

/**
 * Envia e-mail de recuperação de senha com link seguro via Supabase
 */
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao enviar e-mail de recuperação.' };
    }
  }

  return { success: true };
}

/**
 * Atualiza a senha do usuário autenticado após clicar no link de recuperação
 */
export async function updateUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao atualizar a senha.' };
    }
  }
  return { success: true };
}
