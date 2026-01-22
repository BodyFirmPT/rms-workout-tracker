import { useState, useEffect, useCallback } from 'react';
import { MuscleGroup, Workout, WorkoutExercise } from '@/types/workout';

interface Location {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
}

interface SharedWorkoutData {
  workout: Workout & { client?: Client };
  exercises: WorkoutExercise[];
  muscleGroups: MuscleGroup[];
  location: Location | null;
}

const SUPABASE_URL = "https://okrdjdagbbwdmdubyppx.supabase.co";

export function useSharedWorkout(shareToken: string | undefined) {
  const [data, setData] = useState<SharedWorkoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkout = useCallback(async () => {
    if (!shareToken) {
      setError('No share token provided');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/shared-workout?action=get-workout&token=${shareToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch workout');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workout');
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    fetchWorkout();
  }, [fetchWorkout]);

  // Auto-refresh every 30 seconds when workout is in progress
  useEffect(() => {
    if (data?.workout?.status === 'started') {
      const interval = setInterval(fetchWorkout, 30000);
      return () => clearInterval(interval);
    }
  }, [data?.workout?.status, fetchWorkout]);

  const startWorkout = useCallback(async () => {
    if (!shareToken) return;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/shared-workout?action=start-workout&token=${shareToken}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start workout');
      }

      // Refetch workout data
      await fetchWorkout();
    } catch (err) {
      throw err;
    }
  }, [shareToken, fetchWorkout]);

  const completeSet = useCallback(async (exerciseId: string, decrement = false) => {
    if (!shareToken || !data) return;

    // Optimistic update
    setData(prev => {
      if (!prev) return prev;
      
      const updatedExercises = prev.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        
        let newCompletedSets: number;
        if (decrement) {
          newCompletedSets = Math.max(0, ex.completed_sets - 1);
        } else {
          if (ex.completed_sets >= ex.set_count) {
            newCompletedSets = 0;
          } else {
            newCompletedSets = ex.completed_sets + 1;
          }
        }
        
        return {
          ...ex,
          completed_sets: newCompletedSets,
          is_completed: newCompletedSets >= ex.set_count
        };
      });

      return { ...prev, exercises: updatedExercises };
    });

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/shared-workout?action=complete-set&token=${shareToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exerciseId, decrement })
        }
      );

      if (!response.ok) {
        // Revert on failure
        await fetchWorkout();
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete set');
      }
    } catch (err) {
      // Revert on error
      await fetchWorkout();
      throw err;
    }
  }, [shareToken, data, fetchWorkout]);

  const completeWorkout = useCallback(async () => {
    if (!shareToken) return;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/shared-workout?action=complete-workout&token=${shareToken}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete workout');
      }

      // Refetch workout data
      await fetchWorkout();
    } catch (err) {
      throw err;
    }
  }, [shareToken, fetchWorkout]);

  const getWorkoutProgress = useCallback(() => {
    if (!data?.exercises?.length) return 0;
    
    const totalSets = data.exercises.reduce((sum, ex) => sum + ex.set_count, 0);
    const completedSets = data.exercises.reduce((sum, ex) => sum + ex.completed_sets, 0);
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  }, [data?.exercises]);

  const getMuscleGroupById = useCallback((id: string) => {
    return data?.muscleGroups?.find(mg => mg.id === id) || null;
  }, [data?.muscleGroups]);

  return {
    workout: data?.workout || null,
    exercises: data?.exercises || [],
    muscleGroups: data?.muscleGroups || [],
    location: data?.location || null,
    loading,
    error,
    startWorkout,
    completeSet,
    completeWorkout,
    getWorkoutProgress,
    getMuscleGroupById,
    refetch: fetchWorkout
  };
}
