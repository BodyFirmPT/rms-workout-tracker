import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useWorkoutStore } from "@/stores/workoutStore";
import { format } from "date-fns";
import { WorkoutExercise } from "@/types/workout";

const PrintWorkout = () => {
  const { id } = useParams();
  const { workouts, workoutExercises, muscleGroups, getClientById, getMuscleGroupById, loadData, loadWorkoutExercises } = useWorkoutStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentWorkout = workouts.find(w => w.id === id);

  useEffect(() => {
    if (currentWorkout) {
      loadWorkoutExercises(currentWorkout.id).then(() => {
        setIsReady(true);
      });
    }
  }, [currentWorkout, loadWorkoutExercises]);

  // Auto-open print dialog when ready
  useEffect(() => {
    if (isReady && currentWorkout) {
      // Small delay to ensure page is fully rendered
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isReady, currentWorkout]);

  if (!currentWorkout || !isReady) {
    return <div className="min-h-screen bg-background p-8">
        <div className="text-center">Loading workout...</div>
      </div>;
  }

  const client = getClientById(currentWorkout.client_id);
  const exercises = workoutExercises[currentWorkout.id] || [];

  // Group exercises by muscle group and category
  const defaultMuscleGroups = muscleGroups.filter(mg => mg.default_group);
  const exercisesByMuscleGroupId = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.muscle_group_id]) {
      acc[exercise.muscle_group_id] = [];
    }
    acc[exercise.muscle_group_id].push(exercise);
    return acc;
  }, {} as Record<string, WorkoutExercise[]>);

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

  // Get custom muscle groups with exercises
  const customMuscleGroupsWithExercises = muscleGroups
    .filter(mg => !mg.default_group)
    .filter(mg => exercisesByMuscleGroupId[mg.id]?.length > 0);

  return (
    <div className="min-h-screen bg-background p-8 print:p-0">
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 print:mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {format(new Date(currentWorkout.date + 'T00:00:00'), 'MMMM d, yyyy')}
        </h1>
        <div className="text-lg text-muted-foreground">
          <strong>{client?.name}</strong>
          {currentWorkout.note && ` • ${currentWorkout.note}`}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {exercises.length} exercises • {exercises.reduce((sum, ex) => sum + ex.set_count, 0)} total sets
        </div>
      </div>

      {/* Exercise List by Category */}
      <div className="space-y-6">
        {orderedCategories.map(categoryName => {
          const categoryGroups = categorizedGroups[categoryName];
          const visibleGroups = categoryGroups.filter(mg => exercisesByMuscleGroupId[mg.id]?.length > 0);

          if (visibleGroups.length === 0) return null;

          return (
            <div key={categoryName} className="break-inside-avoid">
              <h2 className="text-xl font-bold text-primary uppercase tracking-wider mb-3 pb-2 border-b-2 border-primary">
                {categoryName}
              </h2>

              {visibleGroups.map(muscleGroup => {
                const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];

                return (
                  <div key={muscleGroup.id} className="mb-4 break-inside-avoid">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {muscleGroup.name}
                    </h3>

                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-sm font-medium text-muted-foreground w-8"></th>
                          <th className="text-left py-2 text-sm font-medium text-muted-foreground">Exercise</th>
                          <th className="text-center py-2 text-sm font-medium text-muted-foreground w-20">Sets</th>
                          <th className="text-center py-2 text-sm font-medium text-muted-foreground w-24">Reps</th>
                          <th className="text-center py-2 text-sm font-medium text-muted-foreground w-24">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupExercises.map(exercise => (
                          <tr key={exercise.id} className="border-b border-border/50">
                            <td className="py-3 align-top">
                              <div className="w-5 h-5 border-2 border-foreground rounded-sm"></div>
                            </td>
                            <td className="py-3 align-top">
                              <div className="font-medium text-foreground">{exercise.exercise_name}</div>
                              {exercise.note && (
                                <div className="text-sm text-muted-foreground mt-1">{exercise.note}</div>
                              )}
                            </td>
                            <td className="py-3 text-center align-top font-medium">{exercise.set_count}</td>
                            <td className="py-3 text-center align-top">
                              {exercise.reps_count} {exercise.reps_unit}
                            </td>
                            <td className="py-3 text-center align-top">
                              {exercise.weight_count > 0 ? `${exercise.weight_count} ${exercise.weight_unit}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Custom muscle groups */}
        {customMuscleGroupsWithExercises.length > 0 && (
          <div className="break-inside-avoid">
            <h2 className="text-xl font-bold text-primary uppercase tracking-wider mb-3 pb-2 border-b-2 border-primary">
              Other
            </h2>

            {customMuscleGroupsWithExercises.map(muscleGroup => {
              const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];

              return (
                <div key={muscleGroup.id} className="mb-4 break-inside-avoid">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {muscleGroup.name}
                  </h3>

                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-sm font-medium text-muted-foreground w-8"></th>
                        <th className="text-left py-2 text-sm font-medium text-muted-foreground">Exercise</th>
                        <th className="text-center py-2 text-sm font-medium text-muted-foreground w-20">Sets</th>
                        <th className="text-center py-2 text-sm font-medium text-muted-foreground w-24">Reps</th>
                        <th className="text-center py-2 text-sm font-medium text-muted-foreground w-24">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupExercises.map(exercise => (
                        <tr key={exercise.id} className="border-b border-border/50">
                          <td className="py-3 align-top">
                            <div className="w-5 h-5 border-2 border-foreground rounded-sm"></div>
                          </td>
                          <td className="py-3 align-top">
                            <div className="font-medium text-foreground">{exercise.exercise_name}</div>
                            {exercise.note && (
                              <div className="text-sm text-muted-foreground mt-1">{exercise.note}</div>
                            )}
                          </td>
                          <td className="py-3 text-center align-top font-medium">{exercise.set_count}</td>
                          <td className="py-3 text-center align-top">
                            {exercise.reps_count} {exercise.reps_unit}
                          </td>
                          <td className="py-3 text-center align-top">
                            {exercise.weight_count > 0 ? `${exercise.weight_count} ${exercise.weight_unit}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintWorkout;
