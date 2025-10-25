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

interface Location {
  id: string;
  name: string;
  shared_count?: number;
}

interface DeleteLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location;
  clientId: string;
  onSuccess: () => void;
}

export function DeleteLocationDialog({
  open,
  onOpenChange,
  location,
  clientId,
  onSuccess,
}: DeleteLocationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isShared = location.shared_count && location.shared_count > 1;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (isShared) {
        // If shared, only remove the junction record
        const { error } = await supabase
          .from('client_locations')
          .delete()
          .eq('client_id', clientId)
          .eq('location_id', location.id);

        if (error) throw error;
        toast.success("Location removed from client");
      } else {
        // If not shared, delete the location entirely (cascade will remove junction)
        const { error } = await supabase
          .from('location')
          .delete()
          .eq('id', location.id);

        if (error) throw error;
        toast.success("Location deleted");
      }
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error("Failed to delete location");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isShared ? 'Remove Location' : 'Delete Location'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isShared 
              ? `Are you sure you want to remove "${location.name}" from this client? The location and its equipment will remain available for other clients.`
              : `Are you sure you want to delete "${location.name}"? This will also remove all equipment associated with this location. This action cannot be undone.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (isShared ? "Removing..." : "Deleting...") : (isShared ? "Remove" : "Delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}