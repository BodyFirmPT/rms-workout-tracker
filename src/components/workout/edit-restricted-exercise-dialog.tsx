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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MuscleGroup {
  id: string;
  name: string;
}

interface RestrictedExercise {
  id: string;
  name: string;
  reason?: string | null;
  muscle_group: { name: string } | null;
  muscle_group_id?: string | null;
}

interface EditRestrictedExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: RestrictedExercise;
  onSuccess: () => void;
}

export function EditRestrictedExerciseDialog({
  open,
  onOpenChange,
  exercise,
  onSuccess,
}: EditRestrictedExerciseDialogProps) {
  const [exerciseName, setExerciseName] = useState(exercise.name);
  const [muscleGroupId, setMuscleGroupId] = useState<string>(exercise.muscle_group_id || "");
  const [reason, setReason] = useState(exercise.reason || "");
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setExerciseName(exercise.name);
      setMuscleGroupId(exercise.muscle_group_id || "");
      setReason(exercise.reason || "");
      loadMuscleGroups();
    }
  }, [open, exercise]);

  const loadMuscleGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('muscle_group')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setMuscleGroups(data || []);
    } catch (error) {
      console.error('Error loading muscle groups:', error);
      toast.error("Failed to load muscle groups");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!exerciseName.trim()) {
      toast.error("Please enter an exercise name");
      return;
    }

    if (!muscleGroupId) {
      toast.error("Please select a muscle group");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('restricted_exercise')
        .update({
          name: exerciseName.trim(),
          muscle_group_id: muscleGroupId,
          reason: reason.trim() || null,
        })
        .eq('id', exercise.id);

      if (error) throw error;

      toast.success("Restricted exercise updated");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating restricted exercise:', error);
      toast.error("Failed to update restricted exercise");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Restricted Exercise</DialogTitle>
            <DialogDescription>
              Update the exercise restriction details
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-exercise-name">Exercise Name</Label>
              <Input
                id="edit-exercise-name"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="e.g., Bench Press, Squats..."
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-muscle-group">Muscle Group</Label>
              <Select value={muscleGroupId} onValueChange={setMuscleGroupId}>
                <SelectTrigger id="edit-muscle-group">
                  <SelectValue placeholder="Select a muscle group" />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-reason">Reason (optional)</Label>
              <Textarea
                id="edit-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Shoulder injury, causes pain..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
