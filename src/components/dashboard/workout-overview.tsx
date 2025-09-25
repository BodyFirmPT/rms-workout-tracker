import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Calendar, Clock, Play, Plus, Target, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateWorkoutDialog } from "@/components/workout/create-workout-dialog";
import { format } from "date-fns";

export function WorkoutOverview() {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [workoutProgresses, setWorkoutProgresses] = useState<{ [id: string]: number }>({});
  const { 
    workouts, 
    activeWorkout, 
    clients, 
    startWorkout, 
    getWorkoutProgress, 
    getClientById,
    loadData,
    loading
  } = useWorkoutStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadProgresses = async () => {
      const progresses: { [id: string]: number } = {};
      if (activeWorkout) {
        progresses[activeWorkout.id] = await getWorkoutProgress(activeWorkout.id);
      }
      for (const workout of workouts.slice(-5)) {
        progresses[workout.id] = await getWorkoutProgress(workout.id);
      }
      setWorkoutProgresses(progresses);
    };
    
    if (workouts.length > 0 || activeWorkout) {
      loadProgresses();
    }
  }, [workouts, activeWorkout, getWorkoutProgress]);

  const recentWorkouts = workouts
    .slice(-5)
    .reverse();

  const handleViewWorkout = (workoutId: string) => {
    navigate(`/workout/${workoutId}`);
  };

  const handleStartWorkout = (workoutId: string) => {
    startWorkout(workoutId);
    navigate("/workout");
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => navigate("/muscle-groups")}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Manage Muscle Groups
        </Button>
      </div>

      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workouts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workouts.filter(w => {
                const workoutDate = new Date(w.date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return workoutDate >= weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Workout */}
      {activeWorkout && (
        <Card className="bg-primary-gradient text-primary-foreground shadow-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Active Workout
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  {getClientById(activeWorkout.client_id)?.name} • {activeWorkout.note}
                </CardDescription>
              </div>
              <ProgressRing 
                progress={workoutProgresses[activeWorkout.id] || 0} 
                size={60}
                strokeWidth={6}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">
                  {format(new Date(activeWorkout.date), 'MMM d')}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => navigate("/workout")}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>
                Your latest training sessions
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Workout
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading workouts...</p>
            </div>
          ) : recentWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No workouts yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                Create Your First Workout
              </Button>
            </div>
          ) : (
            recentWorkouts.map((workout) => {
              const client = getClientById(workout.client_id);
              const progress = workoutProgresses[workout.id] || 0;
              
              return (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewWorkout(workout.id)}
                >
                  <div className="flex items-center gap-4">
                    <ProgressRing 
                      progress={progress} 
                      size={48}
                      strokeWidth={4}
                    />
                    <div>
                      <h4 className="font-bold">{format(new Date(workout.date), 'MMM d, yyyy')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {client?.name}
                      </p>
                      {workout.note && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {workout.note}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {progress < 100 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartWorkout(workout.id);
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <CreateWorkoutDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}