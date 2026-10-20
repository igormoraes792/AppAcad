import type { WeightEntry, WorkoutLog, WorkoutPlan, WorkoutPlanTemplate } from '../types';
import { getSupabaseClient } from './supabase';

const KEYS = {
  PLANS: 'fittrack_workout_plans',
  LOGS: 'fittrack_workout_logs',
  WEIGHTS: 'fittrack_weight_entries',
  TEMPLATES: 'fittrack_plan_templates',
};

// Planos Iniciais Mock vinculados ao aluno-lucas
export const DEFAULT_PLANS: WorkoutPlan[] = [
  {
    id: 'plan-a-lucas',
    studentId: 'aluno-lucas',
    createdBy: 'prof-igor',
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
    id: 'plan-b-lucas',
    studentId: 'aluno-lucas',
    createdBy: 'prof-igor',
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
    id: 'plan-c-lucas',
    studentId: 'aluno-lucas',
    createdBy: 'prof-igor',
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
  // Treino para Mariana
  {
    id: 'plan-a-mariana',
    studentId: 'aluna-mariana',
    createdBy: 'prof-igor',
    category: 'Treino A',
    name: 'Inferiores - Glúteos & Posterior',
    description: 'Ênfase em cadeia posterior e glúteos',
    exercises: [
      { id: 'ex-m1', name: 'Elevação Pélvica com Barra', muscleGroup: 'Pernas', targetSets: 4, targetReps: '10-12', restSeconds: 90, lastWeightKg: 60 },
      { id: 'ex-m2', name: 'Agachamento Búlgaro', muscleGroup: 'Pernas', targetSets: 3, targetReps: '10 cada', restSeconds: 75, lastWeightKg: 12 },
      { id: 'ex-m3', name: 'Stiff com Halteres', muscleGroup: 'Pernas', targetSets: 4, targetReps: '12', restSeconds: 75, lastWeightKg: 20 },
      { id: 'ex-m4', name: 'Cadeira Abdutora', muscleGroup: 'Pernas', targetSets: 4, targetReps: '15', restSeconds: 60, lastWeightKg: 50 },
    ],
  },
];

// Dados iniciais de peso corporal
export const DEFAULT_WEIGHTS: WeightEntry[] = [
  { id: 'w-1', studentId: 'aluno-lucas', date: '2026-09-15', weightKg: 82.5, note: 'Início da rotina' },
  { id: 'w-2', studentId: 'aluno-lucas', date: '2026-09-22', weightKg: 81.8, note: 'Fim da semana 1' },
  { id: 'w-3', studentId: 'aluno-lucas', date: '2026-09-29', weightKg: 81.2, note: 'Mais disposição' },
  { id: 'w-4', studentId: 'aluno-lucas', date: '2026-10-06', weightKg: 80.4, note: 'Cardio aumentado' },
  { id: 'w-5', studentId: 'aluno-lucas', date: '2026-10-13', weightKg: 79.8, note: 'Definição visível' },
  // Mariana
  { id: 'w-m1', studentId: 'aluna-mariana', date: '2026-10-01', weightKg: 62.0, note: 'Início com personal' },
  { id: 'w-m2', studentId: 'aluna-mariana', date: '2026-10-14', weightKg: 61.2, note: 'Boa evolução' },
];

// Histórico inicial de treinos
export const DEFAULT_LOGS: WorkoutLog[] = [
  {
    id: 'log-1',
    studentId: 'aluno-lucas',
    date: '2026-10-12',
    workoutName: 'Treino A - Peito, Ombros & Tríceps',
    workoutPlanId: 'plan-a-lucas',
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
    studentId: 'aluno-lucas',
    date: '2026-10-14',
    workoutName: 'Treino B - Costas & Bíceps',
    workoutPlanId: 'plan-b-lucas',
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

// LEITURA E GRAVAÇÃO COM ISOLAMENTO POR ALUNO
export function getAllStoredPlans(): WorkoutPlan[] {
  try {
    const raw = localStorage.getItem(KEYS.PLANS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(KEYS.PLANS, JSON.stringify(DEFAULT_PLANS));
  return DEFAULT_PLANS;
}

export function saveAllStoredPlans(plans: WorkoutPlan[]) {
  localStorage.setItem(KEYS.PLANS, JSON.stringify(plans));
}

export function getPlansForStudent(studentId: string): WorkoutPlan[] {
  const all = getAllStoredPlans();
  return all.filter((p) => p.studentId === studentId);
}

export function savePlanForStudent(plan: WorkoutPlan) {
  const all = getAllStoredPlans();
  const index = all.findIndex((p) => p.id === plan.id);
  if (index >= 0) {
    all[index] = plan;
  } else {
    all.push(plan);
  }
  saveAllStoredPlans(all);
}

export function deletePlanForStudent(planId: string) {
  const all = getAllStoredPlans();
  const filtered = all.filter((p) => p.id !== planId);
  saveAllStoredPlans(filtered);
}

// LOGS
export function getAllStoredLogs(): WorkoutLog[] {
  try {
    const raw = localStorage.getItem(KEYS.LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(KEYS.LOGS, JSON.stringify(DEFAULT_LOGS));
  return DEFAULT_LOGS;
}

export function saveAllStoredLogs(logs: WorkoutLog[]) {
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
}

export function getLogsForStudent(studentId: string): WorkoutLog[] {
  const all = getAllStoredLogs();
  return all.filter((l) => l.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));
}

export function saveLogForStudent(log: WorkoutLog) {
  const all = getAllStoredLogs();
  const index = all.findIndex((l) => l.id === log.id);
  if (index >= 0) {
    all[index] = log;
  } else {
    all.unshift(log);
  }
  saveAllStoredLogs(all);
}

// PESOS
export function getAllStoredWeights(): WeightEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.WEIGHTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(KEYS.WEIGHTS, JSON.stringify(DEFAULT_WEIGHTS));
  return DEFAULT_WEIGHTS;
}

export function saveAllStoredWeights(weights: WeightEntry[]) {
  localStorage.setItem(KEYS.WEIGHTS, JSON.stringify(weights));
}

export function getWeightsForStudent(studentId: string): WeightEntry[] {
  const all = getAllStoredWeights();
  return all.filter((w) => w.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));
}

export function saveWeightForStudent(weight: WeightEntry) {
  const all = getAllStoredWeights();
  const filtered = all.filter((w) => !(w.studentId === weight.studentId && w.date === weight.date));
  filtered.push(weight);
  saveAllStoredWeights(filtered);
}

export function deleteWeightForStudent(weightId: string) {
  const all = getAllStoredWeights();
  const filtered = all.filter((w) => w.id !== weightId);
  saveAllStoredWeights(filtered);
}

// ==========================================
// SINCRONIZAÇÃO EM NUVEM VIA SUPABASE
// ==========================================

export async function syncPlansForStudent(studentId: string): Promise<WorkoutPlan[]> {
  const supabase = getSupabaseClient();
  const local = getPlansForStudent(studentId);
  if (!supabase) return local;

  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('student_id', studentId);

    if (!error && data && data.length > 0) {
      const parsed: WorkoutPlan[] = data.map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        createdBy: row.created_by,
        name: row.name,
        category: row.category,
        description: row.description,
        exercises: row.exercises || [],
        updatedAt: row.updated_at,
      }));

      // Atualiza localmente
      const all = getAllStoredPlans().filter((p) => p.studentId !== studentId);
      saveAllStoredPlans([...all, ...parsed]);
      return parsed;
    } else if (local.length > 0) {
      // Sobe dados locais para o Supabase
      for (const p of local) {
        await supabase.from('workout_plans').upsert({
          id: p.id,
          student_id: p.studentId,
          created_by: p.createdBy || null,
          name: p.name,
          category: p.category,
          description: p.description,
          exercises: p.exercises,
        });
      }
    }
  } catch (err) {
    console.error('Falha na sincronização de treinos no Supabase:', err);
  }
  return local;
}

