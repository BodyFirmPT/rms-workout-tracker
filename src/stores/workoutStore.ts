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
  workoutExercises: { [workoutId: string]: WorkoutExercise[] };
  
  // Loading states
  loading: boolean;
  
  // Actions
  loadData: () => Promise<void>;
  addTrainer: (name: string) => Promise<void>;
  addClient: (name: string, trainerId: string) => Promise<void>;
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
  loadWorkoutExercises: (workoutId: string) => Promise<void>;
  deleteExercise: (workoutId: string, exerciseId: string) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  updateWorkout: (id: string, updates: Partial<{ note: string; date: string }>) => Promise<void>;
  updateExercise: (workoutId: string, exerciseId: string, updates: Partial<CreateWorkoutExerciseInput>) => Promise<void>;
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
    try {
      const updatedExercise = await WorkoutService.completeExerciseSet(exerciseId, decrement);
      set((state) => ({
        workoutExercises: {
          ...state.workoutExercises,
          [workoutId]: (state.workoutExercises[workoutId] || []).map(ex =>
            ex.id === exerciseId ? updatedExercise : ex
          )
        }
      }));

      // Check if all exercises are now completed and auto-complete workout
      const currentExercises = get().workoutExercises[workoutId] || [];
      const updatedExercises = currentExercises.map(ex => 
        ex.id === exerciseId ? updatedExercise : ex
      );
      
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

  getStartedWorkout: () => {
    return get().workouts.find(w => w.status === 'started');
  },
}));