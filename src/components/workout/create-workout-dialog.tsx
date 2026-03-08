import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateClientDialog } from "./create-client-dialog";
import { WorkoutFormFields } from "./workout-form-fields";
import { supabase } from "@/integrations/supabase/client";

interface Location {
  id: string;
  name: string;
}

interface CreateWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
  onWorkoutCreated?: (workoutId: string) => void;
}

export function CreateWorkoutDialog({ open, onOpenChange, defaultClientId, onWorkoutCreated }: CreateWorkoutDialogProps) {
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [clientId, setClientId] = useState(defaultClientId || "");
  const [locationId, setLocationId] = useState<string>("none");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selfLed, setSelfLed] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  
  const { clients, createWorkout } = useWorkoutStore();

  // Update clientId when defaultClientId changes
  useEffect(() => {
    if (defaultClientId) {
      setClientId(defaultClientId);
    }
  }, [defaultClientId]);

  // Load locations when client changes
  useEffect(() => {
    if (open && clientId) {
      loadLocations();
    }
  }, [open, clientId]);

  const loadLocations = async () => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('client_locations')
        .select(`
          location:location_id (
            id,
            name
          )
        `)
        .eq('client_id', clientId);

      if (error) throw error;
      
      const locationsList = (data || [])
        .filter(item => item.location)
        .map(item => item.location!)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setLocations(locationsList);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    const workoutId = await createWorkout(
      clientId, 
      note.trim(), 
      format(date, 'yyyy-MM-dd'),
      locationId === "none" ? null : locationId,
      selfLed
    );
    
    // Reset form
    setNote("");
    setDate(new Date());
    setClientId(defaultClientId || "");
    setLocationId("none");
    setSelfLed(false);
    onOpenChange(false);
    
    // Call the callback if provided
    if (onWorkoutCreated && workoutId) {
      onWorkoutCreated(workoutId);
    }
  };

  const handleCreateClient = () => {
    onOpenChange(false);
    setShowCreateClient(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Workout</DialogTitle>
            <DialogDescription>
              Start a new training session for your client.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!defaultClientId && (
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <div className="flex gap-2">
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCreateClient}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <WorkoutFormFields
              date={date}
              onDateChange={setDate}
              note={note}
              onNoteChange={setNote}
              locationId={locationId}
              onLocationChange={setLocationId}
              locations={locations}
            />
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="self-led"
                checked={selfLed}
                onCheckedChange={(checked) => setSelfLed(checked === true)}
              />
              <Label htmlFor="self-led" className="text-sm font-normal cursor-pointer">
                Self-led workout
              </Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!clientId}>
                Create Workout
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CreateClientDialog
        open={showCreateClient}
        onOpenChange={setShowCreateClient}
      />
    </>
  );
}