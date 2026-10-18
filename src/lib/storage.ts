import type { WeightEntry, WorkoutLog, WorkoutPlan } from '../types';
import { getSupabaseClient } from './supabase';

const KEYS = {
  PLANS: 'fittrack_workout_plans',
  LOGS: 'fittrack_workout_logs',
  WEIGHTS: 'fittrack_weight_entries',
};

// Dados padrão iniciais ricos e realistas para primeira experiência
export const DEFAULT_PLANS: WorkoutPlan[] = [
  {
    id: 'plan-a',
    category: 'Treino A',
    name: 'Peito, Ombros & Tríceps',
    description: 'Foco em força empurrando e hipertrofia',
    exercises: [
      { id: 'ex-1', name: 'Supino Reto com Barra', muscleGroup: 'Peito', targetSets: 4, targetReps: '8-10', restSeconds: 90, lastWeightKg: 70 },
      { id: 'ex-2', name: 'Supino Inclinado Halteres', muscleGroup: 'Peito', targetSets: 3, targetReps: '10-12', restSeconds: 75, lastWeightKg: 24 },
      { id: 'ex-3', name: 'Crucifixo no Crossover', muscleGroup: 'Peito', targetSets: 3, targetReps: '12-15', restSeconds: 60, lastWeightKg: 15 },
      { id: 'ex-4', name: 'Desenvolvimento Militar', muscleGroup: 'Ombros', targetSets: 3, targetReps: '8-10', restSeconds: 90, lastWeightKg: 18 },
      { id: 'ex-5', name: 'Elevação Lateral Halteres', muscleGroup: 'Ombros', targetSets: 4, targetReps: '12-15', restSeconds: 60, lastWeightKg: 10 },
      { id: 'ex-6', name: 'Tríceps Corda na Polia', muscleGroup: 'Tríceps', targetSets: 4, targetReps: '12-15', restSeconds: 60, lastWeightKg: 25 },
    ],
  },
  {
    id: 'plan-b',
    category: 'Treino B',
    name: 'Costas & Bíceps',
    description: 'Puxadas, densidade dorsal e braços',
    exercises: [
      { id: 'ex-7', name: 'Puxada Alta Frontal', muscleGroup: 'Costas', targetSets: 4, targetReps: '10-12', restSeconds: 90, lastWeightKg: 55 },
      { id: 'ex-8', name: 'Remada Baixa Triângulo', muscleGroup: 'Costas', targetSets: 4, targetReps: '10-12', restSeconds: 75, lastWeightKg: 50 },
      { id: 'ex-9', name: 'Remada Curvada com Barra', muscleGroup: 'Costas', targetSets: 3, targetReps: '8-10', restSeconds: 90, lastWeightKg: 60 },
      { id: 'ex-10', name: 'Crucifixo Inverso Máquina', muscleGroup: 'Costas', targetSets: 3, targetReps: '12-15', restSeconds: 60, lastWeightKg: 35 },
      { id: 'ex-11', name: 'Rosca Direta W', muscleGroup: 'Bíceps', targetSets: 3, targetReps: '10-12', restSeconds: 60, lastWeightKg: 14 },
      { id: 'ex-12', name: 'Rosca Martelo Halteres', muscleGroup: 'Bíceps', targetSets: 3, targetReps: '12', restSeconds: 60, lastWeightKg: 12 },
    ],
  },
  {
    id: 'plan-c',
    category: 'Treino C',
    name: 'Pernas & Abdômen',
    description: 'Quadríceps, posteriores, panturrilha e core',
    exercises: [
      { id: 'ex-13', name: 'Agachamento Livre', muscleGroup: 'Pernas', targetSets: 4, targetReps: '8-10', restSeconds: 120, lastWeightKg: 80 },
      { id: 'ex-14', name: 'Leg Press 45°', muscleGroup: 'Pernas', targetSets: 4, targetReps: '10-12', restSeconds: 90, lastWeightKg: 180 },
      { id: 'ex-15', name: 'Cadeira Extensora', muscleGroup: 'Pernas', targetSets: 3, targetReps: '12-15', restSeconds: 60, lastWeightKg: 45 },
      { id: 'ex-16', name: 'Mesa Flexora', muscleGroup: 'Pernas', targetSets: 3, targetReps: '10-12', restSeconds: 60, lastWeightKg: 40 },
      { id: 'ex-17', name: 'Gêmeos Sentado (Panturrilha)', muscleGroup: 'Pernas', targetSets: 4, targetReps: '15', restSeconds: 45, lastWeightKg: 40 },
      { id: 'ex-18', name: 'Prancha Abdominal', muscleGroup: 'Abdômen', targetSets: 3, targetReps: '45s', restSeconds: 60, lastWeightKg: 0 },
    ],
  },
];

