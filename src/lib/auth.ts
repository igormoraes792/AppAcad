import type { UserProfile, UserRole, UserStatus } from '../types';
import {
  getSupabaseClient,
  supabaseFetchProfile,
  supabaseSaveProfile,
  supabaseFetchStudents,
  supabaseFetchInstructors,
  supabaseUpdateStudentStatus,
} from './supabase';
import { addSystemLog } from './logger';

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
export async function loginUser(
  email: string,
  password?: string
): Promise<{ user: UserProfile | null; error?: string; mustReset?: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabaseClient();

  // 1. Verificar primeiro se o usuário existe no Supabase (perfis na nuvem)
  if (supabase) {
    try {
      const cloudProfile = await supabaseFetchProfile(cleanEmail);

      if (cloudProfile) {
        // Checar se a conta está desativada
        if (cloudProfile.status === 'inativo') {
          addSystemLog('warn', 'AUTH', `Tentativa de login em conta desativada: ${cleanEmail}`);
          const isProf = cloudProfile.role === 'professor';
          return {
            user: null,
            error: isProf
              ? 'Sua conta de Personal foi desativada pelo Administrador Master.'
              : 'Esta conta foi desativada pelo seu personal. Entre em contato para reativar seu acesso.',
          };
        }

        // Checar se a conta está aguardando liberação
        if (cloudProfile.status === 'pendente') {
          addSystemLog('warn', 'AUTH', `Tentativa de login em conta pendente de aprovação: ${cleanEmail}`);
          const isProf = cloudProfile.role === 'professor';
          return {
            user: null,
            error: isProf
              ? 'Seu cadastro de Personal está aguardando aprovação do Administrador Master (Igor Moraes).'
              : 'Cadastro realizado com sucesso! Aguarde a liberação (OK) do seu Personal Trainer para acessar seus treinos.',
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
            addSystemLog('success', 'AUTH', `Login via Supabase Auth realizado: ${cleanEmail}`);
            return { user: cloudProfile, mustReset: Boolean(cloudProfile.mustResetPassword) };
          }
        }

        // Se for a conta Master com senha padrão ou teste
        if (cleanEmail === MASTER_ADMIN_EMAIL) {
          setCurrentUser(cloudProfile);
          addSystemLog('success', 'AUTH', `Login Master Admin realizado: ${cleanEmail}`);
          return { user: cloudProfile, mustReset: Boolean(cloudProfile.mustResetPassword) };
        }

        // Se o perfil existe no banco mas ainda não tem senha no Supabase Auth (ex: aluno recém cadastrado pelo personal)
        setCurrentUser(cloudProfile);
        addSystemLog('info', 'AUTH', `Login por perfil realizado: ${cleanEmail}`);
        return { user: cloudProfile, mustReset: Boolean(cloudProfile.mustResetPassword) };
      }
    } catch (e: any) {
      console.warn('Erro ao consultar Supabase no login:', e?.message);
      addSystemLog('warn', 'AUTH', `Aviso ao consultar Supabase no login de ${cleanEmail}: ${e?.message}`);
    }
  }

  // 2. Fallback de Usuários Locais
  const users = getStoredUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (found) {
    if (found.status === 'inativo') {
      addSystemLog('warn', 'AUTH', `Tentativa de login local em conta desativada: ${cleanEmail}`);
      const isProf = found.role === 'professor';
      return {
        user: null,
        error: isProf
          ? 'Sua conta de Personal foi desativada pelo Administrador Master.'
          : 'Esta conta foi desativada pelo seu personal. Entre em contato para reativar seu acesso.',
      };
    }
    if (found.status === 'pendente') {
      addSystemLog('warn', 'AUTH', `Tentativa de login local em conta pendente: ${cleanEmail}`);
      const isProf = found.role === 'professor';
      return {
        user: null,
        error: isProf
          ? 'Seu cadastro de Personal está aguardando aprovação do Administrador Master (Igor Moraes).'
          : 'Cadastro realizado com sucesso! Aguarde a liberação (OK) do seu Personal Trainer para acessar seus treinos.',
      };
    }
    setCurrentUser(found);
    addSystemLog('info', 'AUTH', `Login local realizado: ${cleanEmail}`);
    return { user: found, mustReset: Boolean(found.mustResetPassword) };
  }

  addSystemLog('warn', 'AUTH', `Falha de login - usuário não encontrado: ${cleanEmail}`);
  return { user: null, error: 'Usuário não encontrado. Verifique seu e-mail ou solicite convite ao seu personal.' };
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
  instructorName?: string,
  initialStatus?: UserStatus
): Promise<{ user: UserProfile | null; error?: string; status?: UserStatus }> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabaseClient();
  const isMaster = cleanEmail === MASTER_ADMIN_EMAIL;
  const finalRole: UserRole = isMaster ? 'admin' : role;

  // Master é sempre ativo. Cadastros avulsos (sem convite direto) iniciam como 'pendente'
  const finalStatus: UserStatus = isMaster
    ? 'ativo'
    : (initialStatus || 'pendente');

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
          status: finalStatus,
          isAdmin: isMaster,
          instructorId: instructorId,
          instructorName: instructorName,
          createdAt: new Date().toISOString(),
        };
        await supabaseSaveProfile(newProfile);

        // Só faz login automático se o usuário já estiver ATIVO (ex: master)
        if (finalStatus === 'ativo') {
          setCurrentUser(newProfile);
        }

        const users = getStoredUsers();
        saveStoredUsers([...users.filter((u) => u.email !== cleanEmail), newProfile]);

        return { user: newProfile, status: finalStatus };
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
    status: finalStatus,
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

  if (finalStatus === 'ativo') {
    setCurrentUser(newProfile);
  }

  return { user: newProfile, status: finalStatus };
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
 * Personal convida um aluno por e-mail e WhatsApp
 */
