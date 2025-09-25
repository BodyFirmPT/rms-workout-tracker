import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkoutStore } from "@/stores/workoutStore";
import { WorkoutExercise } from "@/types/workout";

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
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroupId, setMuscleGroupId] = useState("");
  const [newMuscleGroup, setNewMuscleGroup] = useState("");
  const [reps, setReps] = useState("");
  const [unit, setUnit] = useState("reps");
  const [count, setCount] = useState("");
  const [sets, setSets] = useState("3");
  const [note, setNote] = useState("");
  const [isCreatingNewMuscleGroup, setIsCreatingNewMuscleGroup] = useState(false);

  const { muscleGroups, updateExercise, addMuscleGroup, loadData } = useWorkoutStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pre-fill form when exercise changes
  useEffect(() => {
    if (exercise) {
      setExerciseName(exercise.exercise_name);
      setMuscleGroupId(exercise.muscle_group_id);
      setReps(exercise.reps);
      setUnit(exercise.unit);
      setCount(exercise.count?.toString() || "");
      setSets(exercise.set_count.toString());
      setNote(exercise.note || "");
      setIsCreatingNewMuscleGroup(false);
      setNewMuscleGroup("");
    }
  }, [exercise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exercise || !exerciseName.trim() || !reps.trim() || !sets.trim()) {
      return;
    }

    try {
      let finalMuscleGroupId = muscleGroupId;

      // Create new muscle group if needed
      if (isCreatingNewMuscleGroup && newMuscleGroup.trim()) {
        finalMuscleGroupId = await addMuscleGroup(newMuscleGroup.trim(), false);
      }

      // Update the exercise
      await updateExercise(workoutId, exercise.id, {
        exercise_name: exerciseName.trim(),
        muscle_group_id: finalMuscleGroupId,
        reps: reps.trim(),
        unit,
        count: count ? parseInt(count) : null,
        set_count: parseInt(sets),
        note: note.trim() || null,
      });

      // Reset and close
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update exercise:", error);
    }
  };

  const handleMuscleGroupChange = (value: string) => {
    if (value === "__new__") {
      setIsCreatingNewMuscleGroup(true);
      setMuscleGroupId("");
    } else {
      setIsCreatingNewMuscleGroup(false);
      setMuscleGroupId(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Exercise</DialogTitle>
          <DialogDescription>
            Update the exercise details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exerciseName">Exercise Name</Label>
            <Input
              id="exerciseName"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g., Push-ups, Squats"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="muscleGroup">Muscle Group</Label>
            {isCreatingNewMuscleGroup ? (
              <div className="space-y-2">
                <Input
                  value={newMuscleGroup}
                  onChange={(e) => setNewMuscleGroup(e.target.value)}
                  placeholder="Enter new muscle group name"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreatingNewMuscleGroup(false);
                    setNewMuscleGroup("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Select value={muscleGroupId} onValueChange={handleMuscleGroupChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select muscle group" />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Create new muscle group</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reps">Reps/Duration</Label>
              <Input
                id="reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="e.g., 10, 30 sec"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reps">Reps</SelectItem>
                  <SelectItem value="seconds">Seconds</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="count">Count/Weight (optional)</Label>
              <Input
                id="count"
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="e.g., 25 lbs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Notes (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!exerciseName.trim() || !reps.trim() || !sets.trim() || 
                       (!muscleGroupId && (!isCreatingNewMuscleGroup || !newMuscleGroup.trim()))}
            >
              Update Exercise
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}