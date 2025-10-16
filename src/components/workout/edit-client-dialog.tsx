import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateTrainerDialog } from "./create-trainer-dialog";
import { Client } from "@/types/workout";

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

export function EditClientDialog({ open, onOpenChange, client }: EditClientDialogProps) {
  const [name, setName] = useState(client.name);
  const [trainerId, setTrainerId] = useState(client.trainer_id);
  const [workoutCountOffset, setWorkoutCountOffset] = useState(client.workout_count_offset || 0);
  const [showCreateTrainer, setShowCreateTrainer] = useState(false);
  
  const { trainers, updateClient } = useWorkoutStore();

  useEffect(() => {
    setName(client.name);
    setTrainerId(client.trainer_id);
    setWorkoutCountOffset(client.workout_count_offset || 0);
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !trainerId) return;

    updateClient(client.id, { 
      name: name.trim(), 
      trainer_id: trainerId,
      workout_count_offset: workoutCountOffset
    });
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
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information.
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

            <div className="space-y-2">
              <Label htmlFor="offset">Workout Count Offset</Label>
              <Input
                id="offset"
                type="number"
                min="0"
                value={workoutCountOffset}
                onChange={(e) => setWorkoutCountOffset(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Add previous workouts done before using this system
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || !trainerId}>
                Update Client
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