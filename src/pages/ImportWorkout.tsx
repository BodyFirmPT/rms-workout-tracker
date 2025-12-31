import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, CheckCircle, AlertCircle, CalendarIcon, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useWorkoutStore } from "@/stores/workoutStore";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseForm } from "@/components/workout/exercise-form";
import { CreateWorkoutExerciseInput } from "@/types/workout";

interface ParsedExercise {
  muscle_group: string | null;
  muscle_group_id?: string;
  exercise_name: string;
  reps_count: number;
  reps_unit: string;
  weight_count: number;
  weight_unit: string;
  left_weight: number | null;
  set_count: number;
  type: 'weight' | 'band' | 'stretch';
  band_color: string | null;
  band_type: string | null;
  note: string;
  raw_import_data: string;
  hasError?: boolean;
}

interface ImportedWorkout {
  id: string;
  date: string;
  exerciseCount: number;
}

export default function ImportWorkout() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getClientById, loadData, addMuscleGroup, muscleGroups } = useWorkoutStore();
  
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedExercises, setParsedExercises] = useState<ParsedExercise[]>([]);
  const [parsedDate, setParsedDate] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [importedWorkouts, setImportedWorkouts] = useState<ImportedWorkout[]>([]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const client = clientId ? getClientById(clientId) : null;
  const editingExercise = editingIndex !== null ? parsedExercises[editingIndex] : null;
  const hasExerciseErrors = parsedExercises.some(ex => ex.hasError);

  const handleParse = async () => {
    if (!rawText.trim()) {
      toast({
        title: "No data",
        description: "Please paste workout data to import.",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setParsedExercises([]);
    setParsedDate(null);

    try {
      // Pass muscle group names to the edge function
      const muscleGroupNames = muscleGroups.map(mg => mg.name);
      
      const { data, error } = await supabase.functions.invoke('parse-workout-import', {
        body: { rawText, muscleGroups: muscleGroupNames },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.exercises || data.exercises.length === 0) {
        throw new Error("No exercises could be parsed from the provided text.");
      }

      // Match muscle groups to existing ones and mark errors
      const exercisesWithMuscleGroupIds = data.exercises.map((ex: ParsedExercise) => {
        const matchedGroup = ex.muscle_group 
          ? muscleGroups.find(mg => mg.name.toLowerCase() === ex.muscle_group!.toLowerCase())
          : null;
        
        return {
          ...ex,
          muscle_group_id: matchedGroup?.id || undefined,
          hasError: !matchedGroup,
        };
      });

      setParsedExercises(exercisesWithMuscleGroupIds);
      setParsedDate(data.date);
      
      const errorCount = exercisesWithMuscleGroupIds.filter((ex: ParsedExercise) => ex.hasError).length;
      
      toast({
        title: "Parsing complete",
        description: `Found ${data.exercises.length} exercises${data.date ? ` for ${format(new Date(data.date + 'T00:00:00'), 'MMM d, yyyy')}` : ''}${errorCount > 0 ? `. ${errorCount} need muscle group selection.` : ''}.`,
        variant: errorCount > 0 ? "default" : "default",
      });
    } catch (error) {
      console.error("Parse error:", error);
      setParseError(error instanceof Error ? error.message : "Failed to parse workout data");
      toast({
        title: "Parse failed",
        description: error instanceof Error ? error.message : "Failed to parse workout data",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleEditSubmit = async (exerciseData: CreateWorkoutExerciseInput, newMuscleGroupName?: string) => {
    if (editingIndex === null) return;

    // Get muscle group name and determine if we have a valid muscle group
    let muscleGroupName: string | null = editingExercise?.muscle_group || null;
    let muscleGroupId = exerciseData.muscle_group_id;
    let hasError = true;

    if (newMuscleGroupName) {
      muscleGroupName = newMuscleGroupName;
      muscleGroupId = undefined; // Will be created on import
      hasError = false; // New muscle group will be created
    } else if (muscleGroupId) {
      const group = muscleGroups.find(mg => mg.id === muscleGroupId);
      if (group) {
        muscleGroupName = group.name;
        hasError = false;
      }
    }

    const updatedExercise: ParsedExercise = {
      muscle_group: muscleGroupName,
      muscle_group_id: muscleGroupId,
      exercise_name: exerciseData.exercise_name,
      reps_count: exerciseData.reps_count,
      reps_unit: exerciseData.reps_unit,
      weight_count: exerciseData.weight_count,
      weight_unit: exerciseData.weight_unit,
      left_weight: exerciseData.left_weight ?? null,
      set_count: exerciseData.set_count,
      type: (exerciseData.type === 'exercise' ? 'weight' : exerciseData.type) || 'weight',
      band_color: exerciseData.band_color || null,
      band_type: exerciseData.band_type || null,
      note: exerciseData.note || "",
      raw_import_data: editingExercise?.raw_import_data || "",
      hasError,
    };

    setParsedExercises(prev => {
      const updated = [...prev];
      updated[editingIndex] = updatedExercise;
      return updated;
    });

    setEditingIndex(null);
    toast({
      title: "Exercise updated",
      description: "The exercise has been updated.",
    });
  };

  const handleDeleteExercise = (index: number) => {
    setParsedExercises(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Exercise removed",
      description: "The exercise has been removed from the import.",
    });
  };

  const handleImport = async () => {
    if (!clientId || parsedExercises.length === 0) return;

    if (!parsedDate) {
      toast({
        title: "No date found",
        description: "Please include a date in the pasted data (e.g., 'Date: 1/15/2019').",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      // Create the workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout')
        .insert({
          client_id: clientId,
          date: parsedDate,
          note: 'Imported workout',
          status: 'completed',
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Get or create muscle groups and insert exercises
      for (const exercise of parsedExercises) {
        // Find existing muscle group or create new one
        let muscleGroupId = exercise.muscle_group_id || muscleGroups.find(
          mg => mg.name.toLowerCase() === exercise.muscle_group.toLowerCase()
        )?.id;

        if (!muscleGroupId) {
          muscleGroupId = await addMuscleGroup(exercise.muscle_group, false);
        }

        // Insert the exercise
        const { error: exerciseError } = await supabase
          .from('workout_exercise')
          .insert({
            workout_id: workoutData.id,
            muscle_group_id: muscleGroupId,
            exercise_name: exercise.exercise_name,
            reps_count: exercise.reps_count,
            reps_unit: exercise.reps_unit,
            weight_count: exercise.weight_count,
            weight_unit: exercise.weight_unit,
            left_weight: exercise.left_weight,
            set_count: exercise.set_count,
            completed_sets: exercise.set_count,
            is_completed: true,
            type: exercise.type,
            band_color: exercise.band_color,
            band_type: exercise.band_type,
            note: exercise.note,
            raw_import_data: exercise.raw_import_data,
            reps: String(exercise.reps_count),
            unit: exercise.weight_unit,
            count: exercise.weight_count,
          });

        if (exerciseError) {
          console.error("Exercise insert error:", exerciseError);
          throw exerciseError;
        }
      }

      // Add to imported workouts list
      setImportedWorkouts(prev => [
        {
          id: workoutData.id,
          date: parsedDate,
          exerciseCount: parsedExercises.length,
        },
        ...prev,
      ]);

      // Reset the form for another import
      setRawText("");
      setParsedExercises([]);
      setParsedDate(null);
      setParseError(null);

      toast({
        title: "Import successful",
        description: `Created workout with ${parsedExercises.length} exercises for ${format(new Date(parsedDate + 'T00:00:00'), 'MMM d, yyyy')}.`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import workout",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getEditInitialValues = () => {
    if (!editingExercise) return undefined;
    
    // Find muscle group ID if we have it, otherwise find by name
    let muscleGroupId = editingExercise.muscle_group_id;
    if (!muscleGroupId) {
      const matchedGroup = muscleGroups.find(
        mg => mg.name.toLowerCase() === editingExercise.muscle_group.toLowerCase()
      );
      muscleGroupId = matchedGroup?.id;
    }

    return {
      exerciseName: editingExercise.exercise_name,
      muscleGroupId: muscleGroupId || "",
      exerciseType: editingExercise.type as 'weight' | 'band' | 'stretch',
      repsCount: editingExercise.reps_count,
      repsUnit: editingExercise.reps_unit,
      weightCount: editingExercise.weight_count,
      weightUnit: editingExercise.weight_unit,
      leftWeight: editingExercise.left_weight,
      sets: editingExercise.set_count,
      note: editingExercise.note,
      bandColor: editingExercise.band_color || "",
      bandType: editingExercise.band_type || "",
    };
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <p className="text-muted-foreground">Client not found</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/client/${clientId}`)}
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {client.name}
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground">Import Historical Workout</h1>
          <p className="text-muted-foreground mt-2">
            Paste workout data to import it for {client.name}. Include the date in the data.
          </p>
        </div>

        <div className="space-y-6">
          {/* Raw Text Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workout Data</CardTitle>
              <CardDescription>
                Paste the workout details below. Include the date (e.g., "Date: 1/15/2019"). The AI will parse the exercises from natural language.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="raw-text">Raw workout data</Label>
                <Textarea
                  id="raw-text"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste workout data here... Include the date, e.g.:&#10;Date: 1/15/2019&#10;Abdominal, Ab Rollouts, 15 reps&#10;Chest, Push-ups, 20 reps"
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              
              <Button 
                onClick={handleParse} 
                disabled={isParsing || !rawText.trim()}
                className="w-full sm:w-auto"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Parse Workout Data
                  </>
                )}
              </Button>

              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{parseError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parsed Results */}
          {parsedExercises.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {hasExerciseErrors ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  Parsed Exercises ({parsedExercises.length})
                </CardTitle>
                <CardDescription className="flex flex-col gap-1">
                  {parsedDate ? (
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Workout date: {format(new Date(parsedDate + 'T00:00:00'), 'MMMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-destructive">No date found in the data. Please include a date.</span>
                  )}
                  {hasExerciseErrors && (
                    <span className="text-destructive">
                      {parsedExercises.filter(e => e.hasError).length} exercise(s) need a muscle group selected before importing.
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Click an exercise to edit it before importing.</p>
                <div className="divide-y divide-border rounded-md border">
                  {parsedExercises.map((exercise, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "p-3 space-y-1 hover:bg-muted/50 cursor-pointer group",
                        exercise.hasError && "bg-destructive/5 border-l-2 border-l-destructive"
                      )}
                      onClick={() => setEditingIndex(index)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium flex items-center gap-2">
                            {exercise.exercise_name}
                            {exercise.hasError && (
                              <span className="text-xs text-destructive font-normal">(needs muscle group)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {exercise.hasError ? (
                              <span className="text-destructive">No muscle group</span>
                            ) : (
                              exercise.muscle_group
                            )}
                            {" · "}{exercise.set_count} sets × {exercise.reps_count} {exercise.reps_unit}
                            {exercise.weight_count > 0 && ` @ ${exercise.weight_count} ${exercise.weight_unit}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            exercise.type === 'weight' && "bg-blue-500/10 text-blue-600",
                            exercise.type === 'band' && "bg-purple-500/10 text-purple-600",
                            exercise.type === 'stretch' && "bg-green-500/10 text-green-600",
                          )}>
                            {exercise.type}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0",
                              exercise.hasError ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingIndex(index);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExercise(index);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {exercise.note && (
                        <p className="text-xs text-muted-foreground italic">{exercise.note}</p>
                      )}
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || !parsedDate || hasExerciseErrors}
                  className="w-full"
                  size="lg"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : hasExerciseErrors ? (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Fix {parsedExercises.filter(e => e.hasError).length} Exercise(s) Before Importing
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Import {parsedExercises.length} Exercises
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Imported Workouts List */}
          {importedWorkouts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Imported Workouts ({importedWorkouts.length})
                </CardTitle>
                <CardDescription>
                  Workouts imported during this session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border rounded-md border">
                  {importedWorkouts.map((workout) => (
                    <div 
                      key={workout.id} 
                      className="p-3 flex items-center justify-between hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">
                          {format(new Date(workout.date + 'T00:00:00'), 'MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {workout.exerciseCount} exercises
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/workout/${workout.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Exercise Dialog */}
        <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Edit Exercise</DialogTitle>
              <DialogDescription>
                Update the exercise details before importing.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 -mx-6 px-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent">
              {editingExercise?.raw_import_data && (
                <div className="mb-4 p-3 bg-muted/50 rounded-md border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Original Import Data</p>
                  <p className="text-sm font-mono">{editingExercise.raw_import_data}</p>
                </div>
              )}
              {editingIndex !== null && (
                <ExerciseForm
                  onSubmit={handleEditSubmit}
                  onCancel={() => setEditingIndex(null)}
                  initialValues={getEditInitialValues()}
                  submitLabel="Update Exercise"
                  isEditing={true}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
