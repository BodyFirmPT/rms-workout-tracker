import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  description: string | null;
}

interface EditLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location;
  onSuccess: () => void;
}

export function EditLocationDialog({
  open,
  onOpenChange,
  location,
  onSuccess,
}: EditLocationDialogProps) {
  const [locationName, setLocationName] = useState(location.name);
  const [description, setDescription] = useState(location.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLocationName(location.name);
    setDescription(location.description || "");
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationName.trim()) {
      toast.error("Please enter a location name");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('location')
        .update({
          name: locationName.trim(),
          description: description.trim() || null,
        })
        .eq('id', location.id);

      if (error) throw error;

      toast.success("Location updated");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error("Failed to update location");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update location details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="location-name">Location Name</Label>
              <Input
                id="location-name"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Home Gym, LA Fitness..."
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes about this location..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}