import { useState, useEffect } from "react";
import { History, Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  showClientFilter?: boolean;
}
export function MuscleGroupSuggestions({
  muscleGroup,
  clientId,
  workoutId,
  hasExistingExercises,
  disabled = false,
  onExerciseAdded,
  showClientFilter = false
}: MuscleGroupSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Array<WorkoutExercise & { workout_date?: string; client_name?: string; exercise_client_id?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState<'this' | 'all'>('this');
  const [displayCount, setDisplayCount] = useState(5);
  const [hasMore, setHasMore] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  const {
    getRecentExercisesForMuscleGroup,
    addExerciseToWorkout
  } = useWorkoutStore();
  
  // Initial check: if client has no exercises, default to "all"
  useEffect(() => {
    const checkClientExercises = async () => {
      try {
        const clientExercises = await getRecentExercisesForMuscleGroup(
          clientId, 
          muscleGroup.id, 
          1,
          0,
          false // Check only this client
        );
        
        if (clientExercises.length === 0) {
          setClientFilter('all');
        }
      } catch (error) {
        console.error('Failed to check client exercises:', error);
      } finally {
        setInitialCheckDone(true);
      }
    };
    checkClientExercises();
  }, [clientId, muscleGroup.id, getRecentExercisesForMuscleGroup]);
  
  useEffect(() => {
    if (!initialCheckDone) return;
    
    const loadSuggestions = async () => {
      setLoading(true);
      try {
        const allClients = clientFilter === 'all';
        const exercises = await getRecentExercisesForMuscleGroup(
          clientId, 
          muscleGroup.id, 
          displayCount + 1, // Fetch one extra to check if there are more
          0,
          allClients
        );
        
        // Check if there are more exercises available
        setHasMore(exercises.length > displayCount);
        
        // Only show the requested number
        setSuggestions(exercises.slice(0, displayCount));
      } catch (error) {
        console.error('Failed to load exercise suggestions:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSuggestions();
  }, [clientId, muscleGroup.id, getRecentExercisesForMuscleGroup, clientFilter, displayCount, initialCheckDone]);
  
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 5);
  };
  const handleCopyExercise = async (exercise: WorkoutExercise & { workout_date?: string; client_name?: string; exercise_client_id?: string }) => {
    if (!disabled) {
      await addExerciseToWorkout(workoutId, {
        muscle_group_id: exercise.muscle_group_id,
        exercise_name: exercise.exercise_name,
        type: exercise.type === 'exercise' ? 'weight' : exercise.type,
        reps_count: exercise.reps_count || 1,
        reps_unit: exercise.reps_unit || "reps",
        weight_count: exercise.weight_count || 0,
        weight_unit: exercise.weight_unit || "lbs",
        left_weight: exercise.left_weight,
        set_count: exercise.set_count,
        note: exercise.note || '',
        ...(exercise.type === 'band' && {
          band_color: exercise.band_color,
          band_type: exercise.band_type,
        }),
        image_url: exercise.image_url || null,
      });
      // Call the callback to close the dialog if provided
      onExerciseAdded?.();
    }
  };
  
  return (
    <>
      {(suggestions.length > 0 || showClientFilter) && (
        <div>
          <div className="px-3 py-2 border-b border-border/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                <History className="h-2.5 w-2.5 inline mr-1" />
                Recent exercises
              </div>
            </div>
            
            {showClientFilter && (
              <ToggleGroup 
                type="single" 
                value={clientFilter} 
                onValueChange={(value) => {
                  if (value) {
                    setClientFilter(value as 'this' | 'all');
                    setDisplayCount(5); // Reset count when changing filter
                  }
                }}
                className="inline-flex border border-input rounded-lg p-0.5 bg-muted/30 gap-0.5 w-full"
              >
                <ToggleGroupItem 
                  value="this" 
                  className="flex-1 text-xs py-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-background/50 hover:text-foreground"
                >
                  This client
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="all" 
                  className="flex-1 text-xs py-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-background/50 hover:text-foreground"
                >
                  All clients
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
          
          {suggestions.length > 0 ? (
            <>
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
                    type={(exercise.type === 'exercise' ? 'weight' : exercise.type) as 'weight' | 'band' | 'stretch'}
                    bandColor={exercise.band_color}
                    bandType={exercise.band_type}
                    resistanceLevel={exercise.resistance_level}
                    bandCategory={exercise.band_category}
                    clientId={exercise.exercise_client_id || clientId}
                    imageUrl={exercise.image_url}
                    workoutDate={exercise.workout_date}
                    clientName={exercise.exercise_client_id !== clientId ? exercise.client_name : undefined}
                    variant="suggested" 
                    onAdd={() => handleCopyExercise(exercise)} 
                    disabled={disabled} 
                  />
                ))}
              </div>
              
              {hasMore && (
                <div className="px-3 py-2 border-t border-border/30">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    className="w-full text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Show 5 more
                  </Button>
                </div>
              )}
            </>
          ) : (
            !loading && (
              <div className="text-xs text-muted-foreground text-center py-3 px-3">
                {clientFilter === 'this' 
                  ? 'No previous exercises for this client'
                  : 'No previous exercises for this muscle group'}
              </div>
            )
          )}
        </div>
      )}
      
      {!loading && suggestions.length === 0 && !hasExistingExercises && !showClientFilter && (
        <div className="text-xs text-muted-foreground text-center py-3 px-3">
          No previous exercises for this muscle group
        </div>
      )}
    </>
  );
}