import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Ban } from "lucide-react";

interface Restriction {
  id: string;
  name: string;
}

interface ViewRestrictionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restrictions: Restriction[];
  muscleGroupName: string;
}

export function ViewRestrictionsDialog({
  open,
  onOpenChange,
  restrictions,
  muscleGroupName,
}: ViewRestrictionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Restricted Exercises
          </DialogTitle>
          <DialogDescription>
            The following exercises are restricted for this client in {muscleGroupName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
          {restrictions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No restricted exercises
            </p>
          ) : (
            <ul className="space-y-2">
              {restrictions.map((restriction) => (
                <li 
                  key={restriction.id} 
                  className="flex items-center gap-2 p-2 border rounded-lg bg-destructive/5"
                >
                  <Ban className="h-4 w-4 text-destructive flex-shrink-0" />
                  <span className="text-sm font-medium">{restriction.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}