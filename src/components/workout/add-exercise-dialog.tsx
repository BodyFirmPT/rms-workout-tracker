import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateWorkoutExerciseInput } from "@/types/workout";
import { MuscleGroupSuggestions } from "@/components/workout/muscle-group-suggestions";
import { ExerciseForm } from "@/components/workout/exercise-form";

interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutId: string;
  clientId: string;
  preselectedMuscleGroupId?: string | null;
}

export function AddExerciseDialog({ open, onOpenChange, workoutId, clientId, preselectedMuscleGroupId }: AddExerciseDialogProps) {
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string>("");
  
  const { addExerciseToWorkout, addMuscleGroup, getMuscleGroupById } = useWorkoutStore();

  // Update selected muscle group when preselected changes
  const effectiveMuscleGroupId = selectedMuscleGroupId || preselectedMuscleGroupId || "";

  const handleSubmit = async (exercise: CreateWorkoutExerciseInput, newMuscleGroupName?: string) => {
    let finalMuscleGroupId = exercise.muscle_group_id;

    // Create new muscle group if needed
    if (newMuscleGroupName) {
      finalMuscleGroupId = await addMuscleGroup(newMuscleGroupName, false);
    }

    if (!finalMuscleGroupId) return;

    await addExerciseToWorkout(workoutId, {
      ...exercise,
      muscle_group_id: finalMuscleGroupId,
    });
    
    onOpenChange(false);
  };

  const handleQuickAdd = () => {
    onOpenChange(false);
  };

  const handleMuscleGroupChange = (muscleGroupId: string) => {
    setSelectedMuscleGroupId(muscleGroupId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogDescription>
            Add a new exercise or stretch to this workout.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 -mx-6 px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative">
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
          
          <ExerciseForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            onMuscleGroupChange={handleMuscleGroupChange}
            submitLabel="Add Exercise"
            preselectedMuscleGroupId={preselectedMuscleGroupId}
          />

          {/* Show suggestions only when a muscle group is selected */}
          {effectiveMuscleGroupId && (() => {
            const selectedMuscleGroup = getMuscleGroupById(effectiveMuscleGroupId);
            return selectedMuscleGroup ? (
              <div className="border-t mt-4 pt-4 pb-4">
                <div className="text-sm font-medium mb-2">Or choose from recent exercises:</div>
                <MuscleGroupSuggestions
                  muscleGroup={selectedMuscleGroup}
                  clientId={clientId}
                  workoutId={workoutId}
                  hasExistingExercises={false}
                  onExerciseAdded={handleQuickAdd}
                  showClientFilter={true}
                />
              </div>
            ) : null;
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}