export interface Trainer {
  id: string;
  name: string;
}

export interface Client {
  id: string;
  name: string;
  trainerId: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  default: boolean;
}

export interface Workout {
  id: string;
  date: string;
  note: string;
  clientId: string;
  exercises: WorkoutExercise[];
  isActive?: boolean;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  muscleGroupId: string;
  muscleGroupName: string;
  exerciseName: string;
  reps: string;
  unit: string;
  count: number;
  note: string;
  setCount: number;
  completedSets: number;
  isCompleted: boolean;
}

export interface CreateWorkoutExerciseInput {
  muscleGroupId: string;
  muscleGroupName: string;
  exerciseName: string;
  reps: string;
  unit: string;
  count: number;
  note?: string;
  setCount: number;
}