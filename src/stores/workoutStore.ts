import { create } from 'zustand';
import { 
  Trainer, 
  Client, 
  MuscleGroup, 
  Workout, 
  WorkoutExercise, 
  CreateWorkoutExerciseInput 
} from '@/types/workout';
import { WorkoutService } from '@/services/workoutService';
import { toast } from '@/hooks/use-toast';

interface WorkoutStore {
  // Data
  trainers: Trainer[];
  clients: Client[];
  muscleGroups: MuscleGroup[];
  workouts: Workout[];
  workoutExercises: { [workoutId: string]: WorkoutExercise[] };
  
  // Loading states
  loading: boolean;
  
  // Actions
  loadData: () => Promise<void>;
  addTrainer: (name: string) => Promise<void>;
  addClient: (name: string, trainerId: string) => Promise<void>;
  updateClient: (id: string, updates: Partial<{ name: string; trainer_id: string; workout_count_offset: number }>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addMuscleGroup: (name: string, isDefault?: boolean, category?: string) => Promise<string>;
  updateMuscleGroup: (id: string, updates: Partial<{ name: string; default_group: boolean; category: string }>) => Promise<void>;
  deleteMuscleGroup: (id: string) => Promise<void>;
  createWorkout: (clientId: string, note: string, date?: string) => Promise<string>;
  startWorkout: (workoutId: string) => Promise<void>;
  addExerciseToWorkout: (workoutId: string, exercise: CreateWorkoutExerciseInput) => Promise<void>;
  completeExerciseSet: (workoutId: string, exerciseId: string, decrement?: boolean) => Promise<void>;
  completeWorkout: (workoutId: string) => Promise<void>;
  duplicateWorkout: (workoutId: string, clientId: string, date: Date) => Promise<Workout>;
  getWorkoutProgress: (workoutId: string) => Promise<number>;
  getMuscleGroupById: (id: string) => MuscleGroup | undefined;
  getClientById: (id: string) => Client | undefined;
  getClientExerciseHistory: (clientId: string, muscleGroupId?: string) => Promise<WorkoutExercise[]>;
  getUniqueExercisesForClient: (clientId: string, muscleGroupId: string) => Promise<WorkoutExercise[]>;
  getRecentExercisesForMuscleGroup: (clientId: string, muscleGroupId: string, limit?: number, offset?: number, allClients?: boolean) => Promise<Array<WorkoutExercise & { workout_date?: string }>>;
  loadWorkoutExercises: (workoutId: string) => Promise<void>;
  deleteExercise: (workoutId: string, exerciseId: string) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  updateWorkout: (id: string, updates: Partial<{ note: string; date: string }>) => Promise<void>;
  updateExercise: (workoutId: string, exerciseId: string, updates: Partial<CreateWorkoutExerciseInput>) => Promise<void>;
  copyExercisesToWorkout: (sourceWorkoutId: string, targetWorkoutId: string, muscleGroupId: string) => Promise<void>;
  copyExercisesByCategoryToWorkout: (sourceWorkoutId: string, targetWorkoutId: string, categoryName: string) => Promise<void>;
  getStartedWorkout: () => Workout | undefined;
}

export const useWorkoutStore = create<WorkoutStore>()((set, get) => ({
  trainers: [],
  clients: [],
  muscleGroups: [],
  workouts: [],
  workoutExercises: {},
  loading: false,

  loadData: async () => {
    set({ loading: true });
    try {
      const [trainers, clients, muscleGroups, workouts] = await Promise.all([
        WorkoutService.getTrainers(),
        WorkoutService.getClients(),
        WorkoutService.getMuscleGroups(),
        WorkoutService.getWorkouts()
      ]);

      set({ 
        trainers, 
        clients, 
        muscleGroups, 
        workouts,
        loading: false 
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      set({ loading: false });
    }
  },

  addTrainer: async (name: string) => {
    try {
      const trainer = await WorkoutService.addTrainer(name);
      set((state) => ({ trainers: [...state.trainers, trainer] }));
    } catch (error) {
      console.error('Failed to add trainer:', error);
    }
  },

  addClient: async (name: string, trainerId: string) => {
    try {
      const client = await WorkoutService.addClient(name, trainerId);
      set((state) => ({ clients: [...state.clients, client] }));
    } catch (error) {
      console.error('Failed to add client:', error);
    }
  },

  updateClient: async (id: string, updates: Partial<{ name: string; trainer_id: string; workout_count_offset: number }>) => {
    try {
      const updatedClient = await WorkoutService.updateClient(id, updates);
      set((state) => ({
        clients: state.clients.map(c => 
          c.id === id ? updatedClient : c
        )
      }));
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  },

  deleteClient: async (id: string) => {
    try {
      await WorkoutService.deleteClient(id);
      set((state) => ({
        clients: state.clients.filter(c => c.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  },

  addMuscleGroup: async (name: string, isDefault = false, category?: string) => {
    try {
      const muscleGroup = await WorkoutService.addMuscleGroup(name, isDefault, category);
      set((state) => ({ 
        muscleGroups: [...state.muscleGroups, muscleGroup] 
      }));
      return muscleGroup.id;
    } catch (error) {
      console.error('Failed to add muscle group:', error);
      return '';
    }
  },

  updateMuscleGroup: async (id: string, updates: Partial<{ name: string; default_group: boolean }>) => {
    try {
      const updatedMuscleGroup = await WorkoutService.updateMuscleGroup(id, updates);
      set((state) => ({
        muscleGroups: state.muscleGroups.map(mg => 
          mg.id === id ? updatedMuscleGroup : mg
        )
      }));
    } catch (error) {
      console.error('Failed to update muscle group:', error);
    }
  },

  deleteMuscleGroup: async (id: string) => {
    try {
      await WorkoutService.deleteMuscleGroup(id);
      set((state) => ({
        muscleGroups: state.muscleGroups.filter(mg => mg.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete muscle group:', error);
    }
  },

  createWorkout: async (clientId: string, note: string, date?: string) => {
    try {
      const workout = await WorkoutService.createWorkout(clientId, note, date);
      set((state) => ({ workouts: [...state.workouts, workout] }));
      return workout.id;
    } catch (error) {
      console.error('Failed to create workout:', error);
      return '';
    }
  },

  startWorkout: async (workoutId: string) => {
    try {
      await WorkoutService.startWorkout(workoutId);
      // Update the workout status in the local state
      set((state) => ({
        workouts: state.workouts.map(w =>
          w.id === workoutId ? { ...w, status: 'started' as const } : w
        )
      }));
    } catch (error) {
      console.error('Failed to start workout:', error);
    }
  },

  loadWorkoutExercises: async (workoutId: string) => {
    try {
      const exercises = await WorkoutService.getWorkoutExercises(workoutId);
      set((state) => ({
        workoutExercises: {
          ...state.workoutExercises,
          [workoutId]: exercises
        }
      }));
    } catch (error) {
      console.error('Failed to load workout exercises:', error);
    }
  },

  addExerciseToWorkout: async (workoutId: string, exercise: CreateWorkoutExerciseInput) => {
    try {
      const workoutExercise = await WorkoutService.addExerciseToWorkout(workoutId, exercise);
      set((state) => ({
        workoutExercises: {
          ...state.workoutExercises,
          [workoutId]: [...(state.workoutExercises[workoutId] || []), workoutExercise]
        }
      }));
    } catch (error) {
      console.error('Failed to add exercise to workout:', error);
    }
  },

  completeExerciseSet: async (workoutId: string, exerciseId: string, decrement = false) => {
    // Get the current exercise state before optimistic update
    const currentExercises = get().workoutExercises[workoutId] || [];
    const currentExercise = currentExercises.find(ex => ex.id === exerciseId);
    
    if (!currentExercise) return;

    // Optimistically update the UI
    const optimisticExercise = {
      ...currentExercise,
      completed_sets: decrement 
        ? Math.max(0, currentExercise.completed_sets - 1)
        : Math.min(currentExercise.set_count, currentExercise.completed_sets + 1),
      is_completed: !decrement && currentExercise.completed_sets + 1 >= currentExercise.set_count
    };

    set((state) => ({
      workoutExercises: {
        ...state.workoutExercises,
        [workoutId]: currentExercises.map(ex =>
          ex.id === exerciseId ? optimisticExercise : ex
        )
      }
    }));

    try {
      // Make the actual API call
      const updatedExercise = await WorkoutService.completeExerciseSet(exerciseId, decrement);
      
      // Update with the actual response from the server
      set((state) => ({
        workoutExercises: {
          ...state.workoutExercises,
          [workoutId]: (state.workoutExercises[workoutId] || []).map(ex =>
            ex.id === exerciseId ? updatedExercise : ex
          )
        }
      }));

      // Check if all exercises are now completed and auto-complete workout
      const updatedExercises = get().workoutExercises[workoutId] || [];
      const allExercisesCompleted = updatedExercises.length > 0 && 
        updatedExercises.every(ex => ex.completed_sets >= ex.set_count);
      
      if (allExercisesCompleted) {
        const workout = get().workouts.find(w => w.id === workoutId);
        if (workout && workout.status !== 'completed') {
          await get().completeWorkout(workoutId);
        }
      }
    } catch (error) {
      console.error('Failed to complete exercise set:', error);
      
      // Revert to the original state on error
      set((state) => ({
        workoutExercises: {
          ...state.workoutExercises,
          [workoutId]: currentExercises
        }
      }));
      
      toast({
        title: "Error",
        description: "Failed to update exercise set. Please try again.",
        variant: "destructive",
      });
    }
  },

  completeWorkout: async (workoutId: string) => {
    try {
      await WorkoutService.completeWorkout(workoutId);
      // Update the workout status in the local state
      set((state) => ({
        workouts: state.workouts.map(w =>
          w.id === workoutId ? { ...w, status: 'completed' as const } : w
        )
      }));
    } catch (error) {
      console.error('Failed to complete workout:', error);
    }
  },

  duplicateWorkout: async (workoutId: string, clientId: string, date: Date) => {
    try {
      const newWorkout = await WorkoutService.duplicateWorkout(workoutId, clientId, date);
      set((state) => ({
        workouts: [...state.workouts, newWorkout]
      }));
      return newWorkout;
    } catch (error) {
      console.error('Error duplicating workout:', error);
      throw error;
    }
  },

  getWorkoutProgress: async (workoutId: string) => {
    try {
      return await WorkoutService.getWorkoutProgress(workoutId);
    } catch (error) {
      console.error('Failed to get workout progress:', error);
      return 0;
    }
  },

  getMuscleGroupById: (id: string) => {
    return get().muscleGroups.find(mg => mg.id === id);
  },

  getClientById: (id: string) => {
    return get().clients.find(c => c.id === id);
  },
  
  getClientExerciseHistory: async (clientId: string, muscleGroupId?: string) => {
    try {
      return await WorkoutService.getClientExerciseHistory(clientId, muscleGroupId);
    } catch (error) {
      console.error('Failed to get client exercise history:', error);
      return [];
    }
  },

  getUniqueExercisesForClient: async (clientId: string, muscleGroupId: string) => {
    try {
      return await WorkoutService.getUniqueExercisesForClient(clientId, muscleGroupId);
    } catch (error) {
      console.error('Failed to get unique exercises for client:', error);
      return [];
    }
  },

  getRecentExercisesForMuscleGroup: async (clientId: string, muscleGroupId: string, limit = 5, offset = 0, allClients = false) => {
    try {
      return await WorkoutService.getRecentExercisesForMuscleGroup(clientId, muscleGroupId, limit, offset, allClients);
    } catch (error) {
      console.error('Failed to get recent exercises for muscle group:', error);
      return [];
    }
  },

  updateWorkout: async (id: string, updates: Partial<{ note: string; date: string }>) => {
    try {
      const updatedWorkout = await WorkoutService.updateWorkout(id, updates);
      set((state) => ({
        workouts: state.workouts.map(w => 
          w.id === id ? updatedWorkout : w
        )
      }));
    } catch (error) {
      console.error('Failed to update workout:', error);
    }
  },

  deleteWorkout: async (id: string) => {
    try {
      await WorkoutService.deleteWorkout(id);
      set((state) => ({
        workouts: state.workouts.filter(w => w.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete workout:', error);
    }
  },

  deleteExercise: async (workoutId: string, exerciseId: string) => {
    try {
      await WorkoutService.deleteExercise(exerciseId);
      set((state) => ({
        workoutExercises: {
          ...state.workoutExercises,
          [workoutId]: (state.workoutExercises[workoutId] || []).filter(ex => ex.id !== exerciseId)
        }
      }));
    } catch (error) {
      console.error('Failed to delete exercise:', error);
    }
  },

  updateExercise: async (workoutId: string, exerciseId: string, updates: Partial<CreateWorkoutExerciseInput>) => {
    try {
      const updatedExercise = await WorkoutService.updateExercise(exerciseId, updates);
      set((state) => ({
        workoutExercises: {
          ...state.workoutExercises,
          [workoutId]: (state.workoutExercises[workoutId] || []).map(ex =>
            ex.id === exerciseId ? updatedExercise : ex
          )
        }
      }));
    } catch (error) {
      console.error('Failed to update exercise:', error);
    }
  },

  copyExercisesToWorkout: async (sourceWorkoutId: string, targetWorkoutId: string, muscleGroupId: string) => {
    try {
      await WorkoutService.copyExercisesToWorkout(sourceWorkoutId, targetWorkoutId, muscleGroupId);
      // Reload exercises for the target workout
      await get().loadWorkoutExercises(targetWorkoutId);
    } catch (error) {
      console.error('Failed to copy exercises:', error);
      throw error;
    }
  },

  copyExercisesByCategoryToWorkout: async (sourceWorkoutId: string, targetWorkoutId: string, categoryName: string) => {
    try {
      await WorkoutService.copyExercisesByCategoryToWorkout(sourceWorkoutId, targetWorkoutId, categoryName);
      // Reload exercises for the target workout
      await get().loadWorkoutExercises(targetWorkoutId);
    } catch (error) {
      console.error('Failed to copy exercises by category:', error);
      throw error;
    }
  },

  getStartedWorkout: () => {
    return get().workouts.find(w => w.status === 'started');
  },
}));