// Dados iniciais de peso corporal
export const DEFAULT_WEIGHTS: WeightEntry[] = [
  { id: 'w-1', date: '2026-09-15', weightKg: 82.5, note: 'Início da rotina' },
  { id: 'w-2', date: '2026-09-22', weightKg: 81.8, note: 'Fim da semana 1' },
  { id: 'w-3', date: '2026-09-29', weightKg: 81.2, note: 'Mais disposição' },
  { id: 'w-4', date: '2026-10-06', weightKg: 80.4, note: 'Cardio aumentado' },
  { id: 'w-5', date: '2026-10-13', weightKg: 79.8, note: 'Definição visível' },
];

// Histórico inicial de treinos
export const DEFAULT_LOGS: WorkoutLog[] = [
  {
    id: 'log-1',
    date: '2026-10-12',
    workoutName: 'Treino A - Peito, Ombros & Tríceps',
    workoutPlanId: 'plan-a',
    durationMinutes: 52,
    notes: 'Treino rendeu muito bem!',
    completedExercises: [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Supino Reto com Barra',
        muscleGroup: 'Peito',
        sets: [
          { setNumber: 1, weightKg: 65, reps: 10, completed: true },
          { setNumber: 2, weightKg: 70, reps: 9, completed: true },
          { setNumber: 3, weightKg: 70, reps: 8, completed: true },
          { setNumber: 4, weightKg: 70, reps: 8, completed: true },
        ],
      },
      {
        exerciseId: 'ex-2',
        exerciseName: 'Supino Inclinado Halteres',
        muscleGroup: 'Peito',
        sets: [
          { setNumber: 1, weightKg: 22, reps: 12, completed: true },
          { setNumber: 2, weightKg: 24, reps: 10, completed: true },
          { setNumber: 3, weightKg: 24, reps: 10, completed: true },
        ],
      },
    ],
  },
  {
    id: 'log-2',
    date: '2026-10-14',
    workoutName: 'Treino B - Costas & Bíceps',
    workoutPlanId: 'plan-b',
    durationMinutes: 48,
    notes: 'Boa contração nas costas',
    completedExercises: [
      {
        exerciseId: 'ex-7',
        exerciseName: 'Puxada Alta Frontal',
        muscleGroup: 'Costas',
        sets: [
          { setNumber: 1, weightKg: 50, reps: 12, completed: true },
          { setNumber: 2, weightKg: 55, reps: 10, completed: true },
          { setNumber: 3, weightKg: 55, reps: 10, completed: true },
          { setNumber: 4, weightKg: 55, reps: 9, completed: true },
        ],
      },
    ],
  },
];

