export interface Trainer {
  id: string;
  name: string;
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  trainer_id: string;
  workout_count_offset: number;
  created_at?: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  default_group: boolean;
  category?: string;
  created_at?: string;
}

export interface Workout {
  id: string;
  date: string;
  note: string;
  client_id: string;
  status: 'draft' | 'started' | 'completed';
  location_id?: string | null;
  canceled_at?: string;
  late_cancelled?: boolean;
  created_at?: string;
  exercises?: WorkoutExercise[];
}

export interface WorkoutUpdateInput {
  note?: string;
  date?: string;
  location_id?: string | null;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  muscle_group_id: string;
  exercise_name: string;
  reps_count: number;
  reps_unit: string;
  weight_count: number;
  weight_unit: string;
  left_weight?: number;
  note: string;
  set_count: number;
  completed_sets: number;
  is_completed: boolean;
  type: 'exercise' | 'stretch';
  created_at?: string;
  // Keep old fields for migration compatibility
  reps?: string;
  unit?: string;
  count?: number;
}

export interface CreateWorkoutExerciseInput {
  muscle_group_id: string;
  exercise_name: string;
  reps_count: number;
  reps_unit: string;
  weight_count: number;
  weight_unit: string;
  left_weight?: number;
  note?: string;
  set_count: number;
  type?: 'exercise' | 'stretch';
}