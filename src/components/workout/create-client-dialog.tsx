import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateTrainerDialog } from "./create-trainer-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useEmulation } from "@/contexts/EmulationContext";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal";

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showUpgradeInstead?: boolean;
  onUpgradeNeeded?: () => void;
}

export function CreateClientDialog({ open, onOpenChange, showUpgradeInstead, onUpgradeNeeded }: CreateClientDialogProps) {
  const [name, setName] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [showCreateTrainer, setShowCreateTrainer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserTrainerId, setCurrentUserTrainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { trainers, addClient } = useWorkoutStore();
  const { emulatedUser } = useEmulation();

  useEffect(() => {
    if (open) {
      loadUserData();
    }
  }, [open, emulatedUser]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Get the current user (or emulated user)
      const userId = emulatedUser?.id || (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      // Check admin status
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      const userIsAdmin = !!roleData;
      setIsAdmin(userIsAdmin);

      // Get current user's trainer_id (use emulated user's trainer_id if emulating)
      const userTrainerId = emulatedUser?.trainer_id || (
        await supabase
          .from('users')
          .select('trainer_id')
          .eq('id', userId)
          .maybeSingle()
      ).data?.trainer_id;

      setCurrentUserTrainerId(userTrainerId);

      // If not admin, auto-set trainer to current user's trainer
      if (!userIsAdmin && userTrainerId) {
        setTrainerId(userTrainerId);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use current user's trainer if not admin
    const finalTrainerId = isAdmin ? trainerId : currentUserTrainerId;
    
    if (!name.trim() || !finalTrainerId) return;

    addClient(name.trim(), finalTrainerId);
    
    // Reset form
    setName("");
    if (isAdmin) {
      setTrainerId("");
    }
    onOpenChange(false);
  };

  const handleCreateTrainer = () => {
    onOpenChange(false);
    setShowCreateTrainer(true);
  };

  const effectiveTrainerId = isAdmin ? trainerId : currentUserTrainerId;

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
            
            {/* Only show trainer selector for admins */}
            {isAdmin && (
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
            )}
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || !effectiveTrainerId || loading}>
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
