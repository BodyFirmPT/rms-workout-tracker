import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, CheckCircle, AlertCircle, CalendarIcon, Edit, Trash2, Eye, ChevronLeft, ChevronRight, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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

interface ParsedWorkout {
  date: string | null;
  exercises: ParsedExercise[];
  status: 'pending' | 'imported' | 'skipped';
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
  const [parsedWorkouts, setParsedWorkouts] = useState<ParsedWorkout[]>([]);
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [importedWorkouts, setImportedWorkouts] = useState<ImportedWorkout[]>([]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const client = clientId ? getClientById(clientId) : null;
  const currentWorkout = parsedWorkouts[currentWorkoutIndex];
  const editingExercise = editingIndex !== null && currentWorkout ? currentWorkout.exercises[editingIndex] : null;
  const hasExerciseErrors = currentWorkout?.exercises.some(ex => ex.hasError) || false;
  const pendingWorkouts = parsedWorkouts.filter(w => w.status === 'pending');
  const hasMoreWorkouts = pendingWorkouts.length > 0;

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
    setParsedWorkouts([]);
    setCurrentWorkoutIndex(0);

    try {
      const muscleGroupNames = muscleGroups.map(mg => mg.name);
      
      const { data, error } = await supabase.functions.invoke('parse-workout-import', {
        body: { rawText, muscleGroups: muscleGroupNames },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.workouts || data.workouts.length === 0) {
        throw new Error("No workouts could be parsed from the provided text.");
      }

      // Match muscle groups to existing ones and mark errors for each workout
      const workoutsWithMuscleGroupIds: ParsedWorkout[] = data.workouts.map((workout: any) => {
        const exercisesWithIds = workout.exercises.map((ex: ParsedExercise) => {
          const matchedGroup = ex.muscle_group 
            ? muscleGroups.find(mg => mg.name.toLowerCase() === ex.muscle_group!.toLowerCase())
            : null;
          
          return {
            ...ex,
            muscle_group_id: matchedGroup?.id || undefined,
            hasError: !matchedGroup,
          };
        });

        return {
          date: workout.date,
          exercises: exercisesWithIds,
          status: 'pending' as const,
        };
      });

      setParsedWorkouts(workoutsWithMuscleGroupIds);
      setCurrentWorkoutIndex(0);
      
      const totalExercises = workoutsWithMuscleGroupIds.reduce((sum: number, w: ParsedWorkout) => sum + w.exercises.length, 0);
      const totalErrors = workoutsWithMuscleGroupIds.reduce((sum: number, w: ParsedWorkout) => 
        sum + w.exercises.filter(e => e.hasError).length, 0);
      
      toast({
        title: "Parsing complete",
        description: `Found ${workoutsWithMuscleGroupIds.length} workout${workoutsWithMuscleGroupIds.length > 1 ? 's' : ''} with ${totalExercises} total exercises${totalErrors > 0 ? `. ${totalErrors} need muscle group selection.` : ''}.`,
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
    if (editingIndex === null || !currentWorkout) return;

    let muscleGroupName: string | null = editingExercise?.muscle_group || null;
    let muscleGroupId = exerciseData.muscle_group_id;
    let hasError = true;

    if (newMuscleGroupName) {
      muscleGroupName = newMuscleGroupName;
      muscleGroupId = undefined;
      hasError = false;
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

    setParsedWorkouts(prev => {
      const updated = [...prev];
      const workoutExercises = [...updated[currentWorkoutIndex].exercises];
      workoutExercises[editingIndex] = updatedExercise;
      updated[currentWorkoutIndex] = { ...updated[currentWorkoutIndex], exercises: workoutExercises };
      return updated;
    });

    setEditingIndex(null);
    toast({
      title: "Exercise updated",
      description: "The exercise has been updated.",
    });
  };

  const handleDeleteExercise = (index: number) => {
    setParsedWorkouts(prev => {
      const updated = [...prev];
      const workoutExercises = updated[currentWorkoutIndex].exercises.filter((_, i) => i !== index);
      updated[currentWorkoutIndex] = { ...updated[currentWorkoutIndex], exercises: workoutExercises };
      return updated;
    });
    toast({
      title: "Exercise removed",
      description: "The exercise has been removed from the import.",
    });
  };

  const handleImportCurrentWorkout = async () => {
    if (!clientId || !currentWorkout || currentWorkout.exercises.length === 0) return;

    if (!currentWorkout.date) {
      toast({
        title: "No date found",
        description: "This workout has no date. Please include a date in the pasted data.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout')
        .insert({
          client_id: clientId,
          date: currentWorkout.date,
          note: 'Imported workout',
          status: 'completed',
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      for (const exercise of currentWorkout.exercises) {
        let muscleGroupId = exercise.muscle_group_id || muscleGroups.find(
          mg => mg.name.toLowerCase() === exercise.muscle_group?.toLowerCase()
        )?.id;

        if (!muscleGroupId && exercise.muscle_group) {
          muscleGroupId = await addMuscleGroup(exercise.muscle_group, false);
        }

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
          date: currentWorkout.date!,
          exerciseCount: currentWorkout.exercises.length,
        },
        ...prev,
      ]);

      // Mark current workout as imported
      setParsedWorkouts(prev => {
        const updated = [...prev];
        updated[currentWorkoutIndex] = { ...updated[currentWorkoutIndex], status: 'imported' };
        return updated;
      });

      toast({
        title: "Import successful",
        description: `Created workout with ${currentWorkout.exercises.length} exercises for ${format(new Date(currentWorkout.date + 'T00:00:00'), 'MMM d, yyyy')}.`,
      });

      // Move to next pending workout
      moveToNextPendingWorkout();
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

  const handleSkipCurrentWorkout = () => {
    setParsedWorkouts(prev => {
      const updated = [...prev];
      updated[currentWorkoutIndex] = { ...updated[currentWorkoutIndex], status: 'skipped' };
      return updated;
    });

    toast({
      title: "Workout skipped",
      description: "This workout has been skipped.",
    });

    moveToNextPendingWorkout();
  };

  const moveToNextPendingWorkout = () => {
    const nextPendingIndex = parsedWorkouts.findIndex((w, i) => i > currentWorkoutIndex && w.status === 'pending');
    if (nextPendingIndex !== -1) {
      setCurrentWorkoutIndex(nextPendingIndex);
    } else {
      // Check if there are any pending workouts at all
      const anyPendingIndex = parsedWorkouts.findIndex(w => w.status === 'pending');
      if (anyPendingIndex !== -1 && anyPendingIndex !== currentWorkoutIndex) {
        setCurrentWorkoutIndex(anyPendingIndex);
      } else {
        // All done - reset
        setRawText("");
        setParsedWorkouts([]);
        setCurrentWorkoutIndex(0);
      }
    }
  };

  const handleClearAll = () => {
    setRawText("");
    setParsedWorkouts([]);
    setCurrentWorkoutIndex(0);
    setParseError(null);
  };

  const getEditInitialValues = () => {
    if (!editingExercise) return undefined;
    
    let muscleGroupId = editingExercise.muscle_group_id;
    if (!muscleGroupId && editingExercise.muscle_group) {
      const matchedGroup = muscleGroups.find(
        mg => mg.name.toLowerCase() === editingExercise.muscle_group!.toLowerCase()
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
          
          <h1 className="text-3xl font-bold text-foreground">Import Historical Workouts</h1>
          <p className="text-muted-foreground mt-2">
            Paste workout data (up to 10 workouts) for {client.name}. Each workout should include a date.
          </p>
        </div>

        <div className="space-y-6">
          {/* Raw Text Input - only show when no workouts are being reviewed */}
          {pendingWorkouts.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workout Data</CardTitle>
                <CardDescription>
                  Paste one or more workouts below. Include dates (e.g., "Date: 1/15/2019") to separate multiple workouts. Up to 10 workouts can be imported at once.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="raw-text">Raw workout data</Label>
                  <Textarea
                    id="raw-text"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste workout data here... Include dates to separate workouts, e.g.:&#10;&#10;Date: 1/15/2019&#10;Abdominal, Ab Rollouts, 15 reps&#10;Chest, Push-ups, 20 reps&#10;&#10;Date: 1/17/2019&#10;Back, Pull-ups, 10 reps&#10;Biceps, Curls, 12 reps @ 25 lbs"
                    rows={14}
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
          )}

          {/* Workout Review Section */}
          {pendingWorkouts.length > 0 && currentWorkout && currentWorkout.status === 'pending' && (
            <>
              {/* Workout Navigation */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        Reviewing workout {parsedWorkouts.filter((w, i) => i <= currentWorkoutIndex && w.status === 'pending').length} of {pendingWorkouts.length} remaining
                      </span>
                      <div className="flex gap-1">
                        {parsedWorkouts.map((workout, index) => (
                          <button
                            key={index}
                            onClick={() => workout.status === 'pending' && setCurrentWorkoutIndex(index)}
                            className={cn(
                              "w-3 h-3 rounded-full transition-colors",
                              index === currentWorkoutIndex && "ring-2 ring-offset-2 ring-primary",
                              workout.status === 'imported' && "bg-green-500",
                              workout.status === 'skipped' && "bg-muted-foreground/50",
                              workout.status === 'pending' && index === currentWorkoutIndex && "bg-primary",
                              workout.status === 'pending' && index !== currentWorkoutIndex && "bg-muted-foreground/30 hover:bg-muted-foreground/50 cursor-pointer"
                            )}
                            disabled={workout.status !== 'pending'}
                            title={`Workout ${index + 1}: ${workout.date || 'No date'} (${workout.status})`}
                          />
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClearAll}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel All
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current Workout */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {hasExerciseErrors ? (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      Parsed Exercises ({currentWorkout.exercises.length})
                    </span>
                    <Badge variant="outline" className="font-normal">
                      {currentWorkout.date 
                        ? format(new Date(currentWorkout.date + 'T00:00:00'), 'MMMM d, yyyy')
                        : 'No date found'
                      }
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex flex-col gap-1">
                    {currentWorkout.date ? (
                      <span className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Workout date: {format(new Date(currentWorkout.date + 'T00:00:00'), 'MMMM d, yyyy')}
                      </span>
                    ) : (
                      <span className="text-destructive">No date found in the data. This workout cannot be imported.</span>
                    )}
                    {hasExerciseErrors && (
                      <span className="text-destructive">
                        {currentWorkout.exercises.filter(e => e.hasError).length} exercise(s) need a muscle group selected before importing.
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Click an exercise to edit it before importing.</p>
                  <div className="divide-y divide-border rounded-md border">
                    {currentWorkout.exercises.map((exercise, index) => (
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

                  <div className="flex gap-3">
                    <Button 
                      onClick={handleImportCurrentWorkout} 
                      disabled={isImporting || !currentWorkout.date || hasExerciseErrors}
                      className="flex-1"
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
                          Fix {currentWorkout.exercises.filter(e => e.hasError).length} Exercise(s)
                        </>
                      ) : !currentWorkout.date ? (
                        <>
                          <AlertCircle className="mr-2 h-4 w-4" />
                          No Date - Cannot Import
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Import This Workout
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleSkipCurrentWorkout}
                      disabled={isImporting}
                    >
                      Skip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
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
