import { useState } from "react";
import { Edit, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useWorkoutStore } from "@/stores/workoutStore";
import { Workout } from "@/types/workout";

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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { updateWorkout, getClientById } = useWorkoutStore();

  const client = getClientById(workout.client_id);

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
      await updateWorkout(workout.id, {
        note: note.trim(),
        date: format(date, 'yyyy-MM-dd')
      });
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Workout"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}