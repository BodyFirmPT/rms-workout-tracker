import { supabase } from "@/integrations/supabase/client";
import { 
  Trainer, 
  Client, 
  MuscleGroup, 
  Workout, 
  WorkoutExercise, 
  CreateWorkoutExerciseInput 
} from '@/types/workout';

export class WorkoutService {
  // Trainers
  static async getTrainers(): Promise<Trainer[]> {
    const { data, error } = await supabase
      .from('trainer')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async addTrainer(name: string): Promise<Trainer> {
    const { data, error } = await supabase
      .from('trainer')
      .insert({ name })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Clients
  static async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('client')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async addClient(name: string, trainerId: string): Promise<Client> {
    const { data, error } = await supabase
      .from('client')
      .insert({ name, trainer_id: trainerId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Muscle Groups
  static async getMuscleGroups(): Promise<MuscleGroup[]> {
    const { data, error } = await supabase
      .from('muscle_group')
      .select('*')
      .order('default_group', { ascending: false })
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async addMuscleGroup(name: string, isDefault = false): Promise<MuscleGroup> {
    const { data, error } = await supabase
      .from('muscle_group')
      .insert({ name, default_group: isDefault })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateMuscleGroup(id: string, updates: Partial<{ name: string; default_group: boolean }>): Promise<MuscleGroup> {
    const { data, error } = await supabase
      .from('muscle_group')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteMuscleGroup(id: string): Promise<void> {
    const { error } = await supabase
      .from('muscle_group')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async deleteWorkout(id: string): Promise<void> {
    const { error } = await supabase
      .from('workout')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async getMuscleGroupById(id: string): Promise<MuscleGroup | null> {
    const { data, error } = await supabase
      .from('muscle_group')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  // Workouts
  static async getWorkouts(): Promise<Workout[]> {
    const { data, error } = await supabase
      .from('workout')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createWorkout(clientId: string, note: string, date?: string): Promise<Workout> {
    const { data, error } = await supabase
      .from('workout')
      .insert({ 
        client_id: clientId, 
        note,
        date: date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async startWorkout(workoutId: string): Promise<void> {
    // Set all other workouts to inactive
    await supabase
      .from('workout')
      .update({ is_active: false })
      .neq('id', workoutId);

    // Set this workout to active
    const { error } = await supabase
      .from('workout')
      .update({ is_active: true })
      .eq('id', workoutId);
    
    if (error) throw error;
  }

  static async getActiveWorkout(): Promise<Workout | null> {
    const { data, error } = await supabase
      .from('workout')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error) return null;
    return data;
  }

  static async completeWorkout(workoutId: string): Promise<void> {
    const { error } = await supabase
      .from('workout')
      .update({ is_active: false })
      .eq('id', workoutId);
    
    if (error) throw error;
  }

  // Workout Exercises
  static async getWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
    const { data, error } = await supabase
      .from('workout_exercise')
      .select('*')
      .eq('workout_id', workoutId)
      .order('created_at');
    
    if (error) throw error;
    return data || [];
  }

  static async addExerciseToWorkout(workoutId: string, exercise: CreateWorkoutExerciseInput): Promise<WorkoutExercise> {
    const { data, error } = await supabase
      .from('workout_exercise')
      .insert({
        workout_id: workoutId,
        muscle_group_id: exercise.muscle_group_id,
        exercise_name: exercise.exercise_name,
        reps: exercise.reps,
        unit: exercise.unit,
        count: exercise.count,
        note: exercise.note || '',
        set_count: exercise.set_count,
        completed_sets: 0,
        is_completed: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async completeExerciseSet(exerciseId: string): Promise<WorkoutExercise> {
    // Get current exercise
    const { data: exercise, error: fetchError } = await supabase
      .from('workout_exercise')
      .select('*')
      .eq('id', exerciseId)
      .single();
    
    if (fetchError) throw fetchError;

    const newCompletedSets = Math.min(exercise.completed_sets + 1, exercise.set_count);
    const isCompleted = newCompletedSets >= exercise.set_count;

    const { data, error } = await supabase
      .from('workout_exercise')
      .update({ 
        completed_sets: newCompletedSets,
        is_completed: isCompleted
      })
      .eq('id', exerciseId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getWorkoutProgress(workoutId: string): Promise<number> {
    const exercises = await this.getWorkoutExercises(workoutId);
    
    if (exercises.length === 0) return 0;
    
    const totalSets = exercises.reduce((sum, ex) => sum + ex.set_count, 0);
    const completedSets = exercises.reduce((sum, ex) => sum + ex.completed_sets, 0);
    
    return Math.round((completedSets / totalSets) * 100);
  }

  static async getClientExerciseHistory(clientId: string, muscleGroupId?: string): Promise<WorkoutExercise[]> {
    let query = supabase
      .from('workout_exercise')
      .select(`
        *,
        workout!inner(client_id)
      `)
      .eq('workout.client_id', clientId)
      .order('created_at', { ascending: false });

    if (muscleGroupId) {
      query = query.eq('muscle_group_id', muscleGroupId);
    }

    const { data, error } = await query.limit(50);
    
    if (error) throw error;
    return data || [];
  }

  static async getUniqueExercisesForClient(clientId: string, muscleGroupId: string): Promise<WorkoutExercise[]> {
    const { data, error } = await supabase
      .from('workout_exercise')
      .select(`
        *,
        workout!inner(client_id)
      `)
      .eq('workout.client_id', clientId)
      .eq('muscle_group_id', muscleGroupId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Get unique exercises by name (most recent version of each)
    const uniqueExercises = new Map();
    (data || []).forEach(exercise => {
      if (!uniqueExercises.has(exercise.exercise_name)) {
        uniqueExercises.set(exercise.exercise_name, exercise);
      }
    });
    
    return Array.from(uniqueExercises.values()).slice(0, 3); // Return top 3 unique exercises
  }

  static async deleteExercise(exerciseId: string): Promise<void> {
    const { error } = await supabase
      .from('workout_exercise')
      .delete()
      .eq('id', exerciseId);
    
    if (error) throw error;
  }

  static async updateExercise(exerciseId: string, updates: Partial<CreateWorkoutExerciseInput>): Promise<WorkoutExercise> {
    const { data, error } = await supabase
      .from('workout_exercise')
      .update(updates)
      .eq('id', exerciseId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}