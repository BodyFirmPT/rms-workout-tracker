import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { UnifiedExerciseCard } from "@/components/ui/unified-exercise-card";
import { useWorkoutStore } from "@/stores/workoutStore";
import { MuscleGroup, WorkoutExercise } from "@/types/workout";
interface MuscleGroupSuggestionsProps {
  muscleGroup: MuscleGroup;
  clientId: string;
  workoutId: string;
  hasExistingExercises: boolean;
  disabled?: boolean;
  onExerciseAdded?: () => void;
}
export function MuscleGroupSuggestions({
  muscleGroup,
  clientId,
  workoutId,
  hasExistingExercises,
  disabled = false,
  onExerciseAdded
}: MuscleGroupSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    getRecentExercisesForMuscleGroup,
    addExerciseToWorkout
  } = useWorkoutStore();
  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true);
      try {
        const exercises = await getRecentExercisesForMuscleGroup(clientId, muscleGroup.id, 5);
        setSuggestions(exercises);
      } catch (error) {
        console.error('Failed to load exercise suggestions:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSuggestions();
  }, [clientId, muscleGroup.id, getRecentExercisesForMuscleGroup]);
  const handleCopyExercise = async (exercise: WorkoutExercise) => {
    if (!disabled) {
      await addExerciseToWorkout(workoutId, {
        muscle_group_id: exercise.muscle_group_id,
        exercise_name: exercise.exercise_name,
        type: exercise.type || 'exercise',
        reps_count: exercise.reps_count || 1,
        reps_unit: exercise.reps_unit || "reps",
        weight_count: exercise.weight_count || 0,
        weight_unit: exercise.weight_unit || "lbs",
        left_weight: exercise.left_weight,
        set_count: exercise.set_count,
        note: exercise.note || ''
      });
      // Call the callback to close the dialog if provided
      onExerciseAdded?.();
    }
  };
  return (
    <>
      {suggestions.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/10 border-b border-border/30">
            <History className="h-2.5 w-2.5 inline mr-1" />
            Recent exercises:
          </div>
          
          <div>
            {suggestions.map((exercise, index) => (
              <UnifiedExerciseCard 
                key={index} 
                exerciseName={exercise.exercise_name} 
                repsCount={exercise.reps_count || 1} 
                repsUnit={exercise.reps_unit || "reps"} 
                weightCount={exercise.weight_count || 0} 
                weightUnit={exercise.weight_unit || "lbs"} 
                leftWeight={exercise.left_weight}
                setCount={exercise.set_count} 
                note={exercise.note || undefined}
                type={exercise.type || 'exercise'}
                variant="suggested" 
                onAdd={() => handleCopyExercise(exercise)} 
                disabled={disabled} 
              />
            ))}
          </div>
        </div>
      )}
      
      {!loading && suggestions.length === 0 && !hasExistingExercises && (
        <div className="text-xs text-muted-foreground text-center py-3 px-3">
          No previous exercises for this muscle group
        </div>
      )}
    </>
  );
}