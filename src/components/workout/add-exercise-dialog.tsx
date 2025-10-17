import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateWorkoutExerciseInput } from "@/types/workout";
import { MuscleGroupSuggestions } from "@/components/workout/muscle-group-suggestions";

interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutId: string;
  clientId: string;
  preselectedMuscleGroupId?: string | null;
}

export function AddExerciseDialog({ open, onOpenChange, workoutId, clientId, preselectedMuscleGroupId }: AddExerciseDialogProps) {
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroupId, setMuscleGroupId] = useState("");
  const [newMuscleGroup, setNewMuscleGroup] = useState("");
  const [exerciseType, setExerciseType] = useState<'exercise' | 'stretch'>('exercise');
  const [repsCount, setRepsCount] = useState(12);
  const [repsUnit, setRepsUnit] = useState("reps");
  const [weightCount, setWeightCount] = useState(0);
  const [weightUnit, setWeightUnit] = useState("lbs");
  const [sets, setSets] = useState(1);
  const [note, setNote] = useState("");
  const [showNewMuscleGroup, setShowNewMuscleGroup] = useState(false);
  
  const { muscleGroups, addExerciseToWorkout, addMuscleGroup, loadData, getMuscleGroupById } = useWorkoutStore();

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
      type: exerciseType,
      reps_count: repsCount,
      reps_unit: repsUnit,
      weight_count: weightCount,
      weight_unit: weightUnit,
      set_count: sets,
      note: note.trim(),
    };

    await addExerciseToWorkout(workoutId, exercise);
    
    // Reset form
    setExerciseName("");
    setMuscleGroupId("");
    setNewMuscleGroup("");
    setExerciseType('exercise');
    setRepsCount(12);
    setRepsUnit("reps");
    setWeightCount(0);
    setWeightUnit("lbs");
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

  const handleQuickAdd = async () => {
    // Close the dialog when an exercise is quick-added
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogDescription>
            Add a new exercise to this workout.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 -mx-6 px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative">
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
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
            <Label>Type</Label>
            <ToggleGroup 
              type="single" 
              value={exerciseType} 
              onValueChange={(value) => value && setExerciseType(value as 'exercise' | 'stretch')}
              className="inline-flex border border-input rounded-lg p-1 bg-muted/30 gap-1"
            >
              <ToggleGroupItem 
                value="exercise" 
                className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-background/50 hover:text-foreground"
              >
                Exercise
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="stretch" 
                className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-background/50 hover:text-foreground"
              >
                Stretch
              </ToggleGroupItem>
            </ToggleGroup>
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
              <Label htmlFor="reps-count">Reps/Duration</Label>
              <Input
                id="reps-count"
                type="number"
                value={repsCount}
                onChange={(e) => setRepsCount(Number(e.target.value))}
                placeholder="e.g., 12, 30"
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight-count">Weight</Label>
              <Input
                id="weight-count"
                type="number"
                value={weightCount}
                onChange={(e) => setWeightCount(Number(e.target.value))}
                min="0"
                step="any"
                placeholder="e.g., 15, 22.5"
              />
            </div>
            
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
          
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!exerciseName.trim() || (!muscleGroupId && !newMuscleGroup.trim())}>
                Add Exercise
              </Button>
            </div>
          </form>

          {/* Show suggestions only when a muscle group is selected */}
          {(muscleGroupId || preselectedMuscleGroupId) && (() => {
            const selectedMuscleGroup = getMuscleGroupById(muscleGroupId || preselectedMuscleGroupId || '');
            return selectedMuscleGroup ? (
              <div className="border-t mt-4 pt-4 pb-4">
                <div className="text-sm font-medium mb-2">Or choose from recent exercises:</div>
                <MuscleGroupSuggestions
                  muscleGroup={selectedMuscleGroup}
                  clientId={clientId}
                  workoutId={workoutId}
                  hasExistingExercises={false}
                  onExerciseAdded={handleQuickAdd}
                />
              </div>
            ) : null;
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}