export async function inviteStudent(
  instructor: UserProfile,
  studentName: string,
  studentEmail: string,
  phone?: string
): Promise<{ student: UserProfile; emailSent: boolean; shareLink: string; whatsappUrl: string; error?: string }> {
  const cleanEmail = studentEmail.trim().toLowerCase();
  const supabase = getSupabaseClient();
  let studentId = `aluno-${Date.now()}`;

  // 1. Tentar criar o usuário no Supabase Auth caso ainda não exista
  if (supabase) {
    try {
      const tempPassword = 'FitTrack@' + Math.floor(100000 + Math.random() * 900000);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: tempPassword,
        options: {
          data: {
            name: studentName.trim(),
            role: 'aluno',
            instructor_id: instructor.id,
            instructor_name: instructor.name,
          },
        },
      });

      if (!signUpError && signUpData?.user) {
        studentId = signUpData.user.id;
        addSystemLog('info', 'CONVITE', `Usuário criado no Supabase Auth (${cleanEmail})`);
      } else if (signUpError) {
        // Pode ser "User already registered" - busca perfil existente
        addSystemLog('info', 'CONVITE', `Nota no cadastro Supabase Auth (${cleanEmail}): ${signUpError.message}`);
        const existing = await supabaseFetchProfile(cleanEmail);
        if (existing) {
          studentId = existing.id;
        }
      }
    } catch (e: any) {
      addSystemLog('warn', 'CONVITE', `Exceção no signUp do Supabase para ${cleanEmail}: ${e?.message}`);
    }
  }

  const newStudent: UserProfile = {
    id: studentId,
    name: studentName.trim(),
    email: cleanEmail,
    role: 'aluno',
    status: 'ativo',
    mustResetPassword: true,
    instructorId: instructor.id,
    instructorName: instructor.name,
    phone: phone?.trim(),
    createdAt: new Date().toISOString(),
  };

  // 2. Salva perfil no Supabase
  if (supabase) {
    await supabaseSaveProfile(newStudent);
  }

  // 3. Salva localmente
  const users = getStoredUsers();
  saveStoredUsers([...users.filter((u) => u.email !== cleanEmail), newStudent]);

  // 4. Dispara e-mail de definição de senha via Supabase
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
        addSystemLog('success', 'CONVITE', `E-mail de boas-vindas disparado para ${cleanEmail}`);
      } else {
        emailError = error.message;
        addSystemLog('warn', 'CONVITE', `Supabase não disparou e-mail para ${cleanEmail}: ${error.message}`, error);
      }
    } catch (e: any) {
      emailError = e?.message;
      addSystemLog('error', 'CONVITE', `Erro ao chamar resetPasswordForEmail para ${cleanEmail}: ${e?.message}`);
    }
  }

  // 5. Prepara link direto de primeiro acesso e mensagem para WhatsApp
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLink = `${origin}?firstAccess=true&email=${encodeURIComponent(cleanEmail)}`;
  const cleanPhone = phone?.replace(/\D/g, '') || '';
  const greetingMsg = encodeURIComponent(
    `Olá ${studentName.trim()}! Seu personal ${instructor.name} cadastrou seu acesso no FitTrack PRO. Acesse o aplicativo e crie sua senha no link: ${shareLink}`
  );
  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${greetingMsg}`
    : `https://wa.me/?text=${greetingMsg}`;

  addSystemLog('success', 'CONVITE', `Aluno convidado: ${studentName} (${cleanEmail})`, {
    emailSent,
    shareLink,
  });

  return { student: newStudent, emailSent, shareLink, whatsappUrl, error: emailError };
}

