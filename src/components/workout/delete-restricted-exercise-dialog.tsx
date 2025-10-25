import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RestrictedExercise {
  id: string;
  name: string;
}

interface DeleteRestrictedExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: RestrictedExercise;
  onSuccess: () => void;
}

export function DeleteRestrictedExerciseDialog({
  open,
  onOpenChange,
  exercise,
  onSuccess,
}: DeleteRestrictedExerciseDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('restricted_exercise')
        .delete()
        .eq('id', exercise.id);

      if (error) throw error;

      toast.success("Restricted exercise removed");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error deleting restricted exercise:', error);
      toast.error("Failed to remove restricted exercise");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Restricted Exercise</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove "{exercise.name}" from the restricted exercises list?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}