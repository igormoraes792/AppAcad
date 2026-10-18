import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

const STORAGE_KEY = 'fittrack_supabase_config';

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

export function getStoredSupabaseConfig(): SavedSupabaseConfig | null {
  // 1. Variáveis de ambiente configuradas no .env (ou no painel da Vercel)
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey && !envUrl.includes('sua-url-aqui')) {
    return { url: cleanSupabaseUrl(envUrl), anonKey: envKey.trim() };
  }

  // 2. Fallback de localStorage (caso o professor configure via UI do app)
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

  return null;
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
 * Script SQL completo para criar a estrutura no Supabase.
 * O professor/administrador só precisa colar este script no "SQL Editor" do Supabase.
 */
export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- SCRIPT DE INICIALIZAÇÃO DO BANCO SUPABASE PARA FITTRACK PRO
-- Copie e cole no menu "SQL Editor" do seu painel Supabase
-- ============================================================

-- 1. Habilitar extensão para UUIDs se necessário
create extension if not exists "uuid-ossp";

-- 2. Tabela de Perfis de Usuários (Alunos e Professores)
create table if not exists profiles (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null check (role in ('aluno', 'professor')),
  instructor_id text,
  instructor_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Fichas de Treino (vinculada a cada aluno)
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

-- 4. Tabela de Treinos Concluídos no Dia por cada Aluno
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

-- 5. Tabela de Registros de Peso Corporal por cada Aluno
create table if not exists weight_entries (
  id text primary key,
  student_id text not null,
  date text not null,
  weight_kg numeric not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Índices para consultas ultra rápidas por Aluno
create index if not exists idx_workout_plans_student on workout_plans(student_id);
create index if not exists idx_workout_logs_student on workout_logs(student_id);
create index if not exists idx_weight_entries_student on weight_entries(student_id);
create index if not exists idx_profiles_instructor on profiles(instructor_id);

-- 7. Ativar Row Level Security com acesso aberto para simplificar conexões anônimas da API
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
export async function supabaseFetchProfile(id: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      instructorId: data.instructor_id,
      instructorName: data.instructor_name,
      phone: data.phone,
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
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      instructor_id: profile.instructorId || null,
      instructor_name: profile.instructorName || null,
      phone: profile.phone || null,
      created_at: profile.createdAt,
    });
    return !error;
  } catch (err) {
    console.warn('Erro ao salvar perfil no Supabase:', err);
    return false;
  }
}

export async function supabaseFetchStudents(instructorId: string): Promise<UserProfile[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'aluno')
      .or(`instructor_id.eq.${instructorId},instructor_id.is.null`);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      email: d.email,
      name: d.name,
      role: d.role,
      instructorId: d.instructor_id,
      instructorName: d.instructor_name,
      phone: d.phone,
      createdAt: d.created_at,
    }));
  } catch (err) {
    console.warn('Erro ao buscar alunos no Supabase:', err);
    return [];
  }
}
