import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
}

interface WorkoutFormFieldsProps {
  date: Date;
  onDateChange: (date: Date) => void;
  note: string;
  onNoteChange: (note: string) => void;
  locationId: string;
  onLocationChange: (locationId: string) => void;
  locations: Location[];
  errors?: { [key: string]: string };
  onErrorClear?: (field: string) => void;
}

export function WorkoutFormFields({
  date,
  onDateChange,
  note,
  onNoteChange,
  locationId,
  onLocationChange,
  locations,
  errors = {},
  onErrorClear,
}: WorkoutFormFieldsProps) {
  return (
    <>
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
                  onDateChange(selectedDate);
                  onErrorClear?.("date");
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
        <Select value={locationId} onValueChange={onLocationChange}>
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
            onNoteChange(e.target.value);
            if (errors.note) {
              onErrorClear?.("note");
            }
          }}
          placeholder="e.g., Upper Body Strength, Cardio Session"
          className={errors.note ? "border-destructive" : ""}
        />
        {errors.note && (
          <p className="text-sm text-destructive">{errors.note}</p>
        )}
      </div>
    </>
  );
}
