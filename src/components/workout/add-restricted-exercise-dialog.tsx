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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MuscleGroup {
  id: string;
  name: string;
}

interface AddRestrictedExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}

export function AddRestrictedExerciseDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: AddRestrictedExerciseDialogProps) {
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroupId, setMuscleGroupId] = useState<string>("");
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadMuscleGroups();
    }
  }, [open]);

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
        .insert({
          client_id: clientId,
          name: exerciseName.trim(),
          muscle_group_id: muscleGroupId,
        });

      if (error) throw error;

      toast.success("Restricted exercise added");
      setExerciseName("");
      setMuscleGroupId("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding restricted exercise:', error);
      toast.error("Failed to add restricted exercise");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Restricted Exercise</DialogTitle>
            <DialogDescription>
              Add an exercise that this client should avoid
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="exercise-name">Exercise Name</Label>
              <Input
                id="exercise-name"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="e.g., Bench Press, Squats..."
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="muscle-group">Muscle Group</Label>
              <Select value={muscleGroupId} onValueChange={setMuscleGroupId}>
                <SelectTrigger id="muscle-group">
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
              {isSubmitting ? "Adding..." : "Add Exercise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}