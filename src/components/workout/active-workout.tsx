import { useState, useEffect } from "react";
import { CheckCircle, Plus, StopCircle, Timer, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ExerciseCard } from "@/components/ui/exercise-card";
import { AddExerciseDialog } from "@/components/workout/add-exercise-dialog";
import { MuscleGroupSuggestions } from "@/components/workout/muscle-group-suggestions";
import { useWorkoutStore } from "@/stores/workoutStore";
import { format } from "date-fns";

export function ActiveWorkout() {
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string | null>(null);
  const [workoutProgress, setWorkoutProgress] = useState(0);
  
  const { 
    activeWorkout, 
    workoutExercises,
    muscleGroups,
    completeExerciseSet, 
    completeWorkout, 
    getWorkoutProgress, 
    getClientById,
    getMuscleGroupById,
    loadWorkoutExercises,
    loadData
  } = useWorkoutStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeWorkout) {
      loadWorkoutExercises(activeWorkout.id);
    }
  }, [activeWorkout, loadWorkoutExercises]);

  useEffect(() => {
    const updateProgress = async () => {
      if (activeWorkout) {
        const progress = await getWorkoutProgress(activeWorkout.id);
        setWorkoutProgress(progress);
      }
    };
    updateProgress();
  }, [activeWorkout, workoutExercises, getWorkoutProgress]);

  if (!activeWorkout) {
    return (
      <div className="text-center py-12">
        <Timer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">No Active Workout</h2>
        <p className="text-muted-foreground">Start a workout to begin tracking your exercises</p>
      </div>
    );
  }

  const client = getClientById(activeWorkout.client_id);
  const exercises = workoutExercises[activeWorkout.id] || [];
  
  // Group exercises by muscle group
  const exercisesByMuscleGroup = exercises.reduce((acc, exercise) => {
    const muscleGroup = getMuscleGroupById(exercise.muscle_group_id);
    const key = muscleGroup?.name || 'Unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(exercise);
    return acc;
  }, {} as Record<string, typeof exercises>);

  // Get all default muscle groups
  const defaultMuscleGroups = muscleGroups.filter(mg => mg.default_group);
  
  // Create a map of muscle group ID to exercises for quick lookup
  const exercisesByMuscleGroupId = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.muscle_group_id]) {
      acc[exercise.muscle_group_id] = [];
    }
    acc[exercise.muscle_group_id].push(exercise);
    return acc;
  }, {} as Record<string, typeof exercises>);

  const handleAddExerciseForMuscleGroup = (muscleGroupId: string) => {
    setSelectedMuscleGroupId(muscleGroupId);
    setShowAddExercise(true);
  };

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
              <div className="text-2xl font-bold">{workoutProgress}%</div>
              <div className="text-sm opacity-90">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={workoutProgress} className="bg-primary-foreground/20 [&>div]:bg-primary-foreground" />
            
            <div className="flex items-center justify-between">
              <p className="text-sm opacity-90">
                {exercises.length} exercises • {
                  exercises.reduce((sum, ex) => sum + ex.completed_sets, 0)
                } / {
                  exercises.reduce((sum, ex) => sum + ex.set_count, 0)
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
                
                {workoutProgress === 100 && (
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

      {/* Muscle Groups Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Muscle Groups
          </CardTitle>
          <CardDescription>
            Track your workout across all major muscle groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {defaultMuscleGroups.map((muscleGroup) => {
              const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];
              const hasExercises = groupExercises.length > 0;
              
              return (
                <MuscleGroupSuggestions
                  key={muscleGroup.id}
                  muscleGroup={muscleGroup}
                  clientId={activeWorkout.client_id}
                  workoutId={activeWorkout.id}
                  hasExistingExercises={hasExercises}
                  onAddExercise={() => handleAddExerciseForMuscleGroup(muscleGroup.id)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Exercises by Muscle Group */}
      {Object.entries(exercisesByMuscleGroup).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Exercises</h2>
          {Object.entries(exercisesByMuscleGroup).map(([muscleGroupName, exercises]) => (
            <Card key={muscleGroupName} className="border-accent">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{muscleGroupName}</CardTitle>
                <CardDescription>
                  {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} • {
                    exercises.reduce((sum, ex) => sum + ex.completed_sets, 0)
                  } / {
                    exercises.reduce((sum, ex) => sum + ex.set_count, 0)
                  } sets completed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exerciseName={exercise.exercise_name}
                    reps={exercise.reps}
                    completedSets={exercise.completed_sets}
                    totalSets={exercise.set_count}
                    unit={exercise.unit}
                    note={exercise.note}
                    muscleGroup={muscleGroupName}
                    isCompleted={exercise.is_completed}
                    onCompleteSet={() => handleCompleteSet(exercise.id)}
                    isActive={true}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {exercises.length === 0 && (
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
        onOpenChange={(open) => {
          setShowAddExercise(open);
          if (!open) setSelectedMuscleGroupId(null);
        }}
        workoutId={activeWorkout.id}
        preselectedMuscleGroupId={selectedMuscleGroupId || undefined}
      />
    </div>
  );
}