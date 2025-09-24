import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Trainer, 
  Client, 
  MuscleGroup, 
  Workout, 
  WorkoutExercise, 
  CreateWorkoutExerciseInput 
} from '@/types/workout';

interface WorkoutStore {
  // Data
  trainers: Trainer[];
  clients: Client[];
  muscleGroups: MuscleGroup[];
  workouts: Workout[];
  activeWorkout: Workout | null;
  
  // Actions
  addTrainer: (name: string) => void;
  addClient: (name: string, trainerId: string) => void;
  addMuscleGroup: (name: string, isDefault?: boolean) => string;
  createWorkout: (clientId: string, note: string) => string;
  startWorkout: (workoutId: string) => void;
  addExerciseToWorkout: (workoutId: string, exercise: CreateWorkoutExerciseInput) => void;
  completeExerciseSet: (workoutId: string, exerciseId: string) => void;
  completeWorkout: () => void;
  getWorkoutProgress: (workoutId: string) => number;
  getMuscleGroupById: (id: string) => MuscleGroup | undefined;
  getClientById: (id: string) => Client | undefined;
}

// Default muscle groups and sample data
const defaultMuscleGroups: MuscleGroup[] = [
  { id: '1', name: 'Chest', default: true },
  { id: '2', name: 'Back', default: true },
  { id: '3', name: 'Shoulders', default: true },
  { id: '4', name: 'Arms', default: true },
  { id: '5', name: 'Legs', default: true },
  { id: '6', name: 'Core', default: true },
];

const sampleTrainer: Trainer = {
  id: 'trainer-1',
  name: 'Demo Trainer',
};

const sampleClient: Client = {
  id: 'client-1', 
  name: 'Demo Client',
  trainerId: 'trainer-1',
};

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      trainers: [sampleTrainer],
      clients: [sampleClient],
      muscleGroups: defaultMuscleGroups,
      workouts: [],
      activeWorkout: null,

      addTrainer: (name: string) => {
        const trainer: Trainer = {
          id: Date.now().toString(),
          name,
        };
        set((state) => ({ trainers: [...state.trainers, trainer] }));
      },

      addClient: (name: string, trainerId: string) => {
        const client: Client = {
          id: Date.now().toString(),
          name,
          trainerId,
        };
        set((state) => ({ clients: [...state.clients, client] }));
      },

      addMuscleGroup: (name: string, isDefault = false) => {
        const muscleGroup: MuscleGroup = {
          id: Date.now().toString(),
          name,
          default: isDefault,
        };
        set((state) => ({ 
          muscleGroups: [...state.muscleGroups, muscleGroup] 
        }));
        return muscleGroup.id;
      },

      createWorkout: (clientId: string, note: string) => {
        const workout: Workout = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          note,
          clientId,
          exercises: [],
        };
        set((state) => ({ workouts: [...state.workouts, workout] }));
        return workout.id;
      },

      startWorkout: (workoutId: string) => {
        const workout = get().workouts.find(w => w.id === workoutId);
        if (workout) {
          set({ activeWorkout: { ...workout, isActive: true } });
        }
      },

      addExerciseToWorkout: (workoutId: string, exercise: CreateWorkoutExerciseInput) => {
        const workoutExercise: WorkoutExercise = {
          id: Date.now().toString(),
          workoutId,
          muscleGroupId: exercise.muscleGroupId,
          muscleGroupName: exercise.muscleGroupName,
          exerciseName: exercise.exerciseName,
          reps: exercise.reps,
          unit: exercise.unit,
          count: exercise.count,
          note: exercise.note || '',
          setCount: exercise.setCount,
          completedSets: 0,
          isCompleted: false,
        };

        set((state) => ({
          workouts: state.workouts.map(workout =>
            workout.id === workoutId
              ? { ...workout, exercises: [...workout.exercises, workoutExercise] }
              : workout
          ),
          activeWorkout: state.activeWorkout?.id === workoutId
            ? { ...state.activeWorkout, exercises: [...state.activeWorkout.exercises, workoutExercise] }
            : state.activeWorkout
        }));
      },

      completeExerciseSet: (workoutId: string, exerciseId: string) => {
        set((state) => {
          const updateExercise = (exercise: WorkoutExercise) => {
            if (exercise.id === exerciseId) {
              const newCompletedSets = Math.min(exercise.completedSets + 1, exercise.setCount);
              return {
                ...exercise,
                completedSets: newCompletedSets,
                isCompleted: newCompletedSets >= exercise.setCount
              };
            }
            return exercise;
          };

          return {
            workouts: state.workouts.map(workout =>
              workout.id === workoutId
                ? { ...workout, exercises: workout.exercises.map(updateExercise) }
                : workout
            ),
            activeWorkout: state.activeWorkout?.id === workoutId
              ? { ...state.activeWorkout, exercises: state.activeWorkout.exercises.map(updateExercise) }
              : state.activeWorkout
          };
        });
      },

      completeWorkout: () => {
        set({ activeWorkout: null });
      },

      getWorkoutProgress: (workoutId: string) => {
        const workout = get().workouts.find(w => w.id === workoutId) || get().activeWorkout;
        if (!workout || workout.exercises.length === 0) return 0;
        
        const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.setCount, 0);
        const completedSets = workout.exercises.reduce((sum, ex) => sum + ex.completedSets, 0);
        
        return Math.round((completedSets / totalSets) * 100);
      },

      getMuscleGroupById: (id: string) => {
        return get().muscleGroups.find(mg => mg.id === id);
      },

      getClientById: (id: string) => {
        return get().clients.find(c => c.id === id);
      },
    }),
    {
      name: 'workout-storage',
    }
  )
);