import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'fittrack_supabase_config';

export interface SavedSupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SavedSupabaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao ler config do Supabase do localStorage', e);
  }

  // Fallback para variáveis de ambiente se configuradas no .env
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
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
  cachedClient = null; // reset
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
 * Script SQL para criar as tabelas no Supabase com 1 clique (para o usuário rodar no SQL Editor)
 */
export const SUPABASE_SQL_SCHEMA = `-- Copie e cole este código no SQL Editor do Supabase (supabase.com):

-- 1. Tabela de Fichas de Treino
create table if not exists workout_plans (
  id text primary key,
  name text not null,
  category text not null,
  description text,
  exercises jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Treinos Concluídos no Dia
create table if not exists workout_logs (
  id text primary key,
  date text not null,
  workout_name text not null,
  workout_plan_id text,
  duration_minutes integer default 0,
  completed_exercises jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Registros de Peso Corporal
create table if not exists weight_entries (
  id text primary key,
  date text not null,
  weight_kg numeric not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar segurança em nível de linha (RLS) aberta para protótipo ou políticas públicas
alter table workout_plans enable row level security;
alter table workout_logs enable row level security;
alter table weight_entries enable row level security;

create policy "Acesso livre anonimo workout_plans" on workout_plans for all using (true) with check (true);
create policy "Acesso livre anonimo workout_logs" on workout_logs for all using (true) with check (true);
create policy "Acesso livre anonimo weight_entries" on weight_entries for all using (true) with check (true);
`;

