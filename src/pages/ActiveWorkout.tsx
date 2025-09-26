import { useState, useEffect } from "react";
import { ArrowLeft, Play, Timer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkoutStore } from "@/stores/workoutStore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ActiveWorkout as ActiveWorkoutComponent } from "@/components/workout/active-workout";

const ActiveWorkout = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { workouts, startWorkout, getClientById, loadData } = useWorkoutStore();
  const [currentWorkout, setCurrentWorkout] = useState(null);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (workouts.length === 0) return;

    if (id) {
      // Show specific workout by ID
      const workout = workouts.find(w => w.id === id);
      if (workout) {
        setCurrentWorkout(workout);
      } else {
        // Workout not found, redirect to dashboard
        navigate("/");
      }
    } else {
      // No ID provided - look for a started workout
      const startedWorkout = workouts.find(w => w.status === 'started');
      if (startedWorkout) {
        // Redirect to the started workout
        navigate(`/workout/${startedWorkout.id}`, { replace: true });
      } else {
        // No started workout, redirect to dashboard
        navigate("/", { replace: true });
      }
    }
  }, [id, workouts, navigate]);

  const handleStartWorkout = async () => {
    if (currentWorkout) {
      await startWorkout(currentWorkout.id);
      // Reload data to get updated workout status
      await loadData();
    }
  };

  // Show loading state while determining workout
  if (!currentWorkout) {
    return <div className="min-h-screen bg-background">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
          <div className="text-center py-12">
            <Timer className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
          </div>
        </div>
      </div>;
  }

  const client = getClientById(currentWorkout.client_id);
  const showStartButton = currentWorkout.status === 'draft' || currentWorkout.status === 'completed';
  
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/client/${currentWorkout.client_id}`)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Client
          </Button>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[300px]">
              <h1 className="text-3xl font-bold text-foreground">
                {currentWorkout.status === 'completed' ? 'Completed Workout' : 
                 currentWorkout.status === 'started' ? 'Active Workout' : 'Workout Details'}
              </h1>
            </div>
            {showStartButton && <Button onClick={handleStartWorkout} size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Workout
            </Button>}
          </div>
        </div>
        
        <ActiveWorkoutComponent workoutId={currentWorkout.id} />
      </div>
    </div>;
};

export default ActiveWorkout;