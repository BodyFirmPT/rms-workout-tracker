import { useState, useEffect, useMemo } from "react";
import { Plus, ArrowLeftRight, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateWorkoutExerciseInput, CreateExerciseMediaInput } from "@/types/workout";
import { supabase } from "@/integrations/supabase/client";
import { ViewRestrictionsDialog } from "@/components/workout/view-restrictions-dialog";
import { ExerciseMediaUpload } from "@/components/workout/exercise-media-upload";
import {
  RESISTANCE_LEVELS,
  RESISTANCE_LABELS,
  categoryFromBandType,
  resolveBandColor,
  type ResistanceLevel,
  type BandCategory,
} from "@/lib/band-colors";

interface Restriction {
  id: string;
  name: string;
}

interface ExerciseFormProps {
  onSubmit: (data: CreateWorkoutExerciseInput, newMuscleGroupName?: string) => Promise<void>;
  onCancel: () => void;
  onMuscleGroupChange?: (muscleGroupId: string) => void;
  initialValues?: {
    exerciseName?: string;
    muscleGroupId?: string;
    exerciseType?: 'exercise' | 'weight' | 'band' | 'stretch';
    repsCount?: number;
    repsUnit?: string;
    weightCount?: number;
    weightUnit?: string;
    leftWeight?: number | null;
    sets?: number;
    note?: string;
    bandColor?: string;
    bandType?: string;
    resistanceLevel?: string;
    bandCategory?: string;
    imageUrl?: string | null;
    media?: CreateExerciseMediaInput[];
  };
  submitLabel?: string;
  preselectedMuscleGroupId?: string | null;
  clientId?: string;
  isEditing?: boolean;
}

