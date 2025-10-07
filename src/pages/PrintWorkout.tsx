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
    <div className="min-h-screen bg-white p-6 print:p-0">
      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-black mb-1">
          {format(new Date(currentWorkout.date + 'T00:00:00'), 'MMMM d, yyyy')}
        </h1>
        <div className="text-sm text-gray-700">
          <strong>{client?.name}</strong>
          {currentWorkout.note && ` • ${currentWorkout.note}`}
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
          {exercises.length} exercises • {exercises.reduce((sum, ex) => sum + ex.set_count, 0)} total sets
        </div>
      </div>

      {/* Exercise List by Category */}
      <div className="space-y-3">
        {orderedCategories.map(categoryName => {
          const categoryGroups = categorizedGroups[categoryName];
          const visibleGroups = categoryGroups.filter(mg => exercisesByMuscleGroupId[mg.id]?.length > 0);

          if (visibleGroups.length === 0) return null;

          return (
            <div key={categoryName} className="break-inside-avoid">
              <h2 className="text-base font-bold text-black uppercase tracking-wide mb-2 pb-1 border-b-2 border-black">
                {categoryName}
              </h2>

              {visibleGroups.map(muscleGroup => {
                const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];

                return (
                  <div key={muscleGroup.id} className="mb-2 break-inside-avoid">
                    <h3 className="text-sm font-semibold text-black mb-1">
                      {muscleGroup.name}
                    </h3>

                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-400">
                          <th className="text-left py-1 font-medium text-gray-700 w-6"></th>
                          <th className="text-left py-1 font-medium text-gray-700">Exercise</th>
                          <th className="text-center py-1 font-medium text-gray-700 w-16">Sets</th>
                          <th className="text-center py-1 font-medium text-gray-700 w-20">Reps</th>
                          <th className="text-center py-1 font-medium text-gray-700 w-20">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupExercises.map(exercise => (
                          <tr key={exercise.id} className="border-b border-gray-200">
                            <td className="py-1.5 align-top">
                              <div className="w-4 h-4 border-2 border-black rounded-sm"></div>
                            </td>
                            <td className="py-1.5 align-top">
                              <div className="font-medium text-black">{exercise.exercise_name}</div>
                              {exercise.note && (
                                <div className="text-xs text-gray-600 mt-0.5">{exercise.note}</div>
                              )}
                            </td>
                            <td className="py-1.5 text-center align-top font-medium text-black">{exercise.set_count}</td>
                            <td className="py-1.5 text-center align-top text-black">
                              {exercise.reps_count} {exercise.reps_unit}
                            </td>
                            <td className="py-1.5 text-center align-top text-black">
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
            <h2 className="text-base font-bold text-black uppercase tracking-wide mb-2 pb-1 border-b-2 border-black">
              Other
            </h2>

            {customMuscleGroupsWithExercises.map(muscleGroup => {
              const groupExercises = exercisesByMuscleGroupId[muscleGroup.id] || [];

              return (
                <div key={muscleGroup.id} className="mb-2 break-inside-avoid">
                  <h3 className="text-sm font-semibold text-black mb-1">
                    {muscleGroup.name}
                  </h3>

                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-400">
                        <th className="text-left py-1 font-medium text-gray-700 w-6"></th>
                        <th className="text-left py-1 font-medium text-gray-700">Exercise</th>
                        <th className="text-center py-1 font-medium text-gray-700 w-16">Sets</th>
                        <th className="text-center py-1 font-medium text-gray-700 w-20">Reps</th>
                        <th className="text-center py-1 font-medium text-gray-700 w-20">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupExercises.map(exercise => (
                        <tr key={exercise.id} className="border-b border-gray-200">
                          <td className="py-1.5 align-top">
                            <div className="w-4 h-4 border-2 border-black rounded-sm"></div>
                          </td>
                          <td className="py-1.5 align-top">
                            <div className="font-medium text-black">{exercise.exercise_name}</div>
                            {exercise.note && (
                              <div className="text-xs text-gray-600 mt-0.5">{exercise.note}</div>
                            )}
                          </td>
                          <td className="py-1.5 text-center align-top font-medium text-black">{exercise.set_count}</td>
                          <td className="py-1.5 text-center align-top text-black">
                            {exercise.reps_count} {exercise.reps_unit}
                          </td>
                          <td className="py-1.5 text-center align-top text-black">
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
