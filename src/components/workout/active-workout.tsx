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
import { MuscleGroupHeader } from "@/components/workout/muscle-group-header";
import { useWorkoutStore } from "@/stores/workoutStore";
import { format } from "date-fns";
import { CreateWorkoutExerciseInput, WorkoutExercise } from "@/types/workout";
interface ActiveWorkoutProps {
  workoutId: string; // Always required now
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
    getClientExerciseHistory,
    startWorkout
  } = useWorkoutStore();
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Find the workout by ID
  const currentWorkout = workouts.find(w => w.id === workoutId);
  const workoutStatus = currentWorkout?.status || 'draft';

  // Determine interaction mode based on status
  const isCompleted = workoutStatus === 'completed';
  const isDraft = workoutStatus === 'draft';
  const isStarted = workoutStatus === 'started';
  const isReadOnlyMode = isCompleted; // Only completed workouts are truly read-only

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
          Workout Not Found
        </h2>
        <p className="text-muted-foreground">
          This workout could not be found
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
    if (!isCompleted) {
      completeExerciseSet(currentWorkout.id, exerciseId, decrement);
    }
  };
  const handleCompleteWorkout = () => {
    if (currentWorkout) {
      completeWorkout(currentWorkout.id);
    }
  };
  const handleDeleteExercise = (exerciseId: string) => {
    if (!isCompleted) {
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
  return <div className="space-y-3 sm:space-y-6">
      {/* Workout Header */}
      <Card className={`text-primary-foreground shadow-primary ${isCompleted ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-primary-gradient'}`}>
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
                {!isCompleted && <Button variant="secondary" size="sm" onClick={() => setShowAddExercise(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </Button>}
                
                {isStarted && <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleCompleteWorkout} 
                    className={workoutProgress === 100 
                      ? "bg-success text-success-foreground hover:bg-success/90" 
                      : "bg-transparent text-white border border-white hover:bg-white hover:text-primary"
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Workout
                  </Button>}
                
                {/* Status badge */}
                
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
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-6">
            {(() => {
            // Get all default muscle groups grouped by category
            const categorizedGroups = defaultMuscleGroups.reduce((acc, muscleGroup) => {
              const category = muscleGroup.category || 'Uncategorized';
              if (!acc[category]) {
                acc[category] = [];
              }
              acc[category].push(muscleGroup);
              return acc;
            }, {} as Record<string, typeof defaultMuscleGroups>);

            // Order categories: Core, Arms, Legs, then Uncategorized
            const categoryOrder = ['Core', 'Arms', 'Legs', 'Uncategorized'];
            const orderedCategories = categoryOrder.filter(cat => categorizedGroups[cat]);
            return orderedCategories.map(categoryName => {
              const categoryGroups = categorizedGroups[categoryName];

              // Filter visible groups for this category
              const visibleGroups = categoryGroups.filter(muscleGroup => {
                const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];
                const hasExercises = groupExercises.length > 0;

                // Show all muscle groups for draft workouts
                // Hide empty muscle groups for started workouts
                // Only show muscle groups with exercises for completed workouts
                if (isCompleted) {
                  return hasExercises;
                } else if (isStarted) {
                  return hasExercises;
                } else {
                  // Draft - show all muscle groups
                  return true;
                }
              });

              // Don't render the category if no groups are visible
              if (visibleGroups.length === 0) {
                return null;
              }
              return <div key={categoryName} className="space-y-3">
                    {/* Category header - more prominent */}
                    <div className="flex items-center gap-2 py-2 px-3 bg-primary/5 border-l-4 border-primary rounded-r-md">
                      <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
                        {categoryName}
                      </h4>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        {visibleGroups.length} groups
                      </Badge>
                    </div>
                    
                    <div className="space-y-0">
                      {visibleGroups.map((muscleGroup, index) => {
                    const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];
                    const hasExercises = groupExercises.length > 0;
                    const isFirst = index === 0;
                    const isLast = index === visibleGroups.length - 1;
                    if (hasExercises) {
                      // Show added exercises for this muscle group - table-like layout
                      return <div key={muscleGroup.id} className="space-y-0">
                              <MuscleGroupHeader name={muscleGroup.name} exerciseCount={groupExercises.length} isFirst={isFirst} isLast={isLast} hasContent={true} onAddExercise={() => handleAddExerciseForMuscleGroup(muscleGroup.id)} disabled={isCompleted} />
                              
                              {/* Exercise rows */}
                              <div className={`border-2 border-t-0 border-border/80 overflow-hidden ${isLast ? 'rounded-b-lg' : ''}`}>
                                 {groupExercises.map(exercise => <div className="ml-3 sm:ml-6 border-l-2 border-primary/20">
                                     <UnifiedExerciseCard key={exercise.id} exerciseName={exercise.exercise_name} repsCount={exercise.reps_count || 1} repsUnit={exercise.reps_unit || "reps"} weightCount={exercise.weight_count || 0} weightUnit={exercise.weight_unit || "lbs"} setCount={exercise.set_count} completedSets={exercise.completed_sets} note={exercise.note || undefined} muscleGroup={muscleGroup.name} isCompleted={exercise.is_completed} variant="added" onCompleteSet={!isCompleted ? decrement => handleCompleteSet(exercise.id, decrement) : undefined} onEdit={!isCompleted ? () => handleEditExercise(exercise.id) : undefined} onDelete={!isCompleted ? () => handleDeleteExercise(exercise.id) : undefined} disabled={isCompleted} />
                                   </div>)}
                              </div>
                            </div>;
                    } else {
                      // Show muscle group suggestions (only when no active workflow)
                      return <div key={muscleGroup.id} className="space-y-0">
                              <MuscleGroupHeader name={muscleGroup.name} exerciseCount={0} isFirst={isFirst} isLast={isLast} hasContent={true} onAddExercise={() => handleAddExerciseForMuscleGroup(muscleGroup.id)} disabled={isCompleted} />
                              
                              {/* Content area */}
                              <div className={`border-2 border-t-0 border-border/80 overflow-hidden ${isLast ? 'rounded-b-lg' : ''}`}>
                                  <div className="ml-3 sm:ml-6 border-l-2 border-primary/20">
                                   <MuscleGroupSuggestions muscleGroup={muscleGroup} clientId={currentWorkout.client_id} workoutId={currentWorkout.id} hasExistingExercises={false} disabled={isCompleted} />
                                 </div>
                              </div>
                            </div>;
                    }
                  })}
                    </div>
                  </div>;
            });
          })()}

             {/* Non-default muscle groups with exercises */}
             {Object.entries(exercisesByMuscleGroup).map(([muscleGroupName, exercises]) => {
            const muscleGroup = muscleGroups.find(mg => mg.name === muscleGroupName);
            if (!muscleGroup || muscleGroup.default_group) return null;
            return <div key={muscleGroupName} className="space-y-0">
                   <MuscleGroupHeader name={muscleGroupName} exerciseCount={exercises.length} isCustom={true} isFirst={true} isLast={true} hasContent={true} onAddExercise={() => handleAddExerciseForMuscleGroup(muscleGroup.id)} disabled={isCompleted} />
                   
                    {/* Exercise rows */}
                    <div className="border-2 border-t-0 rounded-b-lg border-border/80 overflow-hidden">
                       {exercises.map(exercise => <div className="ml-3 sm:ml-6 border-l-2 border-primary/20">
                           <UnifiedExerciseCard key={exercise.id} exerciseName={exercise.exercise_name} repsCount={exercise.reps_count || 1} repsUnit={exercise.reps_unit || "reps"} weightCount={exercise.weight_count || 0} weightUnit={exercise.weight_unit || "lbs"} setCount={exercise.set_count} completedSets={exercise.completed_sets} note={exercise.note || undefined} muscleGroup={muscleGroupName} isCompleted={exercise.is_completed} variant="added" onCompleteSet={!isCompleted ? decrement => handleCompleteSet(exercise.id, decrement) : undefined} onEdit={!isCompleted ? () => handleEditExercise(exercise.id) : undefined} onDelete={!isCompleted ? () => handleDeleteExercise(exercise.id) : undefined} disabled={isCompleted} />
                         </div>)}
                    </div>
                 </div>;
          })}

            {/* Add custom muscle group card - only show in draft and started modes */}
            {!isCompleted && <Card className="border-dashed">
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
      }} workoutId={currentWorkout.id} clientId={currentWorkout.client_id} preselectedMuscleGroupId={selectedMuscleGroupId || undefined} />
          <EditExerciseDialog open={showEditExercise} onOpenChange={open => {
        setShowEditExercise(open);
        if (!open) setEditingExercise(null);
      }} exercise={editingExercise} workoutId={currentWorkout.id} />
        </>}
    </div>;
}