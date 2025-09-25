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

interface WorkoutStore {
  // Data
  trainers: Trainer[];
  clients: Client[];
  muscleGroups: MuscleGroup[];
  workouts: Workout[];
  activeWorkout: Workout | null;
  workoutExercises: { [workoutId: string]: WorkoutExercise[] };
  
  // Loading states
  loading: boolean;
  
  // Actions
  loadData: () => Promise<void>;
  addTrainer: (name: string) => Promise<void>;
  addClient: (name: string, trainerId: string) => Promise<void>;
  addMuscleGroup: (name: string, isDefault?: boolean) => Promise<string>;
  createWorkout: (clientId: string, note: string, date?: string) => Promise<string>;
  startWorkout: (workoutId: string) => Promise<void>;
  addExerciseToWorkout: (workoutId: string, exercise: CreateWorkoutExerciseInput) => Promise<void>;
  completeExerciseSet: (workoutId: string, exerciseId: string) => Promise<void>;
  completeWorkout: () => Promise<void>;
  getWorkoutProgress: (workoutId: string) => Promise<number>;
  getMuscleGroupById: (id: string) => MuscleGroup | undefined;
  getClientById: (id: string) => Client | undefined;
  getClientExerciseHistory: (clientId: string, muscleGroupId?: string) => Promise<WorkoutExercise[]>;
  getUniqueExercisesForClient: (clientId: string, muscleGroupId: string) => Promise<WorkoutExercise[]>;
  loadWorkoutExercises: (workoutId: string) => Promise<void>;
  deleteExercise: (workoutId: string, exerciseId: string) => Promise<void>;
  updateExercise: (workoutId: string, exerciseId: string, updates: Partial<CreateWorkoutExerciseInput>) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>()((set, get) => ({
  trainers: [],
  clients: [],
  muscleGroups: [],
  workouts: [],
  activeWorkout: null,
  workoutExercises: {},
  loading: false,

  loadData: async () => {
    set({ loading: true });
    try {
      const [trainers, clients, muscleGroups, workouts, activeWorkout] = await Promise.all([
        WorkoutService.getTrainers(),
        WorkoutService.getClients(),
        WorkoutService.getMuscleGroups(),
        WorkoutService.getWorkouts(),
        WorkoutService.getActiveWorkout()
      ]);

      set({ 
        trainers, 
        clients, 
        muscleGroups, 
        workouts, 
        activeWorkout,
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

  addMuscleGroup: async (name: string, isDefault = false) => {
    try {
      const muscleGroup = await WorkoutService.addMuscleGroup(name, isDefault);
      set((state) => ({ 
        muscleGroups: [...state.muscleGroups, muscleGroup] 
      }));
      return muscleGroup.id;
    } catch (error) {
      console.error('Failed to add muscle group:', error);
      return '';
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
      const activeWorkout = await WorkoutService.getActiveWorkout();
      set({ activeWorkout });
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

  completeExerciseSet: async (workoutId: string, exerciseId: string) => {
    try {
      const updatedExercise = await WorkoutService.completeExerciseSet(exerciseId);
      set((state) => ({
        workoutExercises: {
          ...state.workoutExercises,
          [workoutId]: (state.workoutExercises[workoutId] || []).map(ex =>
            ex.id === exerciseId ? updatedExercise : ex
          )
        }
      }));
    } catch (error) {
      console.error('Failed to complete exercise set:', error);
    }
  },

  completeWorkout: async () => {
    try {
      const activeWorkout = get().activeWorkout;
      if (activeWorkout) {
        await WorkoutService.completeWorkout(activeWorkout.id);
        set({ activeWorkout: null });
      }
    } catch (error) {
      console.error('Failed to complete workout:', error);
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
}));