export function ExerciseForm({
  onSubmit,
  onCancel,
  onMuscleGroupChange,
  initialValues,
  submitLabel = "Add Exercise",
  preselectedMuscleGroupId,
  clientId,
  isEditing = false,
}: ExerciseFormProps) {
  const [exerciseName, setExerciseName] = useState(initialValues?.exerciseName || "");
  const [muscleGroupId, setMuscleGroupId] = useState(initialValues?.muscleGroupId || "");
  const [newMuscleGroup, setNewMuscleGroup] = useState("");
  const [exerciseType, setExerciseType] = useState<'exercise' | 'weight' | 'band' | 'stretch'>(initialValues?.exerciseType || 'weight');
  const [repsCount, setRepsCount] = useState(initialValues?.repsCount || 12);
  const [repsUnit, setRepsUnit] = useState(initialValues?.repsUnit || "reps");
  const [weightCount, setWeightCount] = useState(initialValues?.weightCount || 0);
  const [weightUnit, setWeightUnit] = useState(initialValues?.weightUnit || "lbs");
  const [leftWeight, setLeftWeight] = useState<number | null>(initialValues?.leftWeight ?? null);
  const [showLeftRight, setShowLeftRight] = useState(
    initialValues?.leftWeight !== null && initialValues?.leftWeight !== undefined
  );
  const [sets, setSets] = useState(initialValues?.sets || 1);
  const [note, setNote] = useState(initialValues?.note || "");
  const [bandColor, setBandColor] = useState(initialValues?.bandColor || "");
  const [bandType, setBandType] = useState(initialValues?.bandType || "");
  const [resistanceLevel, setResistanceLevel] = useState<string>(initialValues?.resistanceLevel || "");
  const [media, setMedia] = useState<CreateExerciseMediaInput[]>(initialValues?.media || []);
  const [showNewMuscleGroup, setShowNewMuscleGroup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [showRestrictionsDialog, setShowRestrictionsDialog] = useState(false);

  const { muscleGroups, loadData, getMuscleGroupById, bandColors, clientBandMappings, loadBandData } = useWorkoutStore();

  useEffect(() => {
    loadData();
    loadBandData();
  }, [loadData, loadBandData]);

  // Set preselected muscle group when provided
  useEffect(() => {
    if (preselectedMuscleGroupId) {
      setMuscleGroupId(preselectedMuscleGroupId);
      setShowNewMuscleGroup(false);
    }
  }, [preselectedMuscleGroupId]);

  // Update initial values when they change
  useEffect(() => {
    if (initialValues) {
      setExerciseName(initialValues.exerciseName || "");
      setMuscleGroupId(initialValues.muscleGroupId || "");
      setExerciseType(initialValues.exerciseType || 'weight');
      setRepsCount(initialValues.repsCount || 12);
      setRepsUnit(initialValues.repsUnit || "reps");
      setWeightCount(initialValues.weightCount || 0);
      setWeightUnit(initialValues.weightUnit || "lbs");
      setLeftWeight(initialValues.leftWeight ?? null);
      setShowLeftRight(initialValues.leftWeight !== null && initialValues.leftWeight !== undefined);
      setSets(initialValues.sets || 1);
      setNote(initialValues.note || "");
      setBandColor(initialValues.bandColor || "");
      setBandType(initialValues.bandType || "");
      setMedia(initialValues.media || []);
      setShowNewMuscleGroup(false);
      setNewMuscleGroup("");
    }
  }, [initialValues]);

  // Update defaults when exercise type changes - only for new exercises, preserve values when editing
  useEffect(() => {
    // Skip if this is an edit and exerciseType matches the initial value (initial load)
    if (isEditing && initialValues?.exerciseType === exerciseType) {
      return;
    }
    
    // Only reset to defaults when switching types
    if (exerciseType === 'stretch') {
      setRepsUnit('seconds');
      // Only reset reps count if switching TO stretch and current unit is not already seconds
      if (repsUnit !== 'seconds') {
        setRepsCount(30);
      }
    } else if (repsUnit === 'seconds') {
      // Only reset unit to reps if current unit is seconds (switching FROM stretch)
      setRepsUnit('reps');
    }
    // Don't reset repsCount when switching between weight and band - preserve the value
  }, [exerciseType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exerciseName.trim() || (!muscleGroupId && !newMuscleGroup.trim())) {
      return;
    }

    setIsSubmitting(true);
    try {
      const exercise: CreateWorkoutExerciseInput = {
        muscle_group_id: muscleGroupId, // Will be updated if creating new group
        exercise_name: exerciseName.trim(),
        type: exerciseType,
        reps_count: repsCount,
        reps_unit: repsUnit,
        weight_count: weightCount,
        weight_unit: weightUnit,
        left_weight: showLeftRight ? leftWeight : null,
        set_count: sets,
        note: note.trim(),
        image_url: null, // Deprecated, using media table now
        media: media.length > 0 ? media : undefined,
        ...(exerciseType === 'band' && {
          band_color: bandColor,
          band_type: bandType,
        }),
      };

      await onSubmit(exercise, showNewMuscleGroup ? newMuscleGroup.trim() : undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load restrictions when muscle group changes
  useEffect(() => {
    if (muscleGroupId && clientId && !isEditing) {
      loadRestrictions(muscleGroupId, clientId);
    } else {
      setRestrictions([]);
    }
  }, [muscleGroupId, clientId, isEditing]);

  const loadRestrictions = async (muscleGroupId: string, clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('restricted_exercise')
        .select('id, name, reason')
        .eq('client_id', clientId)
        .eq('muscle_group_id', muscleGroupId);

      if (error) throw error;
      setRestrictions(data || []);
    } catch (error) {
      console.error('Error loading restrictions:', error);
      setRestrictions([]);
    }
  };

  const handleMuscleGroupChange = (value: string) => {
    if (value === "new" || value === "__new__") {
      setShowNewMuscleGroup(true);
      setMuscleGroupId("");
      onMuscleGroupChange?.("");
    } else {
      setShowNewMuscleGroup(false);
      setMuscleGroupId(value);
      onMuscleGroupChange?.(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="muscle-group">Muscle Group</Label>
        <Select value={showNewMuscleGroup ? "new" : muscleGroupId} onValueChange={handleMuscleGroupChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select muscle group" />
          </SelectTrigger>
          <SelectContent>
            {muscleGroups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
            <SelectItem value="new">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add new muscle group
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        {showNewMuscleGroup && (
          <Input
            value={newMuscleGroup}
            onChange={(e) => setNewMuscleGroup(e.target.value)}
            placeholder="Enter new muscle group name"
            className="mt-2"
          />
        )}
        
        {!isEditing && !showNewMuscleGroup && muscleGroupId && restrictions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowRestrictionsDialog(true)}
            className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
          >
            <Ban className="h-3 w-3" />
            {restrictions.length} {restrictions.length === 1 ? 'restriction' : 'restrictions'}
          </button>
        )}
      </div>
      
      <ViewRestrictionsDialog
        open={showRestrictionsDialog}
        onOpenChange={setShowRestrictionsDialog}
        restrictions={restrictions}
        muscleGroupName={getMuscleGroupById(muscleGroupId)?.name || ""}
      />

      <div className="space-y-2">
        <Label htmlFor="exercise-name">{exerciseType === 'stretch' ? 'Stretch Name' : 'Exercise Name'}</Label>
        <Input
          id="exercise-name"
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          placeholder="e.g., Bench Press, Squats"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <div className="w-full">
          <ToggleGroup 
            type="single" 
            value={exerciseType} 
            onValueChange={(value) => value && setExerciseType(value as 'weight' | 'band' | 'stretch')}
            className="inline-flex border border-input rounded-lg p-1 bg-muted/30 gap-1 w-full"
          >
            <ToggleGroupItem 
              value="weight" 
              className="flex-1 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:shadow-sm data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-background/50 hover:text-foreground"
            >
              Weight
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="band" 
              className="flex-1 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:shadow-sm data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-background/50 hover:text-foreground"
            >
              Band
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="stretch" 
              className="flex-1 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:shadow-sm data-[state=off]:bg-transparent data-[state=off]:text-muted-foreground hover:bg-background/50 hover:text-foreground"
            >
              Stretch
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reps-count">Reps/Duration</Label>
          <Input
            id="reps-count"
            type="number"
            value={repsCount}
            onChange={(e) => setRepsCount(Number(e.target.value))}
            placeholder="e.g., 12, 30"
            min="1"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="reps-unit">Unit</Label>
          <Select value={repsUnit} onValueChange={setRepsUnit}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reps">Reps</SelectItem>
              <SelectItem value="seconds">Seconds</SelectItem>
              <SelectItem value="minutes">Minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Band-specific fields */}
      {exerciseType === 'band' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="band-color">Band Color</Label>
            <Select value={bandColor} onValueChange={setBandColor} required>
              <SelectTrigger id="band-color">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Black">Black</SelectItem>
                <SelectItem value="Blue">Blue</SelectItem>
                <SelectItem value="Purple">Purple</SelectItem>
                <SelectItem value="Red">Red</SelectItem>
                <SelectItem value="Green">Green</SelectItem>
                <SelectItem value="Yellow">Yellow</SelectItem>
                <SelectItem value="Pink">Pink</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="band-type">Band Type</Label>
            <Select value={bandType} onValueChange={setBandType} required>
              <SelectTrigger id="band-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-handle">1-handle</SelectItem>
                <SelectItem value="2-handle">2-handle</SelectItem>
                <SelectItem value="flat">Flat</SelectItem>
                <SelectItem value="figure-8">Figure-8</SelectItem>
                <SelectItem value="double-leg-cuff">Double leg cuff</SelectItem>
                <SelectItem value="single-leg-cuff">Single leg cuff</SelectItem>
                <SelectItem value="ankle-weight">Ankle weight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Weight section - only show for weight exercises */}
      {exerciseType === 'weight' && (
        <div className="space-y-2">
          <div className={`grid gap-4 ${showLeftRight ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="space-y-2">
              <Label htmlFor="weight-count">{showLeftRight ? "Right Weight" : "Weight"}</Label>
              <Input
                id="weight-count"
                type="number"
                value={weightCount}
                onChange={(e) => setWeightCount(Number(e.target.value))}
                min="0"
                step="any"
                placeholder="e.g., 15, 22.5"
              />
            </div>
            {showLeftRight && (
              <div className="space-y-2">
                <Label htmlFor="left-weight">Left Weight</Label>
                <Input
                  id="left-weight"
                  type="number"
                  value={leftWeight ?? 0}
                  onChange={(e) => setLeftWeight(Number(e.target.value))}
                  min="0"
                  step="any"
                  placeholder="e.g., 15, 22.5"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="weight-unit">Weight Unit</Label>
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (showLeftRight) {
                setShowLeftRight(false);
                setLeftWeight(null);
              } else {
                setShowLeftRight(true);
                setLeftWeight(weightCount);
              }
            }}
            className="text-xs h-auto py-1 px-2 text-primary hover:text-white"
          >
            <ArrowLeftRight className="h-3 w-3 mr-0.5" />
            {showLeftRight ? "Reset left/right" : "Set right/left"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="sets">Sets</Label>
        <Input
          id="sets"
          type="number"
          value={sets}
          onChange={(e) => setSets(Number(e.target.value))}
          min="1"
          max="10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Notes (optional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any additional notes or instructions"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Media (optional)</Label>
        <ExerciseMediaUpload
          media={media}
          onMediaChange={setMedia}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !exerciseName.trim() || (!muscleGroupId && !newMuscleGroup.trim())}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
