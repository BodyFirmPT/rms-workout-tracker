import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useWorkoutStore } from "@/stores/workoutStore";
import { Client } from "@/types/workout";

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

export function DeleteClientDialog({ open, onOpenChange, client }: DeleteClientDialogProps) {
  const { deleteClient, workouts } = useWorkoutStore();

  const clientWorkoutsCount = workouts.filter(w => w.client_id === client.id).length;

  const handleDelete = () => {
    deleteClient(client.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Client
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{client.name}</strong>? 
            {clientWorkoutsCount > 0 && (
              <>
                <br /><br />
                <strong>Warning:</strong> This client has {clientWorkoutsCount} workout{clientWorkoutsCount !== 1 ? 's' : ''} 
                that will also be deleted. This action cannot be undone.
              </>
            )}
            {clientWorkoutsCount === 0 && (
              <> This action cannot be undone.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Client
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}