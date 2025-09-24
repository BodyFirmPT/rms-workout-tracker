import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateTrainerDialog } from "./create-trainer-dialog";

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
  const [name, setName] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [showCreateTrainer, setShowCreateTrainer] = useState(false);
  
  const { trainers, addClient } = useWorkoutStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !trainerId) return;

    addClient(name.trim(), trainerId);
    
    // Reset form
    setName("");
    setTrainerId("");
    onOpenChange(false);
  };

  const handleCreateTrainer = () => {
    onOpenChange(false);
    setShowCreateTrainer(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Add a new client to your training roster.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter client name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trainer">Trainer</Label>
              <div className="flex gap-2">
                <Select value={trainerId} onValueChange={setTrainerId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCreateTrainer}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || !trainerId}>
                Add Client
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CreateTrainerDialog
        open={showCreateTrainer}
        onOpenChange={setShowCreateTrainer}
      />
    </>
  );
}