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
  
  const { getUniqueExercisesForClient, addExerciseToWorkout } = useWorkoutStore();

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
        reps: exercise.reps,
        unit: exercise.unit,
        count: exercise.count,
        set_count: exercise.set_count,
        note: exercise.note || ''
      });
    }
  };

  return (
    <Card className={`${hasExistingExercises ? 'bg-accent/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">{muscleGroup.name}</CardTitle>
            {muscleGroup.default_group && (
              <Badge variant="secondary" className="text-xs">Default</Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddExercise}
            className="h-7 px-2 text-xs"
            disabled={disabled}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      
      {suggestions.length > 0 && (
        <CardContent className="pt-0 space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <History className="h-3 w-3" />
            Recent exercises for this client:
          </div>
          
          <div className="space-y-2">
            {suggestions.map((exercise, index) => (
              <UnifiedExerciseCard
                key={index}
                exerciseName={exercise.exercise_name}
                reps={exercise.reps}
                unit={exercise.unit}
                setCount={exercise.set_count}
                note={exercise.note || undefined}
                variant="suggested"
                onAdd={() => handleCopyExercise(exercise)}
                disabled={disabled}
              />
            ))}
          </div>
        </CardContent>
      )}
      
      {!loading && suggestions.length === 0 && !hasExistingExercises && (
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground text-center py-2">
            No previous exercises for this muscle group
          </div>
        </CardContent>
      )}
    </Card>
  );
}