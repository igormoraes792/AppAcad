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
  name: string;
  category: string; // Ex: 'Treino A', 'Treino B', etc.
  description?: string;
  exercises: ExerciseTemplate[];
}

export interface CompletedExerciseLog {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: SetLog[];
}

export interface WorkoutLog {
  id: string;
  date: string; // YYYY-MM-DD
  workoutName: string;
  workoutPlanId?: string;
  durationMinutes: number;
  completedExercises: CompletedExerciseLog[];
  notes?: string;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

