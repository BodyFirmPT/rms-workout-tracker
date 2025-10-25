import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Equipment {
  id: string;
  name: string;
  description: string | null;
}

interface Location {
  id: string;
  name: string;
}

interface ManageEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location;
  onSuccess: () => void;
}

export function ManageEquipmentDialog({
  open,
  onOpenChange,
  location,
  onSuccess,
}: ManageEquipmentDialogProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [newEquipmentDescription, setNewEquipmentDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadEquipment();
    }
  }, [open, location.id]);

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('location_id', location.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEquipmentName.trim()) {
      toast.error("Please enter equipment name");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('equipment')
        .insert({
          location_id: location.id,
          name: newEquipmentName.trim(),
          description: newEquipmentDescription.trim() || null,
        });

      if (error) throw error;

      toast.success("Equipment added");
      setNewEquipmentName("");
      setNewEquipmentDescription("");
      loadEquipment();
      onSuccess();
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast.error("Failed to add equipment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', equipmentId);

      if (error) throw error;

      toast.success("Equipment removed");
      loadEquipment();
      onSuccess();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast.error("Failed to remove equipment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Equipment</DialogTitle>
          <DialogDescription>
            Equipment available at {location.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Add Equipment Form */}
          <form onSubmit={handleAddEquipment} className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="grid gap-2">
              <Label htmlFor="equipment-name">Equipment Name</Label>
              <Input
                id="equipment-name"
                value={newEquipmentName}
                onChange={(e) => setNewEquipmentName(e.target.value)}
                placeholder="e.g., Dumbbells, Treadmill..."
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="equipment-description">Description (optional)</Label>
              <Textarea
                id="equipment-description"
                value={newEquipmentDescription}
                onChange={(e) => setNewEquipmentDescription(e.target.value)}
                placeholder="Add details about this equipment..."
                rows={2}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? "Adding..." : "Add Equipment"}
            </Button>
          </form>

          {/* Equipment List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Equipment</h4>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No equipment added yet</p>
            ) : (
              <div className="space-y-2">
                {equipment.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEquipment(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}