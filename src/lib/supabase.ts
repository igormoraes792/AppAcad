import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile, UserStatus } from '../types';

const STORAGE_KEY = 'fittrack_supabase_config';

// Credenciais padrão da nuvem para garantir sincronia 100% entre PC e Mobile
const DEFAULT_CLOUD_URL = 'https://bpjryybqkryeoyonsqdt.supabase.co';
const DEFAULT_CLOUD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwanJ5eWJxa3J5ZW95b25zcWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjc1NzQsImV4cCI6MjEwNzg0MzU3NH0.As257qDt6_Er3n_IB-0MC2E9P0NvLNv-scuVPF6xSdM';

export interface SavedSupabaseConfig {
  url: string;
  anonKey: string;
}

export function cleanSupabaseUrl(url: string): string {
  let clean = url.trim();
  clean = clean.replace(/\/rest\/v1\/?$/i, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

export function getStoredSupabaseConfig(): SavedSupabaseConfig {
  // 1. Variáveis de ambiente configuradas no .env (ou na Vercel)
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey && !envUrl.includes('sua-url-aqui')) {
    return { url: cleanSupabaseUrl(envUrl), anonKey: envKey.trim() };
  }

  // 2. Fallback de localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return { url: cleanSupabaseUrl(parsed.url), anonKey: parsed.anonKey.trim() };
      }
    }
  } catch (e) {
    console.warn('Erro ao ler config do Supabase do localStorage', e);
  }

  // 3. Fallback definitivo para o banco em produção (evita desconexão em mobile/PWA)
  return { url: DEFAULT_CLOUD_URL, anonKey: DEFAULT_CLOUD_KEY };
}