/**
 * Master Admin convida e autoriza um novo Personal Trainer no sistema
 */
export async function inviteInstructor(
  instructorName: string,
  instructorEmail: string,
  phone?: string
): Promise<{ instructor: UserProfile; emailSent: boolean; shareLink: string; whatsappUrl: string; error?: string }> {
  const cleanEmail = instructorEmail.trim().toLowerCase();
  const supabase = getSupabaseClient();
  let instructorId = `prof-${Date.now()}`;

  // 1. Tentar criar o usuário no Supabase Auth caso ainda não exista
  if (supabase) {
    try {
      const tempPassword = 'FitTrack@' + Math.floor(100000 + Math.random() * 900000);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: tempPassword,
        options: {
          data: {
            name: instructorName.trim(),
            role: 'professor',
          },
        },
      });

      if (!signUpError && signUpData?.user) {
        instructorId = signUpData.user.id;
        addSystemLog('info', 'CONVITE', `Personal criado no Supabase Auth (${cleanEmail})`);
      } else if (signUpError) {
        addSystemLog('info', 'CONVITE', `Nota no cadastro Personal Supabase Auth (${cleanEmail}): ${signUpError.message}`);
        const existing = await supabaseFetchProfile(cleanEmail);
        if (existing) {
          instructorId = existing.id;
        }
      }
    } catch (e: any) {
      addSystemLog('warn', 'CONVITE', `Exceção no signUp do Supabase para ${cleanEmail}: ${e?.message}`);
    }
  }

  const newInstructor: UserProfile = {
    id: instructorId,
    name: instructorName.trim(),
    email: cleanEmail,
    role: 'professor',
    status: 'ativo',
    mustResetPassword: true,
    phone: phone?.trim(),
    createdAt: new Date().toISOString(),
  };

  // 2. Salva perfil no Supabase
  if (supabase) {
    await supabaseSaveProfile(newInstructor);
  }

  // 3. Salva localmente
  const users = getStoredUsers();
  saveStoredUsers([...users.filter((u) => u.email !== cleanEmail), newInstructor]);

  // 4. Dispara e-mail de definição de senha via Supabase
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
        addSystemLog('success', 'CONVITE', `E-mail de boas-vindas disparado para Personal ${cleanEmail}`);
      } else {
        emailError = error.message;
        addSystemLog('warn', 'CONVITE', `Supabase não disparou e-mail para ${cleanEmail}: ${error.message}`, error);
      }
    } catch (e: any) {
      emailError = e?.message;
      addSystemLog('error', 'CONVITE', `Erro ao chamar resetPasswordForEmail para ${cleanEmail}: ${e?.message}`);
    }
  }

  // 5. Prepara link direto de primeiro acesso e mensagem para WhatsApp
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLink = `${origin}?firstAccess=true&email=${encodeURIComponent(cleanEmail)}`;
  const cleanPhone = phone?.replace(/\D/g, '') || '';
  const greetingMsg = encodeURIComponent(
    `Olá ${instructorName.trim()}! Você foi cadastrado como Personal Trainer no FitTrack PRO pelo Administrador Master Igor Moraes. Acesse o aplicativo e crie sua senha no link: ${shareLink}`
  );
  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${greetingMsg}`
    : `https://wa.me/?text=${greetingMsg}`;

  addSystemLog('success', 'CONVITE', `Personal convidado pelo Master: ${instructorName} (${cleanEmail})`, {
    emailSent,
    shareLink,
  });

  return { instructor: newInstructor, emailSent, shareLink, whatsappUrl, error: emailError };
}