export async function uploadPlanToCloud(plan: WorkoutPlan) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('workout_plans').upsert({
      id: plan.id,
      student_id: plan.studentId,
      created_by: plan.createdBy || null,
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
      student_id: log.studentId,
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

export async function syncLogsForStudent(studentId: string): Promise<WorkoutLog[]> {
  const supabase = getSupabaseClient();
  const local = getLogsForStudent(studentId);
  if (!supabase) return local;

  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (!error && data && data.length > 0) {
      const parsed: WorkoutLog[] = data.map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        date: row.date,
        workoutName: row.workout_name,
        workoutPlanId: row.workout_plan_id,
        durationMinutes: row.duration_minutes,
        completedExercises: row.completed_exercises || [],
        notes: row.notes,
      }));
      const all = getAllStoredLogs().filter((l) => l.studentId !== studentId);
      saveAllStoredLogs([...all, ...parsed]);
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
      student_id: entry.studentId,
      date: entry.date,
      weight_kg: entry.weightKg,
      note: entry.note,
    });
  } catch (e) {
    console.warn('Falha ao enviar peso ao Supabase:', e);
  }
}

export async function syncWeightsForStudent(studentId: string): Promise<WeightEntry[]> {
  const supabase = getSupabaseClient();
  const local = getWeightsForStudent(studentId);
  if (!supabase) return local;

  try {
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (!error && data && data.length > 0) {
      const parsed: WeightEntry[] = data.map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        date: row.date,
        weightKg: Number(row.weight_kg),
        note: row.note,
      }));
      const all = getAllStoredWeights().filter((w) => w.studentId !== studentId);
      saveAllStoredWeights([...all, ...parsed]);
      return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return local;
}

