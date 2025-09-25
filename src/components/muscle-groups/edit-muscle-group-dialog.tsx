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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkoutStore } from "@/stores/workoutStore";
import { useToast } from "@/hooks/use-toast";
import { MuscleGroup } from "@/types/workout";
import { z } from "zod";

interface EditMuscleGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  muscleGroup: MuscleGroup;
}

const muscleGroupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  isDefault: z.boolean(),
  category: z.string().optional()
});

export function EditMuscleGroupDialog({ open, onOpenChange, muscleGroup }: EditMuscleGroupDialogProps) {
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { updateMuscleGroup } = useWorkoutStore();
  const { toast } = useToast();

  const categoryOptions = ["Core", "Arms", "Legs"];

  useEffect(() => {
    if (muscleGroup) {
      setName(muscleGroup.name);
      setIsDefault(muscleGroup.default_group);
      setCategory(muscleGroup.category || "");
    }
  }, [muscleGroup]);

  const handleSubmit = async () => {
    try {
      setErrors({});
      
      // Validate input
      const validation = muscleGroupSchema.safeParse({
        name,
        isDefault,
        category: category || undefined
      });

      if (!validation.success) {
        const newErrors: Record<string, string> = {};
        validation.error.errors.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(newErrors);
        return;
      }

      setLoading(true);
      
      await updateMuscleGroup(muscleGroup.id, {
        name: validation.data.name,
        default_group: validation.data.isDefault,
        category: validation.data.category
      });
      
      toast({
        title: "Success",
        description: "Muscle group updated successfully",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update muscle group:', error);
      toast({
        title: "Error",
        description: "Failed to update muscle group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Muscle Group</DialogTitle>
          <DialogDescription>
            Modify the muscle group details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Core, Shoulders, Legs"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose a category to group this muscle group on workout pages
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="default-group">Default Group</Label>
              <p className="text-sm text-muted-foreground">
                Make this a system-wide default muscle group
              </p>
            </div>
            <Switch
              id="default-group"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? "Updating..." : "Update Muscle Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}