export function saveStoredSupabaseConfig(config: SavedSupabaseConfig | null) {
  if (!config) {
    localStorage.removeItem(STORAGE_KEY);
    cachedClient = null;
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  cachedClient = null; // reset cache
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const cfg = getStoredSupabaseConfig();
  if (!cfg || !cfg.url || !cfg.anonKey) return null;

  try {
    cachedClient = createClient(cfg.url, cfg.anonKey);
    return cachedClient;
  } catch (err) {
    console.error('Falha ao instanciar cliente Supabase:', err);
    return null;
  }
}

/**
 * Script SQL completo para criar ou atualizar o banco no Supabase.
 */
export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- SCRIPT FITTRACK PRO (COM SUPORTE A ADMIN E STATUS DE ALUNO)
-- ============================================================

create extension if not exists "uuid-ossp";

-- 1. Tabela de Perfis de Usuários
create table if not exists profiles (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null check (role in ('aluno', 'professor', 'admin')),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  instructor_id text,
  instructor_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garantir coluna status se a tabela já existia
alter table profiles add column if not exists status text default 'ativo';

-- 2. Tabela de Fichas de Treino
create table if not exists workout_plans (
  id text primary key,
  student_id text not null,
  created_by text,
  name text not null,
  category text not null,
  description text,
  exercises jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Treinos Concluídos
create table if not exists workout_logs (
  id text primary key,
  student_id text not null,
  date text not null,
  workout_name text not null,
  workout_plan_id text,
  duration_minutes integer default 0,
  completed_exercises jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Registros de Peso
create table if not exists weight_entries (
  id text primary key,
  student_id text not null,
  date text not null,
  weight_kg numeric not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices
create index if not exists idx_workout_plans_student on workout_plans(student_id);
create index if not exists idx_workout_logs_student on workout_logs(student_id);
create index if not exists idx_weight_entries_student on weight_entries(student_id);
create index if not exists idx_profiles_instructor on profiles(instructor_id);

-- RLS
alter table profiles enable row level security;
alter table workout_plans enable row level security;
alter table workout_logs enable row level security;
alter table weight_entries enable row level security;

create policy "Acesso livre profiles" on profiles for all using (true) with check (true);
create policy "Acesso livre workout_plans" on workout_plans for all using (true) with check (true);
create policy "Acesso livre workout_logs" on workout_logs for all using (true) with check (true);
create policy "Acesso livre weight_entries" on weight_entries for all using (true) with check (true);
`;

/**
 * Funções auxiliares para buscar e salvar no Supabase
 */
export async function supabaseFetchProfile(idOrEmail: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const isEmail = idOrEmail.includes('@');
    const query = supabase.from('profiles').select('*');
    const { data, error } = isEmail
      ? await query.eq('email', idOrEmail.toLowerCase().trim()).maybeSingle()
      : await query.eq('id', idOrEmail).maybeSingle();

    if (error || !data) return null;

    // Detectar status da coluna ou extraído de fallback
    const statusMatch = data.phone?.match(/\[STATUS:(ativo|inativo|pendente)\]/);
    const status: UserStatus = (data.status || (statusMatch ? statusMatch[1] : 'ativo')) as UserStatus;
    const resetMatch = data.phone?.match(/\[RESET:(true|false)\]/);
    const mustResetPassword = resetMatch ? resetMatch[1] === 'true' : false;
    const cleanPhone = data.phone?.replace(/\s*\[(STATUS:(ativo|inativo|pendente)|RESET:(true|false))\]/g, '').trim() || undefined;

    const isAdmin = data.email?.toLowerCase().trim() === 'igormoraes792@gmail.com' || data.role === 'admin';

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: isAdmin ? 'admin' : data.role,
      status,
      isAdmin,
      mustResetPassword,
      instructorId: data.instructor_id,
      instructorName: data.instructor_name,
      phone: cleanPhone,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.warn('Erro ao buscar perfil no Supabase:', err);
    return null;
  }
}

export async function supabaseSaveProfile(profile: UserProfile): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  try {
    const status = profile.status || 'ativo';
    const resetTag = profile.mustResetPassword ? ' [RESET:true]' : '';
    const basePhone = profile.phone ? profile.phone.replace(/\s*\[(STATUS:(ativo|inativo|pendente)|RESET:(true|false))\]/g, '') : '';
    const phoneWithFallback = `${basePhone} [STATUS:${status}]${resetTag}`.trim();

    // Tenta salvar com coluna status
    const payload: any = {
      id: profile.id,
      email: profile.email.toLowerCase().trim(),
      name: profile.name,
      role: profile.role,
      instructor_id: profile.instructorId || null,
      instructor_name: profile.instructorName || null,
      phone: phoneWithFallback,
      created_at: profile.createdAt,
    };

    const { error } = await supabase.from('profiles').upsert(payload);
    return !error;
  } catch (err) {
    console.warn('Erro ao salvar perfil no Supabase:', err);
    return false;
  }
}

export async function supabaseFetchStudents(instructorId: string, isMasterAdmin: boolean = false): Promise<UserProfile[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    let query = supabase.from('profiles').select('*').eq('role', 'aluno');

    // Se NÃO for admin geral, filtra apenas pelos alunos do professor
    if (!isMasterAdmin && instructorId !== 'admin-igor') {
      query = query.or(`instructor_id.eq.${instructorId},instructor_id.is.null`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((d: any) => {
      const statusMatch = d.phone?.match(/\[STATUS:(ativo|inativo|pendente)\]/);
      const status: UserStatus = (d.status || (statusMatch ? statusMatch[1] : 'ativo')) as UserStatus;
      const resetMatch = d.phone?.match(/\[RESET:(true|false)\]/);
      const mustResetPassword = resetMatch ? resetMatch[1] === 'true' : false;
      const cleanPhone = d.phone?.replace(/\s*\[(STATUS:(ativo|inativo|pendente)|RESET:(true|false))\]/g, '').trim() || undefined;

      return {
        id: d.id,
        email: d.email,
        name: d.name,
        role: d.role,
        status,
        mustResetPassword,
        instructorId: d.instructor_id,
        instructorName: d.instructor_name,
        phone: cleanPhone,
        createdAt: d.created_at,
      };
    });
  } catch (err) {
    console.warn('Erro ao buscar alunos no Supabase:', err);
    return [];
  }
}

export async function supabaseUpdateStudentStatus(studentId: string, status: UserStatus): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  try {
    // 1. Tenta atualizar direto na coluna status se existir
    const { error: colErr } = await supabase.from('profiles').update({ status }).eq('id', studentId);
    if (!colErr) return true;

    // 2. Fallback no campo phone caso a coluna ainda não exista
    const { data } = await supabase.from('profiles').select('phone').eq('id', studentId).single();
    let currentPhone = data?.phone || '';
    currentPhone = currentPhone.replace(/\s*\[STATUS:(ativo|inativo|pendente)\]/g, '');
    const newPhone = `${currentPhone} [STATUS:${status}]`.trim();
    await supabase.from('profiles').update({ phone: newPhone }).eq('id', studentId);
    return true;
  } catch (err) {
    console.warn('Erro ao atualizar status do usuário no Supabase:', err);
    return false;
  }
}

export async function supabaseFetchInstructors(): Promise<UserProfile[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('profiles').select('*').in('role', ['professor', 'admin']);
    if (error || !data) return [];

    return data.map((d: any) => {
      const statusMatch = d.phone?.match(/\[STATUS:(ativo|inativo|pendente)\]/);
      const status: UserStatus = (d.status || (statusMatch ? statusMatch[1] : 'ativo')) as UserStatus;
      const resetMatch = d.phone?.match(/\[RESET:(true|false)\]/);
      const mustResetPassword = resetMatch ? resetMatch[1] === 'true' : false;
      const cleanPhone = d.phone?.replace(/\s*\[(STATUS:(ativo|inativo|pendente)|RESET:(true|false))\]/g, '').trim() || undefined;
      const isAdmin = d.email?.toLowerCase().trim() === 'igormoraes792@gmail.com' || d.role === 'admin';

      return {
        id: d.id,
        email: d.email,
        name: d.name,
        role: isAdmin ? 'admin' : d.role,
        status,
        isAdmin,
        mustResetPassword,
        instructorId: d.instructor_id,
        instructorName: d.instructor_name,
        phone: cleanPhone,
        createdAt: d.created_at,
      };
    });
  } catch (err) {
    console.warn('Erro ao buscar personais no Supabase:', err);
    return [];
  }
}
