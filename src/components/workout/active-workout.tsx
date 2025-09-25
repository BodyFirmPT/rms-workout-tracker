import { useState, useEffect } from "react";
import { CheckCircle, Plus, StopCircle, Timer, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExerciseCard } from "@/components/ui/exercise-card";
import { AddExerciseDialog } from "@/components/workout/add-exercise-dialog";
import { MuscleGroupSuggestions } from "@/components/workout/muscle-group-suggestions";
import { useWorkoutStore } from "@/stores/workoutStore";
import { format } from "date-fns";
import { CreateWorkoutExerciseInput } from "@/types/workout";

interface ActiveWorkoutProps {
  workoutId?: string; // For viewing specific workouts
}

export function ActiveWorkout({ workoutId }: ActiveWorkoutProps) {
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string | null>(null);
  const [workoutProgress, setWorkoutProgress] = useState(0);
  
  const { 
    activeWorkout, 
    workouts,
    workoutExercises,
    muscleGroups,
    completeExerciseSet, 
    completeWorkout, 
    getWorkoutProgress, 
    getClientById,
    getMuscleGroupById,
    loadWorkoutExercises,
    loadData,
    deleteExercise,
    updateExercise,
    addExerciseToWorkout,
    getClientExerciseHistory
  } = useWorkoutStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Determine which workout to display
  const currentWorkout = workoutId ? workouts.find(w => w.id === workoutId) : activeWorkout;
  const isViewingMode = !!workoutId; // If workoutId is provided, we're in viewing mode

  useEffect(() => {
    if (currentWorkout) {
      loadWorkoutExercises(currentWorkout.id);
    }
  }, [currentWorkout, loadWorkoutExercises]);

  useEffect(() => {
    const updateProgress = async () => {
      if (currentWorkout) {
        const progress = await getWorkoutProgress(currentWorkout.id);
        setWorkoutProgress(progress);
      }
    };
    updateProgress();
  }, [currentWorkout, workoutExercises, getWorkoutProgress]);

  if (!currentWorkout) {
    return (
      <div className="text-center py-12">
        <Timer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {workoutId ? "Workout Not Found" : "No Active Workout"}
        </h2>
        <p className="text-muted-foreground">
          {workoutId ? "This workout could not be found" : "Start a workout to begin tracking your exercises"}
        </p>
      </div>
    );
  }

  const client = getClientById(currentWorkout.client_id);
  const exercises = workoutExercises[currentWorkout.id] || [];
  
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
    setSelectedMuscleGroupId(muscleGroupId || null);
    setShowAddExercise(true);
  };

  const handleCompleteSet = (exerciseId: string) => {
    if (!isViewingMode) {
      completeExerciseSet(currentWorkout.id, exerciseId);
    }
  };

  const handleCompleteWorkout = () => {
    completeWorkout();
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (!isViewingMode) {
      deleteExercise(currentWorkout.id, exerciseId);
    }
  };

  const handleEditExercise = (exerciseId: string) => {
    // For now, we'll open the add exercise dialog with the exercise data pre-filled
    // In a real app, you'd want a separate edit dialog
    setShowAddExercise(true);
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
                {currentWorkout.note}
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                {client?.name} • {format(new Date(currentWorkout.date), 'MMMM d, yyyy')}
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
                {!isViewingMode && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddExercise(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </Button>
                )}
                
                {!isViewingMode && workoutProgress === 100 && (
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

      {/* Exercises Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Exercises
          </CardTitle>
          <CardDescription>
            Add exercises to your workout by muscle group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Default muscle groups */}
            {defaultMuscleGroups.map((muscleGroup) => {
              const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];
              const hasExercises = groupExercises.length > 0;
              
              if (hasExercises) {
                // Show added exercises for this muscle group
                return (
                  <Card key={muscleGroup.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-medium">{muscleGroup.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {groupExercises.length} exercise{groupExercises.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddExerciseForMuscleGroup(muscleGroup.id)}
                          className="h-7 px-2 text-xs"
                          disabled={isViewingMode}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {groupExercises.map((exercise) => (
                        <ExerciseCard
                          key={exercise.id}
                          exerciseName={exercise.exercise_name}
                          reps={exercise.reps}
                          completedSets={exercise.completed_sets}
                          totalSets={exercise.set_count}
                          unit={exercise.unit}
                          note={exercise.note}
                          muscleGroup={muscleGroup.name}
                          isCompleted={exercise.is_completed}
                          onCompleteSet={!isViewingMode ? () => handleCompleteSet(exercise.id) : undefined}
                          onEdit={!isViewingMode ? () => handleEditExercise(exercise.id) : undefined}
                          onDelete={!isViewingMode ? () => handleDeleteExercise(exercise.id) : undefined}
                          isActive={true}
                        />
                      ))}
                    </CardContent>
                  </Card>
                );
              } else {
                // Show muscle group suggestions
                return (
                    <MuscleGroupSuggestions
                      key={muscleGroup.id}
                      muscleGroup={muscleGroup}
                      clientId={currentWorkout.client_id}
                      workoutId={currentWorkout.id}
                      hasExistingExercises={false}
                      onAddExercise={() => handleAddExerciseForMuscleGroup(muscleGroup.id)}
                      disabled={isViewingMode}
                    />
                );
              }
            })}

            {/* Non-default muscle groups with exercises */}
            {Object.entries(exercisesByMuscleGroup).map(([muscleGroupName, exercises]) => {
              const muscleGroup = muscleGroups.find(mg => mg.name === muscleGroupName);
              if (!muscleGroup || muscleGroup.default_group) return null;
              
              return (
                <Card key={muscleGroupName}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-medium">{muscleGroupName}</CardTitle>
                        <Badge variant="outline" className="text-xs">Custom</Badge>
                        <Badge variant="secondary" className="text-xs">
                          {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddExerciseForMuscleGroup(muscleGroup.id)}
                        className="h-7 px-2 text-xs"
                        disabled={isViewingMode}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
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
                        onCompleteSet={!isViewingMode ? () => handleCompleteSet(exercise.id) : undefined}
                        onEdit={!isViewingMode ? () => handleEditExercise(exercise.id) : undefined}
                        onDelete={!isViewingMode ? () => handleDeleteExercise(exercise.id) : undefined}
                        isActive={true}
                      />
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            {/* Add custom muscle group card - only show in active mode */}
            {!isViewingMode && (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-8">
                  <Button
                    variant="ghost"
                    onClick={() => handleAddExerciseForMuscleGroup('')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Muscle Group
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {exercises.length === 0 && !isViewingMode && (
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

      {!isViewingMode && (
        <AddExerciseDialog
          open={showAddExercise}
          onOpenChange={(open) => {
            setShowAddExercise(open);
            if (!open) setSelectedMuscleGroupId(null);
          }}
          workoutId={currentWorkout.id}
          preselectedMuscleGroupId={selectedMuscleGroupId || undefined}
        />
      )}
    </div>
  );
}