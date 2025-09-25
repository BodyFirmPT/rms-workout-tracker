import { useState, useEffect } from "react";
import { CheckCircle, Plus, StopCircle, Timer, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UnifiedExerciseCard } from "@/components/ui/unified-exercise-card";
import { AddExerciseDialog } from "@/components/workout/add-exercise-dialog";
import { EditExerciseDialog } from "@/components/workout/edit-exercise-dialog";
import { MuscleGroupSuggestions } from "@/components/workout/muscle-group-suggestions";
import { useWorkoutStore } from "@/stores/workoutStore";
import { format } from "date-fns";
import { CreateWorkoutExerciseInput, WorkoutExercise } from "@/types/workout";
interface ActiveWorkoutProps {
  workoutId?: string; // For viewing specific workouts
}
export function ActiveWorkout({
  workoutId
}: ActiveWorkoutProps) {
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showEditExercise, setShowEditExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
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
  const isReadOnlyMode = workoutId && !activeWorkout; // Read-only if viewing a different workout than active

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
    return <div className="text-center py-12">
        <Timer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {workoutId ? "Workout Not Found" : "No Active Workout"}
        </h2>
        <p className="text-muted-foreground">
          {workoutId ? "This workout could not be found" : "Start a workout to begin tracking your exercises"}
        </p>
      </div>;
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
  const handleCompleteSet = (exerciseId: string, decrement = false) => {
    if (!isReadOnlyMode) {
      completeExerciseSet(currentWorkout.id, exerciseId, decrement);
    }
  };
  const handleCompleteWorkout = () => {
    completeWorkout();
  };
  const handleDeleteExercise = (exerciseId: string) => {
    if (!isReadOnlyMode) {
      deleteExercise(currentWorkout.id, exerciseId);
    }
  };
  const handleEditExercise = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      setEditingExercise(exercise);
      setShowEditExercise(true);
    }
  };
  return <div className="space-y-6">
      {/* Workout Header */}
      <Card className="bg-primary-gradient text-primary-foreground shadow-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                {format(new Date(currentWorkout.date + 'T00:00:00'), 'MMMM d, yyyy')}
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                {client?.name}{currentWorkout.note && ` • ${currentWorkout.note}`}
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
                {exercises.length} exercises • {exercises.reduce((sum, ex) => sum + ex.completed_sets, 0)} / {exercises.reduce((sum, ex) => sum + ex.set_count, 0)} sets completed
              </p>
              
              <div className="flex gap-2">
                {!isReadOnlyMode && <Button variant="secondary" size="sm" onClick={() => setShowAddExercise(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </Button>}
                
                {!isReadOnlyMode && workoutProgress === 100 && <Button variant="secondary" size="sm" onClick={handleCompleteWorkout} className="bg-success text-success-foreground hover:bg-success/90">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Workout
                  </Button>}
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
            {defaultMuscleGroups.map(muscleGroup => {
            const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];
            const hasExercises = groupExercises.length > 0;
            
            // If workout is started/active or completed, only show muscle groups with exercises
            if (activeWorkout || isReadOnlyMode) {
              if (!hasExercises) return null;
            }
            
            if (hasExercises) {
              // Show added exercises for this muscle group
              return <Card key={muscleGroup.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-medium">{muscleGroup.name}</CardTitle>
                          
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleAddExerciseForMuscleGroup(muscleGroup.id)} className="h-7 px-2 text-xs" disabled={isReadOnlyMode}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {groupExercises.map(exercise => <UnifiedExerciseCard key={exercise.id} exerciseName={exercise.exercise_name} repsCount={exercise.reps_count || 1} repsUnit={exercise.reps_unit || "reps"} weightCount={exercise.weight_count || 0} weightUnit={exercise.weight_unit || "lbs"} setCount={exercise.set_count} completedSets={exercise.completed_sets} note={exercise.note || undefined} muscleGroup={muscleGroup.name} isCompleted={exercise.is_completed} variant="added" onCompleteSet={!isReadOnlyMode ? decrement => handleCompleteSet(exercise.id, decrement) : undefined} onEdit={!isReadOnlyMode ? () => handleEditExercise(exercise.id) : undefined} onDelete={!isReadOnlyMode ? () => handleDeleteExercise(exercise.id) : undefined} disabled={isReadOnlyMode} />)}
                    </CardContent>
                  </Card>;
            } else {
              // Show muscle group suggestions (only when no active workout)
              return <MuscleGroupSuggestions key={muscleGroup.id} muscleGroup={muscleGroup} clientId={currentWorkout.client_id} workoutId={currentWorkout.id} hasExistingExercises={false} onAddExercise={() => handleAddExerciseForMuscleGroup(muscleGroup.id)} disabled={isReadOnlyMode} />;
            }
          })}

            {/* Non-default muscle groups with exercises */}
            {Object.entries(exercisesByMuscleGroup).map(([muscleGroupName, exercises]) => {
            const muscleGroup = muscleGroups.find(mg => mg.name === muscleGroupName);
            if (!muscleGroup || muscleGroup.default_group) return null;
            return <Card key={muscleGroupName}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-medium">{muscleGroupName}</CardTitle>
                        <Badge variant="outline" className="text-xs">Custom</Badge>
                        <Badge variant="secondary" className="text-xs">
                          {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleAddExerciseForMuscleGroup(muscleGroup.id)} className="h-7 px-2 text-xs" disabled={isReadOnlyMode}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {exercises.map(exercise => <UnifiedExerciseCard key={exercise.id} exerciseName={exercise.exercise_name} repsCount={exercise.reps_count || 1} repsUnit={exercise.reps_unit || "reps"} weightCount={exercise.weight_count || 0} weightUnit={exercise.weight_unit || "lbs"} setCount={exercise.set_count} completedSets={exercise.completed_sets} note={exercise.note || undefined} muscleGroup={muscleGroupName} isCompleted={exercise.is_completed} variant="added" onCompleteSet={!isReadOnlyMode ? decrement => handleCompleteSet(exercise.id, decrement) : undefined} onEdit={!isReadOnlyMode ? () => handleEditExercise(exercise.id) : undefined} onDelete={!isReadOnlyMode ? () => handleDeleteExercise(exercise.id) : undefined} disabled={isReadOnlyMode} />)}
                  </CardContent>
                </Card>;
          })}

            {/* Add custom muscle group card - only show in active mode */}
            {!isReadOnlyMode && <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-8">
                  <Button variant="ghost" onClick={() => handleAddExerciseForMuscleGroup('')} className="text-muted-foreground hover:text-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Muscle Group
                  </Button>
                </CardContent>
              </Card>}
          </div>
        </CardContent>
      </Card>

      {exercises.length === 0 && !isReadOnlyMode && <Card>
          <CardContent className="text-center py-12">
            <Plus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Exercises Yet</h3>
            <p className="text-muted-foreground mb-6">Add your first exercise to get started</p>
            <Button onClick={() => setShowAddExercise(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </CardContent>
        </Card>}

      {!isReadOnlyMode && <>
          <AddExerciseDialog open={showAddExercise} onOpenChange={open => {
        setShowAddExercise(open);
        if (!open) setSelectedMuscleGroupId(null);
      }} workoutId={currentWorkout.id} preselectedMuscleGroupId={selectedMuscleGroupId || undefined} />
          <EditExerciseDialog open={showEditExercise} onOpenChange={open => {
        setShowEditExercise(open);
        if (!open) setEditingExercise(null);
      }} exercise={editingExercise} workoutId={currentWorkout.id} />
        </>}
    </div>;
}