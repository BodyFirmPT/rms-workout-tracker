import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkoutStore } from "@/stores/workoutStore";
import { WorkoutExercise, CreateWorkoutExerciseInput } from "@/types/workout";
import { ExerciseForm } from "@/components/workout/exercise-form";

interface EditExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: WorkoutExercise | null;
  workoutId: string;
}

export function EditExerciseDialog({
  open,
  onOpenChange,
  exercise,
  workoutId,
}: EditExerciseDialogProps) {
  const { updateExercise, addMuscleGroup } = useWorkoutStore();

  const handleSubmit = async (exerciseData: CreateWorkoutExerciseInput, newMuscleGroupName?: string) => {
    if (!exercise) return;

    try {
      let finalMuscleGroupId = exerciseData.muscle_group_id;

      // Create new muscle group if needed
      if (newMuscleGroupName) {
        finalMuscleGroupId = await addMuscleGroup(newMuscleGroupName, false);
      }

      // Update the exercise
      await updateExercise(workoutId, exercise.id, {
        ...exerciseData,
        muscle_group_id: finalMuscleGroupId,
      });

      toast({
        title: "Exercise updated",
        description: "The exercise has been successfully updated.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update exercise:", error);
      toast({
        title: "Error",
        description: "Failed to update exercise. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initialValues = exercise ? {
    exerciseName: exercise.exercise_name,
    muscleGroupId: exercise.muscle_group_id,
    exerciseType: (exercise.type === 'exercise' ? 'weight' : exercise.type) as 'weight' | 'band' | 'stretch',
    repsCount: exercise.reps_count || 1,
    repsUnit: exercise.reps_unit || "reps",
    weightCount: exercise.weight_count || 0,
    weightUnit: exercise.weight_unit || "lbs",
    leftWeight: exercise.left_weight ?? null,
    sets: exercise.set_count,
    note: exercise.note || "",
    bandColor: exercise.band_color || "",
    bandType: exercise.band_type || "",
    imageUrl: exercise.image_url,
  } : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Exercise</DialogTitle>
          <DialogDescription>
            Update the exercise details below.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 -mx-6 px-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent">
          {exercise?.raw_import_data && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Original Import Data</p>
              <p className="text-sm font-mono">{exercise.raw_import_data}</p>
            </div>
          )}
          <ExerciseForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            initialValues={initialValues}
            submitLabel="Update Exercise"
            isEditing={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}