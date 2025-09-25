import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useWorkoutStore } from "@/stores/workoutStore";
import { useToast } from "@/hooks/use-toast";
import { MuscleGroup } from "@/types/workout";

interface DeleteMuscleGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  muscleGroup: MuscleGroup;
}

export function DeleteMuscleGroupDialog({ open, onOpenChange, muscleGroup }: DeleteMuscleGroupDialogProps) {
  const [loading, setLoading] = useState(false);

  const { deleteMuscleGroup } = useWorkoutStore();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      await deleteMuscleGroup(muscleGroup.id);
      
      toast({
        title: "Success",
        description: "Muscle group deleted successfully",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete muscle group:', error);
      toast({
        title: "Error",
        description: "Failed to delete muscle group. It may be in use by existing exercises.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Muscle Group</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the muscle group "{muscleGroup.name}"? 
            This action cannot be undone and may affect existing exercises that use this muscle group.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}