import { useState, useEffect } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  const [exerciseType, setExerciseType] = useState<'exercise' | 'stretch'>('exercise');
  const [repsCount, setRepsCount] = useState(1);
  const [repsUnit, setRepsUnit] = useState("reps");
  const [weightCount, setWeightCount] = useState(0);
  const [weightUnit, setWeightUnit] = useState("lbs");
  const [leftWeight, setLeftWeight] = useState<number | null>(null);
  const [showLeftRight, setShowLeftRight] = useState(false);
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
      setExerciseType(exercise.type || 'exercise');
      setRepsCount(exercise.reps_count || 1);
      setRepsUnit(exercise.reps_unit || "reps");
      setWeightCount(exercise.weight_count || 0);
      setWeightUnit(exercise.weight_unit || "lbs");
      setLeftWeight(exercise.left_weight ?? null);
      setShowLeftRight(exercise.left_weight !== null && exercise.left_weight !== undefined);
      setSets(exercise.set_count.toString());
      setNote(exercise.note || "");
      setIsCreatingNewMuscleGroup(false);
      setNewMuscleGroup("");
    }
  }, [exercise]);

  // Update defaults when exercise type changes
  useEffect(() => {
    if (exerciseType === 'stretch') {
      setRepsUnit('seconds');
      setRepsCount(30);
    } else {
      setRepsUnit('reps');
      setRepsCount(12);
    }
  }, [exerciseType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exercise || !exerciseName.trim() || !sets.trim()) {
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
        type: exerciseType,
        reps_count: repsCount,
        reps_unit: repsUnit,
        weight_count: weightCount,
        weight_unit: weightUnit,
        left_weight: showLeftRight ? leftWeight : null,
        set_count: parseInt(sets),
        note: note.trim(),
      });

      toast({
        title: "Exercise updated",
        description: "The exercise has been successfully updated.",
      });

      // Reset and close
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{exerciseType === 'stretch' ? 'Edit Stretch' : 'Edit Exercise'}</DialogTitle>
          <DialogDescription>
            Update the {exerciseType === 'stretch' ? 'stretch' : 'exercise'} details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 -mx-6 px-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent">
          <div className="space-y-2">
            <Label htmlFor="exerciseName">{exerciseType === 'stretch' ? 'Stretch Name' : 'Exercise Name'}</Label>
            <Input
              id="exerciseName"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g., Push-ups, Squats"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="w-full">
              <ToggleGroup 
                type="single" 
                value={exerciseType} 
                onValueChange={(value) => value && setExerciseType(value as 'exercise' | 'stretch')}
                className="inline-flex border border-input rounded-lg p-1 bg-muted/30 gap-1 w-full"
              >
                <ToggleGroupItem 
                  value="exercise" 
                  className="flex-1 data-[state=on]:bg-orange-500 data-[state=on]:text-white data-[state=on]:shadow-sm data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-background/50 hover:text-foreground"
                >
                  Exercise
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="stretch" 
                  className="flex-1 data-[state=on]:bg-orange-500 data-[state=on]:text-white data-[state=on]:shadow-sm data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-background/50 hover:text-foreground"
                >
                  Stretch
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
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
              <Label htmlFor="reps-count">Reps/Duration</Label>
              <Input
                id="reps-count"
                type="number"
                value={repsCount}
                onChange={(e) => setRepsCount(Number(e.target.value))}
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reps-unit">Unit</Label>
              <Select value={repsUnit} onValueChange={setRepsUnit}>
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

          <div className="space-y-2">
            <div className={`grid gap-4 ${showLeftRight ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <div className="space-y-2">
                <Label htmlFor="weight-count">{showLeftRight ? "Right Weight" : "Weight"}</Label>
                <Input
                  id="weight-count"
                  type="number"
                  value={weightCount}
                  onChange={(e) => setWeightCount(Number(e.target.value))}
                  min="0"
                  step="0.5"
                />
              </div>
              {showLeftRight && (
                <div className="space-y-2">
                  <Label htmlFor="left-weight">Left Weight</Label>
                  <Input
                    id="left-weight"
                    type="number"
                    value={leftWeight ?? 0}
                    onChange={(e) => setLeftWeight(Number(e.target.value))}
                    min="0"
                    step="0.5"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="weight-unit">Weight Unit</Label>
                <Select value={weightUnit} onValueChange={setWeightUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (showLeftRight) {
                  setShowLeftRight(false);
                  setLeftWeight(null);
                } else {
                  setShowLeftRight(true);
                  setLeftWeight(weightCount);
                }
              }}
              className="text-xs h-auto py-1 px-2 text-primary hover:text-white"
            >
              <ArrowLeftRight className="h-3 w-3 mr-0.5" />
              {showLeftRight ? "Reset left/right" : "Set right/left"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
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

          <DialogFooter className="flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!exerciseName.trim() || !sets.trim() || 
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