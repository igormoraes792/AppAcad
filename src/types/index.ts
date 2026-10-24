export type UserRole = 'aluno' | 'professor' | 'admin';

export type UserStatus = 'ativo' | 'inativo' | 'pendente';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
  isAdmin?: boolean;
  mustResetPassword?: boolean;
  instructorId?: string;
  instructorName?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export const isUserAdmin = (user: UserProfile | null): boolean => {
  if (!user) return false;
  return user.role === 'admin' || user.email?.toLowerCase().trim() === 'igormoraes792@gmail.com';
};

export interface SetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  muscleGroup: 'Peito' | 'Costas' | 'Pernas' | 'Ombros' | 'Bíceps' | 'Tríceps' | 'Abdômen' | 'Cardio';
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  notes?: string;
  lastWeightKg?: number;
}

export interface WorkoutPlan {
  id: string;
  studentId: string; // ID do aluno ao qual o treino pertence
  createdBy?: string; // ID do professor que criou
  name: string;
  category: string; // Ex: 'Treino A', 'Treino B', etc.
  description?: string;
  exercises: ExerciseTemplate[];
  updatedAt?: string;
}

export interface WorkoutPlanTemplate {
  id: string;
  createdBy: string;
  name: string;
  category: string;
  description?: string;
  exercises: ExerciseTemplate[];
  createdAt?: string;
}

export interface CompletedExerciseLog {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: SetLog[];
}

export interface WorkoutLog {
  id: string;
  studentId: string; // ID do aluno que realizou o treino
  date: string; // YYYY-MM-DD
  workoutName: string;
  workoutPlanId?: string;
  durationMinutes: number;
  completedExercises: CompletedExerciseLog[];
  notes?: string;
}

export interface WeightEntry {
  id: string;
  studentId: string; // ID do aluno
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
