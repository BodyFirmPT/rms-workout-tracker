import { useState, useEffect } from "react";
import { Plus, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedExerciseCard } from "@/components/ui/unified-exercise-card";
import { useWorkoutStore } from "@/stores/workoutStore";
import { MuscleGroup, WorkoutExercise } from "@/types/workout";
interface MuscleGroupSuggestionsProps {
  muscleGroup: MuscleGroup;
  clientId: string;
  workoutId: string;
  hasExistingExercises: boolean;
  onAddExercise: () => void;
  disabled?: boolean;
}
export function MuscleGroupSuggestions({
  muscleGroup,
  clientId,
  workoutId,
  hasExistingExercises,
  onAddExercise,
  disabled = false
}: MuscleGroupSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    getUniqueExercisesForClient,
    addExerciseToWorkout
  } = useWorkoutStore();
  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true);
      try {
        const exercises = await getUniqueExercisesForClient(clientId, muscleGroup.id);
        setSuggestions(exercises);
      } catch (error) {
        console.error('Failed to load exercise suggestions:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSuggestions();
  }, [clientId, muscleGroup.id, getUniqueExercisesForClient]);
  const handleCopyExercise = async (exercise: WorkoutExercise) => {
    if (!disabled) {
      await addExerciseToWorkout(workoutId, {
        muscle_group_id: exercise.muscle_group_id,
        exercise_name: exercise.exercise_name,
        reps_count: exercise.reps_count || 1,
        reps_unit: exercise.reps_unit || "reps",
        weight_count: exercise.weight_count || 0,
        weight_unit: exercise.weight_unit || "lbs",
        set_count: exercise.set_count,
        note: exercise.note || ''
      });
    }
  };
  return <div className="space-y-0">
      {/* Muscle group header - compact */}
      <div className="flex items-center justify-between py-2 px-3 bg-muted/30 border-b border-border rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">{muscleGroup.name}</h3>
          {muscleGroup.default_group}
        </div>
        <Button variant="ghost" size="sm" onClick={onAddExercise} className="h-6 px-2 text-xs" disabled={disabled}>
          <Plus className="h-2.5 w-2.5 mr-1" />
          Add
        </Button>
      </div>
      
      {suggestions.length > 0 && <div className="border border-t-0 rounded-b-lg overflow-hidden">
          <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/10 border-b border-border/30">
            <History className="h-2.5 w-2.5 inline mr-1" />
            Recent exercises:
          </div>
          
          <div>
            {suggestions.map((exercise, index) => <UnifiedExerciseCard key={index} exerciseName={exercise.exercise_name} repsCount={exercise.reps_count || 1} repsUnit={exercise.reps_unit || "reps"} weightCount={exercise.weight_count || 0} weightUnit={exercise.weight_unit || "lbs"} setCount={exercise.set_count} note={exercise.note || undefined} variant="suggested" onAdd={() => handleCopyExercise(exercise)} disabled={disabled} />)}
          </div>
        </div>}
      
      {!loading && suggestions.length === 0 && !hasExistingExercises && <div className="border border-t-0 rounded-b-lg">
          <div className="text-xs text-muted-foreground text-center py-3 px-3">
            No previous exercises for this muscle group
          </div>
        </div>}
    </div>;
}