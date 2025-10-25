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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}

export function AddLocationDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: AddLocationDialogProps) {
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");

  useEffect(() => {
    if (open) {
      loadAvailableLocations();
    }
  }, [open, clientId]);

  const loadAvailableLocations = async () => {
    try {
      // Get all locations that are NOT already associated with this client
      const { data: existingLocationIds } = await supabase
        .from('client_locations')
        .select('location_id')
        .eq('client_id', clientId);

      const existingIds = existingLocationIds?.map(cl => cl.location_id) || [];

      const { data, error } = await supabase
        .from('location')
        .select('*')
        .order('name');

      if (error) throw error;

      // Filter out locations already associated with this client
      const available = data?.filter(loc => !existingIds.includes(loc.id)) || [];
      setAvailableLocations(available);
      
      // If no available locations, default to "new" mode
      if (available.length === 0) {
        setMode("new");
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      let locationId: string;

      if (mode === "existing") {
        if (!selectedLocationId) {
          toast.error("Please select a location");
          return;
        }
        locationId = selectedLocationId;
      } else {
        if (!locationName.trim()) {
          toast.error("Please enter a location name");
          return;
        }

        // Create new location
        const { data: locationData, error: locationError } = await supabase
          .from('location')
          .insert({
            name: locationName.trim(),
            description: description.trim() || null,
          })
          .select()
          .single();

        if (locationError) throw locationError;
        locationId = locationData.id;
      }

      // Create the junction record
      const { error: junctionError } = await supabase
        .from('client_locations')
        .insert({
          client_id: clientId,
          location_id: locationId,
        });

      if (junctionError) throw junctionError;

      toast.success("Location added");
      setLocationName("");
      setDescription("");
      setSelectedLocationId("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding location:', error);
      toast.error("Failed to add location");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
            <DialogDescription>
              Add a training location for this client
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={mode} onValueChange={(v) => setMode(v as "existing" | "new")} className="py-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" disabled={availableLocations.length === 0}>
                Select Existing {availableLocations.length > 0 && `(${availableLocations.length})`}
              </TabsTrigger>
              <TabsTrigger value="new">Create New</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="location-select">Location</Label>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger id="location-select">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                        {location.description && ` - ${location.description}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="location-name">Location Name</Label>
                <Input
                  id="location-name"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Home Gym, LA Fitness..."
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
            </TabsContent>
          </Tabs>

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
              {isSubmitting ? "Adding..." : "Add Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}