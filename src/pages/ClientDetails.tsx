import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Calendar, Clock, Play, Plus, Target, ArrowLeft, Settings, Trash2, Timer, Edit, Copy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateWorkoutDialog } from "@/components/workout/create-workout-dialog";
import { DeleteWorkoutDialog } from "@/components/workout/delete-workout-dialog";
import { EditWorkoutDialog } from "@/components/workout/edit-workout-dialog";
import { DuplicateWorkoutDialog } from "@/components/workout/duplicate-workout-dialog";
import { format } from "date-fns";
import { Workout } from "@/types/workout";

export default function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deletingWorkout, setDeletingWorkout] = useState<Workout | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [duplicatingWorkout, setDuplicatingWorkout] = useState<Workout | null>(null);
  const [workoutProgresses, setWorkoutProgresses] = useState<{ [id: string]: number }>({});
  
  const { 
    workouts, 
    clients,
    startWorkout, 
    getWorkoutProgress, 
    getClientById,
    loadData,
    loading,
    getStartedWorkout
  } = useWorkoutStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadProgresses = async () => {
      const progresses: { [id: string]: number } = {};
      const clientWorkouts = workouts.filter(w => w.client_id === clientId);
      
      for (const workout of clientWorkouts.slice(-5)) {
        progresses[workout.id] = await getWorkoutProgress(workout.id);
      }
      setWorkoutProgresses(progresses);
    };
    
    if (workouts.length > 0 && clientId) {
      loadProgresses();
    }
  }, [workouts, clientId, getWorkoutProgress]);

  const client = clientId ? getClientById(clientId) : null;
  
  if (!client && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Client not found</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const clientWorkouts = workouts
    .filter(w => w.client_id === clientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const startedWorkout = getStartedWorkout();
  const clientStartedWorkout = startedWorkout?.client_id === clientId ? startedWorkout : null;

  const handleViewWorkout = (workoutId: string) => {
    navigate(`/workout/${workoutId}`);
  };

  const handleStartWorkout = (workoutId: string) => {
    startWorkout(workoutId);
    navigate(`/workout/${workoutId}`);
  };

  const totalWorkouts = clientWorkouts.length;
  const completedWorkouts = clientWorkouts.filter(w => w.status === 'completed').length;
  const thisWeekWorkouts = clientWorkouts.filter(w => {
    const workoutDate = new Date(w.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workoutDate >= weekAgo;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clients
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                {client?.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                Training progress and workout history
              </p>
            </div>
          </div>
        </div>

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

          {/* Client Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalWorkouts}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedWorkouts}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{thisWeekWorkouts}</div>
              </CardContent>
            </Card>
          </div>

          {/* Active Workout */}
          {clientStartedWorkout && (
            <Card className="bg-primary-gradient text-primary-foreground shadow-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Active Workout
                    </CardTitle>
                    <CardDescription className="text-primary-foreground/80">
                      {clientStartedWorkout.note}
                    </CardDescription>
                  </div>
                  <ProgressRing 
                    progress={workoutProgresses[clientStartedWorkout.id] || 0} 
                    size={60}
                    strokeWidth={6}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">
                      {format(new Date(clientStartedWorkout.date), 'MMM d')}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/workout/${clientStartedWorkout.id}`)}>
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
                    Latest training sessions for {client?.name}
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
              ) : clientWorkouts.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No workouts yet for {client?.name}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Workout
                  </Button>
                </div>
              ) : (
                clientWorkouts.map((workout) => {
                  const progress = workoutProgresses[workout.id] || 0;
                  
                  return (
                    <div key={workout.id} className="group relative p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      {/* Main content - responsive layout */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => handleViewWorkout(workout.id)}
                        >
                          <ProgressRing 
                            progress={progress} 
                            size={48}
                            strokeWidth={4}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold">{format(new Date(workout.date + 'T00:00:00'), 'MMM d, yyyy')}</h4>
                            {workout.note && (
                              <p className="text-xs text-muted-foreground italic mt-1">
                                {workout.note}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Status/Start button - always visible */}
                        <div className="flex justify-end sm:justify-start sm:mr-28">
                          {workout.status === 'completed' ? (
                            <div className="px-3 py-1.5 bg-success/10 text-success text-sm font-medium rounded-md flex items-center gap-2">
                              <Target className="h-3 w-3" />
                              Completed
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartWorkout(workout.id);
                              }}
                            >
                              <Timer className="h-4 w-4 mr-2" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons - hover only on desktop, always visible on mobile */}
                      <div className="flex items-center gap-2 justify-end mt-3 sm:mt-0 sm:absolute sm:top-4 sm:right-4 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDuplicatingWorkout(workout);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingWorkout(workout);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingWorkout(workout);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <CreateWorkoutDialog 
            open={showCreateDialog} 
            onOpenChange={setShowCreateDialog}
            defaultClientId={clientId}
          />

          {deletingWorkout && (
            <DeleteWorkoutDialog
              open={!!deletingWorkout}
              onOpenChange={(open) => !open && setDeletingWorkout(null)}
              workout={deletingWorkout}
            />
          )}

          {editingWorkout && (
            <EditWorkoutDialog
              open={!!editingWorkout}
              onOpenChange={(open) => !open && setEditingWorkout(null)}
              workout={editingWorkout}
            />
          )}

          {duplicatingWorkout && (
            <DuplicateWorkoutDialog
              open={!!duplicatingWorkout}
              onOpenChange={(open) => !open && setDuplicatingWorkout(null)}
              workout={duplicatingWorkout}
            />
          )}
        </div>
      </div>
    </div>
  );
}