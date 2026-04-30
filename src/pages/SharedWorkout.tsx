import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Play, Timer, CheckCircle, Target, Plus, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UnifiedExerciseCard } from "@/components/ui/unified-exercise-card";
import { MuscleGroupHeader } from "@/components/workout/muscle-group-header";
import { CategoryHeader } from "@/components/workout/category-header";
import { useSharedWorkout } from "@/hooks/useSharedWorkout";
import { useToast } from "@/hooks/use-toast";

const SharedWorkout = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  
  const {
    workout,
    exercises,
    muscleGroups,
    location,
    exerciseMedia,
    loading,
    error,
    startWorkout,
    completeSet,
    completeWorkout,
    getWorkoutProgress,
    getMuscleGroupById
  } = useSharedWorkout(token);

  const workoutProgress = getWorkoutProgress();

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyHeader(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartWorkout = async () => {
    try {
      await startWorkout();
      toast({
        title: "Workout Started",
        description: "Let's get moving!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to start workout",
        variant: "destructive",
      });
    }
  };

  const handleCompleteSet = async (exerciseId: string, decrement = false) => {
    try {
      await completeSet(exerciseId, decrement);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update set",
        variant: "destructive",
      });
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      await completeWorkout();
      toast({
        title: "Workout Completed! 🎉",
        description: "Great job finishing your workout!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to complete workout",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Timer className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="text-center py-12">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Workout Not Found
            </h2>
            <p className="text-muted-foreground">
              {error || "This workout link is invalid or has expired."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = workout.status === 'completed';
  const isDraft = workout.status === 'draft';
  const isStarted = workout.status === 'started';
  const showStartButton = isDraft || isCompleted;

  // Group exercises by muscle group
  const exercisesByMuscleGroupId = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.muscle_group_id]) {
      acc[exercise.muscle_group_id] = [];
    }
    acc[exercise.muscle_group_id].push(exercise);
    return acc;
  }, {} as Record<string, typeof exercises>);

  // Get default muscle groups
  const defaultMuscleGroups = muscleGroups.filter(mg => mg.default_group);

  // Group by category
  const categorizedGroups = defaultMuscleGroups.reduce((acc, muscleGroup) => {
    const category = muscleGroup.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(muscleGroup);
    return acc;
  }, {} as Record<string, typeof defaultMuscleGroups>);

  const categoryOrder = ['Core', 'Arms', 'Legs', 'Uncategorized'];
  const orderedCategories = categoryOrder.filter(cat => categorizedGroups[cat]);

  const renderExerciseCard = (exercise: typeof exercises[0], muscleGroupName: string) => (
    <div key={exercise.id} className="ml-3 sm:ml-6 border-l-2 border-primary/20">
      <UnifiedExerciseCard
        exerciseName={exercise.exercise_name}
        repsCount={exercise.reps_count || 1}
        repsUnit={exercise.reps_unit || "reps"}
        weightCount={exercise.weight_count || 0}
        weightUnit={exercise.weight_unit || "lbs"}
        leftWeight={exercise.left_weight}
        setCount={exercise.set_count}
        completedSets={exercise.completed_sets}
        note={exercise.note || undefined}
        muscleGroup={muscleGroupName}
        isCompleted={exercise.is_completed}
        type={(exercise.type === 'exercise' ? 'weight' : exercise.type) as 'weight' | 'band' | 'stretch'}
        bandColor={exercise.band_color}
        bandType={exercise.band_type}
        resistanceLevel={exercise.resistance_level}
        bandCategory={exercise.band_category}
        clientId={(workout as any)?.client_id}
        imageUrl={exercise.image_url}
        media={exerciseMedia[exercise.id]}
        variant="added"
        onCompleteSet={!isCompleted ? (decrement) => handleCompleteSet(exercise.id, decrement) : undefined}
        disabled={isCompleted}
        workoutStarted={isStarted}
        // No onEdit or onDelete - client view only
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
        {/* Client View Banner */}
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-center text-primary font-medium">
            📱 Shared Workout View — {workout.client?.name || 'Client'}'s Workout
          </p>
        </div>

        {/* Sticky Progress Header */}
        {!isDraft && (
          <div 
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
              showStickyHeader 
                ? 'translate-y-0 opacity-100' 
                : '-translate-y-full opacity-0 pointer-events-none'
            } ${isCompleted ? 'bg-success-gradient' : 'bg-primary-gradient'} shadow-lg`}
          >
            <div className="container mx-auto max-w-6xl">
              <div className="flex items-center justify-between px-3 sm:px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-right min-w-[60px]">
                    <div className="text-lg sm:text-xl font-bold text-primary-foreground">{workoutProgress}%</div>
                  </div>
                  <Progress value={workoutProgress} className="flex-1 bg-primary-foreground/20 [&>div]:bg-primary-foreground" />
                </div>
                {isStarted && (
                  <Button 
                    variant="secondary"
                    size="sm" 
                    onClick={handleCompleteWorkout}
                    className="ml-2 shrink-0"
                  >
                    <CheckCircle className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Complete</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Workout Header */}
        <Card className={`text-primary-foreground shadow-primary relative z-20 ${isCompleted ? 'bg-success-gradient' : 'bg-primary-gradient'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  {format(new Date(workout.date + 'T00:00:00'), 'MMMM d, yyyy')}
                  {location && <> · {location.name}</>}
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  {workout.client?.name}{workout.note && ` • ${workout.note}`}
                </CardDescription>
                {workout.canceled_at && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-md text-sm font-medium">
                    <XCircle className="h-4 w-4" />
                    Canceled
                  </div>
                )}
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
              
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm opacity-90">
                  {exercises.length} exercises • {exercises.reduce((sum, ex) => sum + ex.completed_sets, 0)} / {exercises.reduce((sum, ex) => sum + ex.set_count, 0)} sets completed
                </p>
                
                <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  {showStartButton && (
                    <Button variant="secondary" size="sm" onClick={handleStartWorkout} className="text-xs sm:text-sm px-2 sm:px-3">
                      <Play className="h-4 w-4 mr-1 sm:mr-2" />
                      Start Workout
                    </Button>
                  )}
                  
                  {isStarted && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleCompleteWorkout}
                      className={`text-xs sm:text-sm px-2 sm:px-3 ${workoutProgress === 100 
                        ? "bg-success text-success-foreground hover:bg-success/90" 
                        : "bg-transparent text-white border border-white hover:bg-white hover:text-primary"
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1 sm:mr-2" />
                      Complete Workout
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Sections */}
        {isStarted ? (
          <>
            {/* Incomplete Exercises */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Incomplete Exercises
                </CardTitle>
                <CardDescription>Exercises still in progress</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-6">
                  {orderedCategories.map(categoryName => {
                    const categoryGroups = categorizedGroups[categoryName];
                    const visibleGroups = categoryGroups.filter(mg => {
                      const groupExercises = exercisesByMuscleGroupId[mg.id] || [];
                      return groupExercises.some(ex => !ex.is_completed);
                    });

                    if (visibleGroups.length === 0) return null;

                    const totalIncomplete = visibleGroups.reduce((sum, mg) => {
                      const groupExercises = exercisesByMuscleGroupId[mg.id] || [];
                      return sum + groupExercises.filter(ex => !ex.is_completed).length;
                    }, 0);

                    return (
                      <div key={categoryName} className="space-y-3">
                        <CategoryHeader 
                          name={categoryName}
                          groupCount={visibleGroups.length}
                          totalExercises={totalIncomplete}
                        />
                        
                        <div className="space-y-0">
                          {visibleGroups.map((muscleGroup, index) => {
                            const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];
                            const incompleteExercises = groupExercises.filter(ex => !ex.is_completed);
                            const isFirst = index === 0;
                            const isLast = index === visibleGroups.length - 1;

                            return (
                              <div key={muscleGroup.id} className="space-y-0">
                                <MuscleGroupHeader 
                                  name={muscleGroup.name} 
                                  exerciseCount={incompleteExercises.length} 
                                  isFirst={isFirst} 
                                  isLast={isLast} 
                                  hasContent={true}
                                  disabled={true}
                                />
                                
                                <div className={`border-2 border-t-0 border-border/80 overflow-hidden ${isLast ? 'rounded-b-lg' : ''}`}>
                                  {incompleteExercises.map(exercise => 
                                    renderExerciseCard(exercise, muscleGroup.name)
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Completed Exercises */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Completed Exercises
                </CardTitle>
                <CardDescription>Exercises you've finished</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-6">
                  {orderedCategories.map(categoryName => {
                    const categoryGroups = categorizedGroups[categoryName];
                    const visibleGroups = categoryGroups.filter(mg => {
                      const groupExercises = exercisesByMuscleGroupId[mg.id] || [];
                      return groupExercises.some(ex => ex.is_completed);
                    });

                    if (visibleGroups.length === 0) return null;

                    const totalComplete = visibleGroups.reduce((sum, mg) => {
                      const groupExercises = exercisesByMuscleGroupId[mg.id] || [];
                      return sum + groupExercises.filter(ex => ex.is_completed).length;
                    }, 0);

                    return (
                      <div key={categoryName} className="space-y-3">
                        <CategoryHeader 
                          name={categoryName}
                          groupCount={visibleGroups.length}
                          totalExercises={totalComplete}
                        />
                        
                        <div className="space-y-0">
                          {visibleGroups.map((muscleGroup, index) => {
                            const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];
                            const completedExercises = groupExercises.filter(ex => ex.is_completed);
                            const isFirst = index === 0;
                            const isLast = index === visibleGroups.length - 1;

                            return (
                              <div key={muscleGroup.id} className="space-y-0">
                                <MuscleGroupHeader 
                                  name={muscleGroup.name} 
                                  exerciseCount={completedExercises.length} 
                                  isFirst={isFirst} 
                                  isLast={isLast} 
                                  hasContent={true}
                                  disabled={true}
                                />
                                
                                <div className={`border-2 border-t-0 border-border/80 overflow-hidden ${isLast ? 'rounded-b-lg' : ''}`}>
                                  {completedExercises.map(exercise => 
                                    renderExerciseCard(exercise, muscleGroup.name)
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          // Draft or Completed view - single section
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Exercises
              </CardTitle>
              <CardDescription>
                {isDraft ? "Tap 'Start Workout' to begin tracking" : "Workout exercises"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                {orderedCategories.map(categoryName => {
                  const categoryGroups = categorizedGroups[categoryName];
                  const visibleGroups = categoryGroups.filter(mg => {
                    const groupExercises = exercisesByMuscleGroupId[mg.id] || [];
                    return groupExercises.length > 0;
                  });

                  if (visibleGroups.length === 0) return null;

                  const totalExercises = visibleGroups.reduce((sum, mg) => {
                    const groupExercises = exercisesByMuscleGroupId[mg.id] || [];
                    return sum + groupExercises.length;
                  }, 0);

                  return (
                    <div key={categoryName} className="space-y-3">
                      <CategoryHeader 
                        name={categoryName}
                        groupCount={visibleGroups.length}
                        totalExercises={totalExercises}
                      />
                      
                      <div className="space-y-0">
                        {visibleGroups.map((muscleGroup, index) => {
                          const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];
                          const isFirst = index === 0;
                          const isLast = index === visibleGroups.length - 1;

                          return (
                            <div key={muscleGroup.id} className="space-y-0">
                              <MuscleGroupHeader 
                                name={muscleGroup.name} 
                                exerciseCount={groupExercises.length} 
                                isFirst={isFirst} 
                                isLast={isLast} 
                                hasContent={true}
                                disabled={true}
                              />
                              
                              <div className={`border-2 border-t-0 border-border/80 overflow-hidden ${isLast ? 'rounded-b-lg' : ''}`}>
                                {groupExercises.map(exercise => 
                                  renderExerciseCard(exercise, muscleGroup.name)
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {exercises.length === 0 && (
          <Card className="mt-6">
            <CardContent className="text-center py-12">
              <Plus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Exercises Yet</h3>
              <p className="text-muted-foreground">Your trainer hasn't added exercises to this workout yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SharedWorkout;
