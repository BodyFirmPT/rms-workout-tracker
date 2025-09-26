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

  static async updateClient(id: string, updates: Partial<{ name: string; trainer_id: string }>): Promise<Client> {
    const { data, error } = await supabase
      .from('client')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('client')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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

  static async addMuscleGroup(name: string, isDefault = false, category?: string): Promise<MuscleGroup> {
    const { data, error } = await supabase
      .from('muscle_group')
      .insert({ name, default_group: isDefault, category })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateMuscleGroup(id: string, updates: Partial<{ name: string; default_group: boolean; category: string }>): Promise<MuscleGroup> {
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

  static async updateWorkout(id: string, updates: Partial<{ note: string; date: string }>): Promise<Workout> {
    const { data, error } = await supabase
      .from('workout')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Workout;
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
    return (data || []) as Workout[];
  }

  static async createWorkout(clientId: string, note: string, date?: string): Promise<Workout> {
    const { data, error } = await supabase
      .from('workout')
      .insert({ 
        client_id: clientId, 
        note,
        date: date || new Date().toISOString().split('T')[0],
        status: 'draft'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Workout;
  }

  static async startWorkout(workoutId: string): Promise<void> {
    // Set all other workouts with 'started' status to 'draft'
    await supabase
      .from('workout')
      .update({ status: 'draft' })
      .eq('status', 'started')
      .neq('id', workoutId);

    // Set this workout to started
    const { error } = await supabase
      .from('workout')
      .update({ status: 'started' })
      .eq('id', workoutId);
    
    if (error) throw error;
  }

  static async getActiveWorkout(): Promise<Workout | null> {
    const { data, error } = await supabase
      .from('workout')
      .select('*')
      .eq('status', 'started')
      .maybeSingle();
    
    if (error) return null;
    return data as Workout | null;
  }

  static async completeWorkout(workoutId: string): Promise<void> {
    const { error } = await supabase
      .from('workout')
      .update({ status: 'completed' })
      .eq('id', workoutId);
    
    if (error) throw error;
  }

  static async duplicateWorkout(workoutId: string, clientId: string, date: Date) {
    // First get the original workout with its exercises
    const { data: originalWorkout, error: workoutError } = await supabase
      .from('workout')
      .select('*')
      .eq('id', workoutId)
      .single();

    if (workoutError) {
      console.error('Error fetching original workout:', workoutError);
      throw workoutError;
    }

    const { data: originalExercises, error: exercisesError } = await supabase
      .from('workout_exercise')
      .select('*')
      .eq('workout_id', workoutId);

    if (exercisesError) {
      console.error('Error fetching original exercises:', exercisesError);
      throw exercisesError;
    }

    // Create the new workout as draft
    const { data: newWorkout, error: createWorkoutError } = await supabase
      .from('workout')
      .insert({
        client_id: clientId,
        note: originalWorkout.note,
        date: date.toISOString().split('T')[0],
        status: 'draft'
      })
      .select()
      .single();

    if (createWorkoutError) {
      console.error('Error creating duplicate workout:', createWorkoutError);
      throw createWorkoutError;
    }

    // Duplicate all exercises
    if (originalExercises && originalExercises.length > 0) {
      const exercisesToInsert = originalExercises.map(exercise => ({
        workout_id: newWorkout.id,
        muscle_group_id: exercise.muscle_group_id,
        exercise_name: exercise.exercise_name,
        reps_count: exercise.reps_count,
        reps_unit: exercise.reps_unit,
        weight_count: exercise.weight_count,
        weight_unit: exercise.weight_unit,
        // Keep old fields for compatibility
        reps: exercise.reps_count.toString(),
        unit: exercise.reps_unit,
        count: exercise.weight_count,
        note: exercise.note || '',
        set_count: exercise.set_count,
        completed_sets: 0, // Reset completion status
        is_completed: false
      }));

      const { error: insertExercisesError } = await supabase
        .from('workout_exercise')
        .insert(exercisesToInsert);

      if (insertExercisesError) {
        console.error('Error duplicating exercises:', insertExercisesError);
        throw insertExercisesError;
      }
    }

    return newWorkout as Workout;
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
        reps_count: exercise.reps_count,
        reps_unit: exercise.reps_unit,
        weight_count: exercise.weight_count,
        weight_unit: exercise.weight_unit,
        // Keep old fields for compatibility
        reps: exercise.reps_count.toString(),
        unit: exercise.reps_unit,
        count: exercise.weight_count,
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

  static async completeExerciseSet(exerciseId: string, decrement = false): Promise<WorkoutExercise> {
    const { data: currentExercise, error: fetchError } = await supabase
      .from('workout_exercise')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (fetchError) throw fetchError;

    let newCompletedSets: number;
    
    if (decrement) {
      // Decrement by 1, but don't go below 0
      newCompletedSets = Math.max(0, currentExercise.completed_sets - 1);
    } else {
      // Increment completed sets by 1, or reset to 0 if all sets are completed
      if (currentExercise.completed_sets >= currentExercise.set_count) {
        // All sets completed, reset to 0
        newCompletedSets = 0;
      } else {
        // Increment by 1
        newCompletedSets = currentExercise.completed_sets + 1;
      }
    }
    
    const newIsCompleted = newCompletedSets >= currentExercise.set_count;

    const { data, error } = await supabase
      .from('workout_exercise')
      .update({ 
        completed_sets: newCompletedSets,
        is_completed: newIsCompleted
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

  static async getRecentExercisesForMuscleGroup(clientId: string, muscleGroupId: string, limit = 5): Promise<WorkoutExercise[]> {
    // Get all exercises for this muscle group from all clients
    const { data, error } = await supabase
      .from('workout_exercise')
      .select(`
        *,
        workout!inner(client_id)
      `)
      .eq('muscle_group_id', muscleGroupId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Separate exercises by client and get unique exercises by name
    const currentClientExercises = new Map();
    const otherClientExercises = new Map();
    
    (data || []).forEach(exercise => {
      const exerciseName = exercise.exercise_name;
      
      if (exercise.workout.client_id === clientId) {
        if (!currentClientExercises.has(exerciseName)) {
          currentClientExercises.set(exerciseName, exercise);
        }
      } else {
        if (!otherClientExercises.has(exerciseName) && !currentClientExercises.has(exerciseName)) {
          otherClientExercises.set(exerciseName, exercise);
        }
      }
    });
    
    // Combine with current client exercises first
    const result = [
      ...Array.from(currentClientExercises.values()),
      ...Array.from(otherClientExercises.values())
    ];
    
    return result.slice(0, limit);
  }

  static async deleteExercise(exerciseId: string): Promise<void> {
    const { error } = await supabase
      .from('workout_exercise')
      .delete()
      .eq('id', exerciseId);
    
    if (error) throw error;
  }

  static async updateExercise(exerciseId: string, updates: Partial<CreateWorkoutExerciseInput>): Promise<WorkoutExercise> {
    // Ensure backwards compatibility by updating old fields alongside new ones
    const updateData: any = { ...updates };
    
    if (updates.reps_count !== undefined && updates.reps_unit !== undefined) {
      updateData.reps = updates.reps_count.toString();
      updateData.unit = updates.reps_unit;
    }
    
    if (updates.weight_count !== undefined) {
      updateData.count = updates.weight_count;
    }

    const { data, error } = await supabase
      .from('workout_exercise')
      .update(updateData)
      .eq('id', exerciseId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}