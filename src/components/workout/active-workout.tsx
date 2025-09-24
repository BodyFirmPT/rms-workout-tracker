import { useState } from "react";
import { CheckCircle, Plus, StopCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ExerciseCard } from "@/components/ui/exercise-card";
import { AddExerciseDialog } from "@/components/workout/add-exercise-dialog";
import { useWorkoutStore } from "@/stores/workoutStore";
import { format } from "date-fns";

export function ActiveWorkout() {
  const [showAddExercise, setShowAddExercise] = useState(false);
  const { 
    activeWorkout, 
    completeExerciseSet, 
    completeWorkout, 
    getWorkoutProgress, 
    getClientById 
  } = useWorkoutStore();

  if (!activeWorkout) {
    return (
      <div className="text-center py-12">
        <Timer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">No Active Workout</h2>
        <p className="text-muted-foreground">Start a workout to begin tracking your exercises</p>
      </div>
    );
  }

  const client = getClientById(activeWorkout.clientId);
  const progress = getWorkoutProgress(activeWorkout.id);
  
  // Group exercises by muscle group
  const exercisesByMuscleGroup = activeWorkout.exercises.reduce((acc, exercise) => {
    const key = exercise.muscleGroupName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(exercise);
    return acc;
  }, {} as Record<string, typeof activeWorkout.exercises>);

  const handleCompleteSet = (exerciseId: string) => {
    completeExerciseSet(activeWorkout.id, exerciseId);
  };

  const handleCompleteWorkout = () => {
    completeWorkout();
  };

  return (
    <div className="space-y-6">
      {/* Workout Header */}
      <Card className="bg-primary-gradient text-primary-foreground shadow-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                {activeWorkout.note}
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                {client?.name} • {format(new Date(activeWorkout.date), 'MMMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{progress}%</div>
              <div className="text-sm opacity-90">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="bg-primary-foreground/20 [&>div]:bg-primary-foreground" />
            
            <div className="flex items-center justify-between">
              <p className="text-sm opacity-90">
                {activeWorkout.exercises.length} exercises • {
                  activeWorkout.exercises.reduce((sum, ex) => sum + ex.completedSets, 0)
                } / {
                  activeWorkout.exercises.reduce((sum, ex) => sum + ex.setCount, 0)
                } sets completed
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddExercise(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
                
                {progress === 100 && (
                  <Button
                    variant="secondary" 
                    size="sm"
                    onClick={handleCompleteWorkout}
                    className="bg-success text-success-foreground hover:bg-success/90"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Workout
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercises by Muscle Group */}
      {Object.entries(exercisesByMuscleGroup).map(([muscleGroup, exercises]) => (
        <Card key={muscleGroup}>
          <CardHeader>
            <CardTitle className="text-lg">{muscleGroup}</CardTitle>
            <CardDescription>
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exerciseName={exercise.exerciseName}
                reps={exercise.reps}
                completedSets={exercise.completedSets}
                totalSets={exercise.setCount}
                unit={exercise.unit}
                note={exercise.note}
                muscleGroup={exercise.muscleGroupName}
                isCompleted={exercise.isCompleted}
                onCompleteSet={() => handleCompleteSet(exercise.id)}
                isActive={true}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      {activeWorkout.exercises.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Plus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Exercises Yet</h3>
            <p className="text-muted-foreground mb-6">Add your first exercise to get started</p>
            <Button onClick={() => setShowAddExercise(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </CardContent>
        </Card>
      )}

      <AddExerciseDialog
        open={showAddExercise}
        onOpenChange={setShowAddExercise}
        workoutId={activeWorkout.id}
      />
    </div>
  );
}