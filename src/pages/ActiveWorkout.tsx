import { ActiveWorkout as ActiveWorkoutComponent } from "@/components/workout/active-workout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ActiveWorkout = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-foreground">
            Active Workout
          </h1>
        </div>
        
        <ActiveWorkoutComponent />
      </div>
    </div>
  );
};

export default ActiveWorkout;