// ==========================================
// MODELOS / TEMPLATES DE FICHAS DE TREINO
// ==========================================

export const DEFAULT_PLAN_TEMPLATES: WorkoutPlanTemplate[] = [
  {
    id: 'template-a-push',
    createdBy: 'global',
    category: 'Treino A',
    name: 'Peito, Ombros & Tríceps (Push)',
    description: 'Ficha completa de empurrar focando hipertrofia e força',
    createdAt: '2026-09-01',
    exercises: [
      { id: 't-ex-1', name: 'Supino Reto com Barra', muscleGroup: 'Peito', targetSets: 4, targetReps: '8-10', restSeconds: 90, lastWeightKg: 50 },
      { id: 't-ex-2', name: 'Supino Inclinado com Halteres', muscleGroup: 'Peito', targetSets: 4, targetReps: '10-12', restSeconds: 75, lastWeightKg: 20 },
      { id: 't-ex-3', name: 'Crossover na Polia Média', muscleGroup: 'Peito', targetSets: 3, targetReps: '12-15', restSeconds: 60, lastWeightKg: 15 },
      { id: 't-ex-4', name: 'Desenvolvimento com Halteres Sentado', muscleGroup: 'Ombros', targetSets: 4, targetReps: '10-12', restSeconds: 75, lastWeightKg: 16 },
      { id: 't-ex-5', name: 'Elevação Lateral com Halteres', muscleGroup: 'Ombros', targetSets: 4, targetReps: '12-15', restSeconds: 60, lastWeightKg: 8 },
      { id: 't-ex-6', name: 'Tríceps Corda na Polia Alta', muscleGroup: 'Tríceps', targetSets: 4, targetReps: '12-15', restSeconds: 60, lastWeightKg: 25 },
    ],
  },
  {
    id: 'template-b-pull',
    createdBy: 'global',
    category: 'Treino B',
    name: 'Costas & Bíceps (Pull)',
    description: 'Ficha completa de puxar para largura dorsal e bíceps denso',
    createdAt: '2026-09-01',
    exercises: [
      { id: 't-ex-7', name: 'Puxada Alta Frontal na Polia', muscleGroup: 'Costas', targetSets: 4, targetReps: '10-12', restSeconds: 90, lastWeightKg: 50 },
      { id: 't-ex-8', name: 'Remada Curvada com Barra', muscleGroup: 'Costas', targetSets: 4, targetReps: '8-10', restSeconds: 90, lastWeightKg: 50 },
      { id: 't-ex-9', name: 'Remada Baixa com Triângulo', muscleGroup: 'Costas', targetSets: 3, targetReps: '10-12', restSeconds: 75, lastWeightKg: 45 },
      { id: 't-ex-10', name: 'Crucifixo Inverso na Máquina', muscleGroup: 'Costas', targetSets: 3, targetReps: '12-15', restSeconds: 60, lastWeightKg: 30 },
      { id: 't-ex-11', name: 'Rosca Direta com Barra W', muscleGroup: 'Bíceps', targetSets: 4, targetReps: '10-12', restSeconds: 60, lastWeightKg: 20 },
      { id: 't-ex-12', name: 'Rosca Martelo com Halteres', muscleGroup: 'Bíceps', targetSets: 4, targetReps: '10-12', restSeconds: 60, lastWeightKg: 12 },
    ],
  },
  {
    id: 'template-c-legs',
    createdBy: 'global',
    category: 'Treino C',
    name: 'Pernas & Abdômen Completo (Legs)',
    description: 'Quadríceps, posteriores, panturrilha e core completo',
    createdAt: '2026-09-01',
    exercises: [
      { id: 't-ex-13', name: 'Agachamento Livre com Barra', muscleGroup: 'Pernas', targetSets: 4, targetReps: '8-10', restSeconds: 120, lastWeightKg: 60 },
      { id: 't-ex-14', name: 'Leg Press 45°', muscleGroup: 'Pernas', targetSets: 4, targetReps: '10-12', restSeconds: 90, lastWeightKg: 160 },
      { id: 't-ex-15', name: 'Cadeira Extensora', muscleGroup: 'Pernas', targetSets: 4, targetReps: '12-15', restSeconds: 60, lastWeightKg: 45 },
      { id: 't-ex-16', name: 'Mesa Flexora', muscleGroup: 'Pernas', targetSets: 4, targetReps: '10-12', restSeconds: 60, lastWeightKg: 35 },
      { id: 't-ex-17', name: 'Panturrilha em Pé na Máquina', muscleGroup: 'Pernas', targetSets: 4, targetReps: '15-20', restSeconds: 45, lastWeightKg: 50 },
      { id: 't-ex-18', name: 'Prancha Abdominal Estática', muscleGroup: 'Abdômen', targetSets: 3, targetReps: '45-60s', restSeconds: 45, lastWeightKg: 0 },
    ],
  },
  {
    id: 'template-d-gluteos',
    createdBy: 'global',
    category: 'Treino D',
    name: 'Inferiores - Glúteos & Posterior (Foco Feminino)',
    description: 'Ênfase máxima em glúteo máximo, médio e posteriores',
    createdAt: '2026-09-01',
    exercises: [
      { id: 't-ex-19', name: 'Elevação Pélvica com Barra', muscleGroup: 'Pernas', targetSets: 4, targetReps: '10-12', restSeconds: 90, lastWeightKg: 50 },
      { id: 't-ex-20', name: 'Agachamento Búlgaro', muscleGroup: 'Pernas', targetSets: 3, targetReps: '10 cada', restSeconds: 75, lastWeightKg: 10 },
      { id: 't-ex-21', name: 'Stiff com Barra ou Halteres', muscleGroup: 'Pernas', targetSets: 4, targetReps: '10-12', restSeconds: 75, lastWeightKg: 30 },
      { id: 't-ex-22', name: 'Cadeira Abdutora', muscleGroup: 'Pernas', targetSets: 4, targetReps: '15-20', restSeconds: 45, lastWeightKg: 45 },
      { id: 't-ex-23', name: 'Mesa Flexora', muscleGroup: 'Pernas', targetSets: 3, targetReps: '12-15', restSeconds: 60, lastWeightKg: 35 },
    ],
  },
];

