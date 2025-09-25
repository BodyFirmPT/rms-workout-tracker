import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkoutStore } from "@/stores/workoutStore";
import { Workout } from "@/types/workout";
import { format } from "date-fns";

interface DeleteWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: Workout;
}

export function DeleteWorkoutDialog({ open, onOpenChange, workout }: DeleteWorkoutDialogProps) {
  const { deleteWorkout, getClientById } = useWorkoutStore();

  const client = getClientById(workout.client_id);

  const handleDelete = async () => {
    await deleteWorkout(workout.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Workout
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this workout? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium">{format(new Date(workout.date + 'T00:00:00'), 'MMMM d, yyyy')}</h4>
            <p className="text-sm text-muted-foreground">{client?.name}</p>
            {workout.note && (
              <p className="text-sm text-muted-foreground italic mt-1">{workout.note}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Workout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}