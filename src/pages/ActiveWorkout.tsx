import { ActiveWorkout as ActiveWorkoutComponent } from "@/components/workout/active-workout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkoutStore } from "@/stores/workoutStore";
import { useEffect, useState } from "react";
import { format } from "date-fns";
const ActiveWorkout = () => {
  const navigate = useNavigate();
  const {
    id
  } = useParams();
  const {
    workouts,
    activeWorkout,
    startWorkout,
    getClientById,
    loadData
  } = useWorkoutStore();
  const [viewingWorkout, setViewingWorkout] = useState(null);
  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    if (id && workouts.length > 0) {
      const workout = workouts.find(w => w.id === id);
      setViewingWorkout(workout);
    }
  }, [id, workouts]);
  const handleStartWorkout = async () => {
    if (viewingWorkout) {
      await startWorkout(viewingWorkout.id);
      navigate("/workout");
    }
  };

  // If viewing a specific workout (not active)
  if (id && viewingWorkout) {
    const client = getClientById(viewingWorkout.client_id);
    return <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Workout Details
                </h1>
                
                {viewingWorkout.note}
              </div>
              <Button onClick={handleStartWorkout} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Start Workout
              </Button>
            </div>
          </div>
          
          <ActiveWorkoutComponent workoutId={viewingWorkout.id} />
        </div>
      </div>;
  }

  // Active workout mode
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground">
            Active Workout
          </h1>
        </div>
        
        <ActiveWorkoutComponent />
      </div>
    </div>;
};
export default ActiveWorkout;