export function getAllPlanTemplates(): WorkoutPlanTemplate[] {
  try {
    const raw = localStorage.getItem(KEYS.TEMPLATES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(DEFAULT_PLAN_TEMPLATES));
  return DEFAULT_PLAN_TEMPLATES;
}

export function saveAllPlanTemplates(templates: WorkoutPlanTemplate[]) {
  localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
}

export function savePlanAsTemplate(plan: WorkoutPlan, instructorId: string, customName?: string): WorkoutPlanTemplate {
  const templates = getAllPlanTemplates();
  const newTemplate: WorkoutPlanTemplate = {
    id: `template-${Date.now()}`,
    createdBy: instructorId,
    category: plan.category,
    name: customName?.trim() || plan.name,
    description: plan.description,
    exercises: JSON.parse(JSON.stringify(plan.exercises)),
    createdAt: new Date().toISOString(),
  };

  templates.push(newTemplate);
  saveAllPlanTemplates(templates);
  uploadTemplateToCloud(newTemplate);
  return newTemplate;
}

export function deletePlanTemplate(templateId: string) {
  const templates = getAllPlanTemplates().filter((t) => t.id !== templateId);
  saveAllPlanTemplates(templates);
  deleteTemplateFromCloud(templateId);
}

export async function applyTemplateToStudent(
  template: WorkoutPlanTemplate,
  studentId: string,
  instructorId: string
): Promise<WorkoutPlan> {
  const newPlan: WorkoutPlan = {
    id: `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    studentId,
    createdBy: instructorId,
    category: template.category,
    name: template.name,
    description: template.description,
    exercises: template.exercises.map((ex, idx) => ({
      ...ex,
      id: `ex-${Date.now()}-${idx}`,
    })),
    updatedAt: new Date().toISOString(),
  };

  savePlanForStudent(newPlan);
  await uploadPlanToCloud(newPlan);
  return newPlan;
}

export async function uploadTemplateToCloud(template: WorkoutPlanTemplate) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('workout_plans').upsert({
      id: template.id,
      student_id: 'template',
      created_by: template.createdBy,
      name: template.name,
      category: template.category,
      description: template.description,
      exercises: template.exercises,
    });
  } catch (e) {
    console.warn('Falha ao subir modelo para o Supabase:', e);
  }
}

export async function deleteTemplateFromCloud(templateId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from('workout_plans').delete().eq('id', templateId);
  } catch (e) {
    console.warn('Falha ao deletar modelo no Supabase:', e);
  }
}

export async function syncTemplatesWithCloud(): Promise<WorkoutPlanTemplate[]> {
  const supabase = getSupabaseClient();
  const local = getAllPlanTemplates();
  if (!supabase) return local;

  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('student_id', 'template');

    if (!error && data && data.length > 0) {
      const cloudTemplates: WorkoutPlanTemplate[] = data.map((row: any) => ({
        id: row.id,
        createdBy: row.created_by || 'global',
        name: row.name,
        category: row.category,
        description: row.description,
        exercises: row.exercises || [],
        createdAt: row.created_at || row.updated_at,
      }));

      const merged = [...cloudTemplates];
      for (const def of DEFAULT_PLAN_TEMPLATES) {
        if (!merged.some((m) => m.id === def.id || m.name === def.name)) {
          merged.push(def);
        }
      }
      saveAllPlanTemplates(merged);
      return merged;
    } else if (local.length > 0) {
      for (const t of local) {
        await uploadTemplateToCloud(t);
      }
    }
  } catch (e) {
    console.warn('Erro ao sincronizar templates com o Supabase:', e);
  }
  return local;
}
