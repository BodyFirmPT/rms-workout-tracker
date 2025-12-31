import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, CheckCircle, AlertCircle, CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useWorkoutStore } from "@/stores/workoutStore";
import { supabase } from "@/integrations/supabase/client";

interface ParsedExercise {
  muscle_group: string;
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const client = clientId ? getClientById(clientId) : null;

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
      const { data, error } = await supabase.functions.invoke('parse-workout-import', {
        body: { rawText },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.exercises || data.exercises.length === 0) {
        throw new Error("No exercises could be parsed from the provided text.");
      }

      setParsedExercises(data.exercises);
      setParsedDate(data.date);
      
      toast({
        title: "Parsing complete",
        description: `Found ${data.exercises.length} exercises${data.date ? ` for ${format(new Date(data.date + 'T00:00:00'), 'MMM d, yyyy')}` : ''}.`,
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
        let muscleGroupId = muscleGroups.find(
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
            completed_sets: exercise.set_count, // Mark as completed since it's historical
            is_completed: true,
            type: exercise.type,
            band_color: exercise.band_color,
            band_type: exercise.band_type,
            note: exercise.note,
            raw_import_data: exercise.raw_import_data,
            // Legacy fields - required by schema
            reps: String(exercise.reps_count),
            unit: exercise.weight_unit,
            count: exercise.weight_count,
          });

        if (exerciseError) {
          console.error("Exercise insert error:", exerciseError);
          throw exerciseError;
        }
      }

      toast({
        title: "Import successful",
        description: `Created workout with ${parsedExercises.length} exercises.`,
      });

      // Navigate to the workout
      navigate(`/workout/${workoutData.id}`);
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
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Parsed Exercises ({parsedExercises.length})
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {parsedDate ? (
                    <>
                      <CalendarIcon className="h-4 w-4" />
                      Workout date: {format(new Date(parsedDate + 'T00:00:00'), 'MMMM d, yyyy')}
                    </>
                  ) : (
                    <span className="text-destructive">No date found in the data. Please include a date.</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="divide-y divide-border rounded-md border">
                  {parsedExercises.map((exercise, index) => (
                    <div key={index} className="p-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{exercise.exercise_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {exercise.muscle_group} · {exercise.set_count} sets × {exercise.reps_count} {exercise.reps_unit}
                            {exercise.weight_count > 0 && ` @ ${exercise.weight_count} ${exercise.weight_unit}`}
                          </p>
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          exercise.type === 'weight' && "bg-blue-500/10 text-blue-600",
                          exercise.type === 'band' && "bg-purple-500/10 text-purple-600",
                          exercise.type === 'stretch' && "bg-green-500/10 text-green-600",
                        )}>
                          {exercise.type}
                        </span>
                      </div>
                      {exercise.note && (
                        <p className="text-xs text-muted-foreground italic">{exercise.note}</p>
                      )}
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || !parsedDate}
                  className="w-full"
                  size="lg"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
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
        </div>
      </div>
    </div>
  );
}
