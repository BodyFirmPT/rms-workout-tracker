import { useState, useEffect } from "react";
import { Edit, CalendarIcon, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useWorkoutStore } from "@/stores/workoutStore";
import { Workout, WorkoutUpdateInput } from "@/types/workout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Location {
  id: string;
  name: string;
}

const editWorkoutSchema = z.object({
  note: z.string().trim().max(500, { message: "Note must be less than 500 characters" }),
  date: z.date({ required_error: "Date is required" })
});

interface EditWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: Workout;
}

export function EditWorkoutDialog({ open, onOpenChange, workout }: EditWorkoutDialogProps) {
  const [note, setNote] = useState(workout.note || "");
  const [date, setDate] = useState<Date>(new Date(workout.date + 'T00:00:00'));
  const [locationId, setLocationId] = useState<string>(workout.location_id || "none");
  const [locations, setLocations] = useState<Location[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDatePicker, setShowCancelDatePicker] = useState(false);
  const [cancelDate, setCancelDate] = useState<Date>(new Date());
  const [cancelTime, setCancelTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [lateCancelled, setLateCancelled] = useState(workout.late_cancelled || false);
  
  const { updateWorkout, getClientById, loadData } = useWorkoutStore();

  const client = getClientById(workout.client_id);

  useEffect(() => {
    if (open && client) {
      loadLocations();
    }
  }, [open, client]);

  const loadLocations = async () => {
    if (!client) return;
    
    try {
      const { data, error } = await supabase
        .from('location')
        .select('id, name')
        .eq('client_id', client.id)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const validateForm = () => {
    try {
      editWorkoutSchema.parse({ note, date });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const updates: WorkoutUpdateInput = {
        note: note.trim(),
        date: format(date, 'yyyy-MM-dd'),
        location_id: locationId === "none" ? null : locationId,
      };
      await updateWorkout(workout.id, updates);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update workout:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setNote(workout.note || "");
    setDate(new Date(workout.date + 'T00:00:00'));
    setErrors({});
    setShowCancelDatePicker(false);
    onOpenChange(false);
  };

  const handleMarkCanceled = async () => {
    try {
      // Combine date and time into a full timestamp
      const [hours, minutes] = cancelTime.split(':');
      const cancelDateTime = new Date(cancelDate);
      cancelDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error } = await supabase
        .from('workout')
        .update({ 
          canceled_at: cancelDateTime.toISOString(),
          late_cancelled: lateCancelled 
        })
        .eq('id', workout.id);

      if (error) throw error;

      toast({
        title: "Workout Canceled",
        description: "The workout has been marked as canceled.",
      });

      await loadData();
      setShowCancelDatePicker(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to cancel workout:', error);
      toast({
        title: "Error",
        description: "Failed to cancel workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUncancelWorkout = async () => {
    try {
      const { error } = await supabase
        .from('workout')
        .update({ canceled_at: null })
        .eq('id', workout.id);

      if (error) throw error;

      toast({
        title: "Workout Restored",
        description: "The workout cancellation has been removed.",
      });

      await loadData();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to restore workout:', error);
      toast({
        title: "Error",
        description: "Failed to restore workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Workout
          </DialogTitle>
          <DialogDescription>
            Update the workout details for {client?.name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Workout Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    errors.date && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      setDate(selectedDate);
                      setErrors({ ...errors, date: "" });
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="note">Workout Note</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (errors.note) {
                  setErrors({ ...errors, note: "" });
                }
              }}
              placeholder="e.g., Upper Body Strength, Cardio Session"
              className={errors.note ? "border-destructive" : ""}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note}</p>
            )}
          </div>
          
          {workout.canceled_at && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Workout Canceled</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Canceled on {format(new Date(workout.canceled_at), 'PPP p')}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUncancelWorkout}
                className="mt-2"
              >
                Restore Workout
              </Button>
            </div>
          )}

          {showCancelDatePicker && !workout.canceled_at && (
            <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Cancel Workout</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelDatePicker(false)}
                  className="h-auto p-1"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Cancellation Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(cancelDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={cancelDate}
                      onSelect={(date) => date && setCancelDate(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel-time">Cancellation Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cancel-time"
                    type="time"
                    value={cancelTime}
                    onChange={(e) => setCancelTime(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="late-cancel"
                  checked={lateCancelled}
                  onCheckedChange={(checked) => setLateCancelled(checked === true)}
                />
                <Label htmlFor="late-cancel" className="text-sm font-normal cursor-pointer">
                  Late cancel
                </Label>
              </div>

              <Button
                type="button"
                onClick={handleMarkCanceled}
                className="w-full bg-destructive hover:bg-destructive/90"
              >
                Confirm Cancellation
              </Button>
            </div>
          )}
          
          <div className="flex justify-between gap-2 pt-4">
            {!workout.canceled_at && !showCancelDatePicker && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCancelDatePicker(true)}
                className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark Canceled
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Workout"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}