// Funções de Leitura e Escrita Locais
export function getStoredPlans(): WorkoutPlan[] {
  try {
    const raw = localStorage.getItem(KEYS.PLANS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(KEYS.PLANS, JSON.stringify(DEFAULT_PLANS));
  return DEFAULT_PLANS;
}

export function saveStoredPlans(plans: WorkoutPlan[]) {
  localStorage.setItem(KEYS.PLANS, JSON.stringify(plans));
}

export function getStoredLogs(): WorkoutLog[] {
  try {
    const raw = localStorage.getItem(KEYS.LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(KEYS.LOGS, JSON.stringify(DEFAULT_LOGS));
  return DEFAULT_LOGS;
}

export function saveStoredLogs(logs: WorkoutLog[]) {
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
}

export function getStoredWeights(): WeightEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.WEIGHTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(KEYS.WEIGHTS, JSON.stringify(DEFAULT_WEIGHTS));
  return DEFAULT_WEIGHTS;
}

export function saveStoredWeights(weights: WeightEntry[]) {
  localStorage.setItem(KEYS.WEIGHTS, JSON.stringify(weights));
}

// SINCRONIZAÇÃO COM SUPABASE NA NUVEM
export async function syncPlansWithCloud(): Promise<WorkoutPlan[]> {
  const supabase = getSupabaseClient();
  const local = getStoredPlans();
  if (!supabase) return local;

  try {
    const { data, error } = await supabase.from('workout_plans').select('*');
    if (error) {
      console.warn('Erro ao baixar fichas do Supabase:', error.message);
      return local;
    }

    if (data && data.length > 0) {
      const parsed: WorkoutPlan[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        exercises: row.exercises || [],
      }));
      saveStoredPlans(parsed);
      return parsed;
    } else {
      // Se a tabela do Supabase estiver vazia, sobe os dados locais para lá
      for (const p of local) {
        await supabase.from('workout_plans').upsert({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          exercises: p.exercises,
        });
      }
    }
  } catch (err) {
    console.error('Falha na sincronização do Supabase:', err);
  }
  return local;
}

export async function uploadPlanToCloud(plan: WorkoutPlan) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('workout_plans').upsert({
      id: plan.id,
      name: plan.name,
      category: plan.category,
      description: plan.description,
      exercises: plan.exercises,
    });
  } catch (e) {
    console.warn('Falha ao enviar plano ao Supabase:', e);
  }
}

export async function deletePlanFromCloud(planId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('workout_plans').delete().eq('id', planId);
  } catch (e) {
    console.warn('Falha ao deletar plano no Supabase:', e);
  }
}

export async function uploadLogToCloud(log: WorkoutLog) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('workout_logs').upsert({
      id: log.id,
      date: log.date,
      workout_name: log.workoutName,
      workout_plan_id: log.workoutPlanId,
      duration_minutes: log.durationMinutes,
      completed_exercises: log.completedExercises,
      notes: log.notes,
    });
  } catch (e) {
    console.warn('Falha ao enviar log ao Supabase:', e);
  }
}

export async function syncLogsWithCloud(): Promise<WorkoutLog[]> {
  const supabase = getSupabaseClient();
  const local = getStoredLogs();
  if (!supabase) return local;

  try {
    const { data, error } = await supabase.from('workout_logs').select('*').order('date', { ascending: false });
    if (!error && data && data.length > 0) {
      const parsed: WorkoutLog[] = data.map((row: any) => ({
        id: row.id,
        date: row.date,
        workoutName: row.workout_name,
        workoutPlanId: row.workout_plan_id,
        durationMinutes: row.duration_minutes,
        completedExercises: row.completed_exercises || [],
        notes: row.notes,
      }));
      saveStoredLogs(parsed);
      return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return local;
}

export async function uploadWeightToCloud(entry: WeightEntry) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('weight_entries').upsert({
      id: entry.id,
      date: entry.date,
      weight_kg: entry.weightKg,
      note: entry.note,
    });
  } catch (e) {
    console.warn('Falha ao enviar peso ao Supabase:', e);
  }
}

export async function syncWeightsWithCloud(): Promise<WeightEntry[]> {
  const supabase = getSupabaseClient();
  const local = getStoredWeights();
  if (!supabase) return local;

  try {
    const { data, error } = await supabase.from('weight_entries').select('*').order('date', { ascending: true });
    if (!error && data && data.length > 0) {
      const parsed: WeightEntry[] = data.map((row: any) => ({
        id: row.id,
        date: row.date,
        weightKg: Number(row.weight_kg),
        note: row.note,
      }));
      saveStoredWeights(parsed);
      return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return local;
}
