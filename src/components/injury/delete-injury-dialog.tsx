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
import { useToast } from "@/hooks/use-toast";
import { Injury } from "@/types/injury";

interface DeleteInjuryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  injury: Injury;
  onSuccess: () => void;
}

export function DeleteInjuryDialog({ open, onOpenChange, injury, onSuccess }: DeleteInjuryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("injury")
        .delete()
        .eq("id", injury.id);

      if (error) throw error;

      toast({
        title: "Injury deleted",
        description: "The injury record has been deleted successfully",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting injury:", error);
      toast({
        title: "Error",
        description: "Failed to delete injury. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Injury</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{injury.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