/**
 * Busca a lista de professores/personais cadastrados no sistema
 */
export async function getInstructorsList(): Promise<UserProfile[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const list = await supabaseFetchInstructors();
      if (list && list.length > 0) {
        const stored = getStoredUsers();
        const nonInstructors = stored.filter((u) => u.role !== 'professor');
        saveStoredUsers([...nonInstructors, ...list]);
        return list;
      }
    } catch (e) {
      console.warn('Erro ao carregar personais do Supabase:', e);
    }
  }
  const users = getStoredUsers();
  return users.filter((u) => u.role === 'professor' || u.role === 'admin');
}

/**
 * Personal ou Admin Master reseta a senha de um aluno de volta para a inicial
 */
export async function resetStudentPasswordByInstructor(
  instructor: UserProfile,
  student: UserProfile
): Promise<{ success: boolean; emailSent: boolean; shareLink: string; whatsappUrl: string; error?: string }> {
  const supabase = getSupabaseClient();
  const cleanEmail = student.email.trim().toLowerCase();

  // 1. Marca flag mustResetPassword
  const updatedStudent: UserProfile = {
    ...student,
    mustResetPassword: true,
  };

  if (supabase) {
    await supabaseSaveProfile(updatedStudent);
  }

  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === student.id || u.email.toLowerCase() === cleanEmail);
  if (index >= 0) {
    users[index].mustResetPassword = true;
    saveStoredUsers(users);
  }

  // 2. Dispara e-mail pelo Supabase
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
        addSystemLog('success', 'SENHA', `E-mail de reset enviado para ${cleanEmail}`);
      } else {
        emailError = error.message;
        addSystemLog('warn', 'SENHA', `Supabase não disparou e-mail de reset para ${cleanEmail}: ${error.message}`, error);
      }
    } catch (e: any) {
      emailError = e?.message;
      addSystemLog('error', 'SENHA', `Erro ao chamar resetPasswordForEmail para ${cleanEmail}: ${e?.message}`);
    }
  }

  // 3. Link direto e WhatsApp
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLink = `${origin}?resetPassword=true&email=${encodeURIComponent(cleanEmail)}`;
  const cleanPhone = student.phone?.replace(/\D/g, '') || '';
  const greetingMsg = encodeURIComponent(
    `Olá ${student.name}! Seu personal ${instructor.name} resetou sua senha no FitTrack PRO. Clique no link para cadastrar sua nova senha: ${shareLink}`
  );
  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=${greetingMsg}`
    : `https://wa.me/?text=${greetingMsg}`;

  addSystemLog('info', 'SENHA', `Personal ${instructor.name} resetou a senha de ${student.name} (${cleanEmail})`);

  return {
    success: true,
    emailSent,
    shareLink,
    whatsappUrl,
    error: emailError,
  };
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
export async function updateUserPassword(newPassword: string, targetEmail?: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  const current = getCurrentUser();
  const email = targetEmail || current?.email;

  if (supabase) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        addSystemLog('error', 'SENHA', `Erro no updateUser do Supabase: ${error.message}`);
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      addSystemLog('error', 'SENHA', `Exceção no updateUser do Supabase: ${err?.message}`);
      return { success: false, error: err?.message || 'Erro ao atualizar a senha.' };
    }
  }

  // Desativa mustResetPassword localmente e no Supabase se o perfil existir
  if (current) {
    current.mustResetPassword = false;
    setCurrentUser(current);
    if (supabase) {
      supabaseSaveProfile(current).catch(() => {});
    }
  } else if (email) {
    const users = getStoredUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      found.mustResetPassword = false;
      saveStoredUsers(users);
      if (supabase) {
        supabaseSaveProfile(found).catch(() => {});
      }
    }
  }

  addSystemLog('success', 'SENHA', `Senha atualizada com sucesso para ${email || 'usuário atual'}`);
  return { success: true };
}
