import { supabase } from "@/integrations/supabase/client";
import { 
  Trainer, 
  Client, 
  MuscleGroup, 
  Workout, 
  WorkoutExercise, 
  CreateWorkoutExerciseInput,
  WorkoutUpdateInput
} from '@/types/workout';

// Helper to get emulated user's trainer_id from localStorage
const getEmulatedTrainerId = (): string | null => {
  try {
    const emulatedData = localStorage.getItem('emulated_user');
    if (emulatedData) {
      const parsed = JSON.parse(emulatedData);
      return parsed?.trainer_id || null;
    }
  } catch (e) {
    console.error('Error parsing emulated user data:', e);
  }
  return null;
};

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
    let query = supabase
      .from('client')
      .select('*')
      .order('name');

    // Filter by emulated trainer if in emulation mode
    const emulatedTrainerId = getEmulatedTrainerId();
    if (emulatedTrainerId) {
      query = query.eq('trainer_id', emulatedTrainerId);
    }

    const { data, error } = await query;
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

  static async updateClient(id: string, updates: Partial<{ name: string; trainer_id: string; workout_count_offset: number }>): Promise<Client> {
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

  static async updateWorkout(id: string, updates: WorkoutUpdateInput): Promise<Workout> {
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
      .select(`
        *,
        client:client_id (
          id,
          name,
          trainer_id
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    let workouts = (data || []).map(workout => ({
      ...workout,
      client: Array.isArray(workout.client) ? workout.client[0] : workout.client
    })) as Workout[];

    // Filter by emulated trainer if in emulation mode
    const emulatedTrainerId = getEmulatedTrainerId();
    if (emulatedTrainerId) {
      workouts = workouts.filter(w => (w as any).client?.trainer_id === emulatedTrainerId);
    }

    return workouts;
  }

  static async createWorkout(clientId: string, note: string, date?: string, locationId?: string | null, selfLed?: boolean): Promise<Workout> {
    const { data, error } = await supabase
      .from('workout')
      .insert({ 
        client_id: clientId, 
        note,
        date: date || new Date().toISOString().split('T')[0],
        location_id: locationId,
        self_led: selfLed || false,
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

  static async duplicateWorkout(workoutId: string, clientId: string, date: Date, selfLed?: boolean) {
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

    // Build note with reference to original workout date
    const originalDate = new Date(originalWorkout.date);
    const formattedOriginalDate = originalDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const copiedFromNote = `Copied from ${formattedOriginalDate}`;
    const newNote = originalWorkout.note 
      ? `${copiedFromNote}\n\n${originalWorkout.note}`
      : copiedFromNote;

    // Create the new workout as draft
    const { data: newWorkout, error: createWorkoutError } = await supabase
      .from('workout')
      .insert({
        client_id: clientId,
        note: newNote,
        date: date.toISOString().split('T')[0],
        self_led: selfLed !== undefined ? selfLed : (originalWorkout.self_led || false),
        parent_workout_id: workoutId,
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
        type: exercise.type || 'exercise',
        reps_count: exercise.reps_count,
        reps_unit: exercise.reps_unit,
        weight_count: exercise.weight_count,
        weight_unit: exercise.weight_unit,
        left_weight: exercise.left_weight,
        band_color: exercise.band_color,
        band_type: exercise.band_type,
        image_url: exercise.image_url,
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
    return (data || []) as WorkoutExercise[];
  }

  static async addExerciseToWorkout(workoutId: string, exercise: CreateWorkoutExerciseInput): Promise<WorkoutExercise> {
    const { data, error } = await supabase
      .from('workout_exercise')
      .insert({
        workout_id: workoutId,
        muscle_group_id: exercise.muscle_group_id,
        exercise_name: exercise.exercise_name,
        type: exercise.type || 'exercise',
        reps_count: exercise.reps_count,
        reps_unit: exercise.reps_unit,
        weight_count: exercise.weight_count,
        weight_unit: exercise.weight_unit,
        left_weight: exercise.left_weight,
        band_color: exercise.band_color,
        band_type: exercise.band_type,
        image_url: exercise.image_url,
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
    return data as WorkoutExercise;
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
    return data as WorkoutExercise;
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
    return (data || []) as WorkoutExercise[];
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

  static async getRecentExercisesForMuscleGroup(
    clientId: string, 
    muscleGroupId: string, 
    limit = 5, 
    offset = 0,
    allClients = false
  ): Promise<Array<WorkoutExercise & { workout_date?: string; client_name?: string; exercise_client_id?: string }>> {
    // Build query to get exercises with workout dates and client info
    const { data, error } = await supabase
      .from('workout_exercise')
      .select(`
        *,
        workout!inner(client_id, date, client!inner(name))
      `)
      .eq('muscle_group_id', muscleGroupId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Separate exercises by client and get unique exercises by name
    const currentClientExercises = new Map<string, WorkoutExercise & { workout_date?: string; client_name?: string; exercise_client_id?: string }>();
    const otherClientExercises = new Map<string, WorkoutExercise & { workout_date?: string; client_name?: string; exercise_client_id?: string }>();
    
    (data || []).forEach((exercise: any) => {
      const exerciseName = exercise.exercise_name;
      const exerciseWithDate = {
        ...exercise,
        workout_date: exercise.workout?.date,
        client_name: exercise.workout?.client?.name,
        exercise_client_id: exercise.workout?.client_id
      };
      
      if (exercise.workout.client_id === clientId) {
        if (!currentClientExercises.has(exerciseName)) {
          currentClientExercises.set(exerciseName, exerciseWithDate);
        }
      } else {
        if (!otherClientExercises.has(exerciseName) && !currentClientExercises.has(exerciseName)) {
          otherClientExercises.set(exerciseName, exerciseWithDate);
        }
      }
    });
    
    // Filter based on allClients parameter
    let result: Array<WorkoutExercise & { workout_date?: string; client_name?: string; exercise_client_id?: string }>;
    if (allClients) {
      // Show all: current client exercises first, then others
      result = [
        ...Array.from(currentClientExercises.values()),
        ...Array.from(otherClientExercises.values())
      ];
    } else {
      // Show only current client exercises
      result = Array.from(currentClientExercises.values());
    }
    
    // Apply pagination
    return result.slice(offset, offset + limit);
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
    return data as WorkoutExercise;
  }

  static async copyExercisesToWorkout(sourceWorkoutId: string, targetWorkoutId: string, muscleGroupId: string): Promise<void> {
    // Get exercises from source workout for the specified muscle group
    const { data: exercises, error: fetchError } = await supabase
      .from('workout_exercise')
      .select('*')
      .eq('workout_id', sourceWorkoutId)
      .eq('muscle_group_id', muscleGroupId);

    if (fetchError) throw fetchError;

    if (!exercises || exercises.length === 0) {
      return;
    }

    // Copy exercises to target workout
    const exercisesToInsert = exercises.map(exercise => ({
      workout_id: targetWorkoutId,
      muscle_group_id: exercise.muscle_group_id,
      exercise_name: exercise.exercise_name,
      type: exercise.type || 'exercise',
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
    }));

    const { error: insertError } = await supabase
      .from('workout_exercise')
      .insert(exercisesToInsert);

    if (insertError) throw insertError;
  }

  static async copyExercisesByCategoryToWorkout(sourceWorkoutId: string, targetWorkoutId: string, categoryName: string): Promise<void> {
    // Get all muscle groups in this category
    const { data: muscleGroups, error: mgError } = await supabase
      .from('muscle_group')
      .select('id')
      .eq('category', categoryName);

    if (mgError) throw mgError;

    if (!muscleGroups || muscleGroups.length === 0) {
      return;
    }

    const muscleGroupIds = muscleGroups.map(mg => mg.id);

    // Get exercises from source workout for all muscle groups in this category
    const { data: exercises, error: fetchError } = await supabase
      .from('workout_exercise')
      .select('*')
      .eq('workout_id', sourceWorkoutId)
      .in('muscle_group_id', muscleGroupIds);

    if (fetchError) throw fetchError;

    if (!exercises || exercises.length === 0) {
      return;
    }

    // Copy exercises to target workout
    const exercisesToInsert = exercises.map(exercise => ({
      workout_id: targetWorkoutId,
      muscle_group_id: exercise.muscle_group_id,
      exercise_name: exercise.exercise_name,
      type: exercise.type || 'exercise',
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
    }));

    const { error: insertError } = await supabase
      .from('workout_exercise')
      .insert(exercisesToInsert);

    if (insertError) throw insertError;
  }
}