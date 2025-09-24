import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkoutStore } from "@/stores/workoutStore";

interface CreateTrainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTrainerDialog({ open, onOpenChange }: CreateTrainerDialogProps) {
  const [name, setName] = useState("");
  
  const { addTrainer } = useWorkoutStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addTrainer(name.trim());
    
    // Reset form
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Trainer</DialogTitle>
          <DialogDescription>
            Add a new trainer to your system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Trainer Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter trainer name"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Add Trainer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}