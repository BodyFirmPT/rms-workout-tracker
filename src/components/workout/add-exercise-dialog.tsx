import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateWorkoutExerciseInput } from "@/types/workout";

interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutId: string;
  preselectedMuscleGroupId?: string | null;
}

export function AddExerciseDialog({ open, onOpenChange, workoutId, preselectedMuscleGroupId }: AddExerciseDialogProps) {
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroupId, setMuscleGroupId] = useState("");
  const [newMuscleGroup, setNewMuscleGroup] = useState("");
  const [reps, setReps] = useState("");
  const [unit, setUnit] = useState("reps");
  const [count, setCount] = useState(1);
  const [sets, setSets] = useState(1);
  const [note, setNote] = useState("");
  const [showNewMuscleGroup, setShowNewMuscleGroup] = useState(false);
  
  const { muscleGroups, addExerciseToWorkout, addMuscleGroup, loadData } = useWorkoutStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set preselected muscle group when dialog opens
  useEffect(() => {
    if (open && preselectedMuscleGroupId) {
      setMuscleGroupId(preselectedMuscleGroupId);
      setShowNewMuscleGroup(false);
    }
  }, [open, preselectedMuscleGroupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    let finalMuscleGroupId = muscleGroupId;

    // Create new muscle group if needed
    if (showNewMuscleGroup && newMuscleGroup.trim()) {
      finalMuscleGroupId = await addMuscleGroup(newMuscleGroup.trim(), false);
    }

    if (!finalMuscleGroupId) return;

    const exercise: CreateWorkoutExerciseInput = {
      muscle_group_id: finalMuscleGroupId,
      exercise_name: exerciseName.trim(),
      reps,
      unit,
      count,
      set_count: sets,
      note: note.trim(),
    };

    await addExerciseToWorkout(workoutId, exercise);
    
    // Reset form
    setExerciseName("");
    setMuscleGroupId("");
    setNewMuscleGroup("");
    setReps("");
    setUnit("reps");
    setCount(1);
    setSets(1);
    setNote("");
    setShowNewMuscleGroup(false);
    onOpenChange(false);
  };

  const handleMuscleGroupChange = (value: string) => {
    if (value === "new") {
      setShowNewMuscleGroup(true);
      setMuscleGroupId("");
    } else {
      setShowNewMuscleGroup(false);
      setMuscleGroupId(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogDescription>
            Add a new exercise to this workout.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exercise-name">Exercise Name</Label>
            <Input
              id="exercise-name"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g., Bench Press, Squats"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="muscle-group">Muscle Group</Label>
            <Select value={showNewMuscleGroup ? "new" : muscleGroupId} onValueChange={handleMuscleGroupChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select muscle group" />
              </SelectTrigger>
              <SelectContent>
                {muscleGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add new muscle group
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {showNewMuscleGroup && (
              <Input
                value={newMuscleGroup}
                onChange={(e) => setNewMuscleGroup(e.target.value)}
                placeholder="Enter new muscle group name"
                className="mt-2"
              />
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reps">Reps/Duration</Label>
              <Input
                id="reps"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="e.g., 12, 30 sec"
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
                  <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="seconds">Seconds</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="count">Weight/Count</Label>
              <Input
                id="count"
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min="0"
                step="0.5"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                value={sets}
                onChange={(e) => setSets(Number(e.target.value))}
                min="1"
                max="10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="note">Notes (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional notes or instructions"
              rows={2}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!exerciseName.trim() || (!muscleGroupId && !newMuscleGroup.trim())}>
              Add Exercise
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}