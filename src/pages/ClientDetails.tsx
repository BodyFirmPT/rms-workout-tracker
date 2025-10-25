import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Calendar, Clock, Play, Plus, Target, ArrowLeft, Settings, Trash2, Timer, Edit, Copy, User, Search, AlertCircle, XCircle, Ban, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateWorkoutDialog } from "@/components/workout/create-workout-dialog";
import { DeleteWorkoutDialog } from "@/components/workout/delete-workout-dialog";
import { EditWorkoutDialog } from "@/components/workout/edit-workout-dialog";
import { DuplicateWorkoutDialog } from "@/components/workout/duplicate-workout-dialog";
import { EditClientDialog } from "@/components/workout/edit-client-dialog";
import { format } from "date-fns";
import { Workout } from "@/types/workout";
import { supabase } from "@/integrations/supabase/client";

interface Location {
  id: string;
  name: string;
}

export default function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deletingWorkout, setDeletingWorkout] = useState<Workout | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [duplicatingWorkout, setDuplicatingWorkout] = useState<Workout | null>(null);
  const [editingClient, setEditingClient] = useState(false);
  const [workoutProgresses, setWorkoutProgresses] = useState<{ [id: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState<{ [id: string]: Location }>({});
  
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
    loadLocations();
  }, [loadData]);

  const loadLocations = async () => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('location')
        .select('id, name')
        .eq('client_id', clientId);

      if (error) throw error;
      
      const locationMap: { [id: string]: Location } = {};
      data?.forEach(loc => {
        locationMap[loc.id] = loc;
      });
      setLocations(locationMap);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  useEffect(() => {
    const loadProgresses = async () => {
      const progresses: { [id: string]: number } = {};
      const clientWorkouts = workouts
        .filter(w => w.client_id === clientId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10); // Match the displayed workouts
      
      for (const workout of clientWorkouts) {
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

  const allClientWorkouts = workouts
    .filter(w => w.client_id === clientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Separate cancelled and active workouts
  const cancelledWorkouts = allClientWorkouts.filter(w => w.canceled_at);
  const activeWorkouts = allClientWorkouts.filter(w => !w.canceled_at);

  // Filter workouts based on search query
  const clientWorkouts = searchQuery.trim()
    ? allClientWorkouts.filter(w => 
        w.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        format(new Date(w.date + 'T00:00:00'), 'MMM d, yyyy').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allClientWorkouts.slice(0, 10); // Show only 10 when not searching

  const startedWorkout = getStartedWorkout();
  const clientStartedWorkout = startedWorkout?.client_id === clientId ? startedWorkout : null;

  const handleViewWorkout = (workoutId: string) => {
    navigate(`/workout/${workoutId}`);
  };

  const handleStartWorkout = (workoutId: string) => {
    startWorkout(workoutId);
    navigate(`/workout/${workoutId}`);
  };

  const workoutOffset = client?.workout_count_offset || 0;
  const totalWorkouts = activeWorkouts.length + workoutOffset;
  const completedWorkouts = activeWorkouts.filter(w => w.status === 'completed').length + workoutOffset;
  const thisWeekWorkouts = activeWorkouts.filter(w => {
    const workoutDate = new Date(w.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workoutDate >= weekAgo;
  }).length;
  const cancelledCount = cancelledWorkouts.length;
  const lateCancelledCount = cancelledWorkouts.filter(w => w.late_cancelled).length;

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
          
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="group flex items-center gap-3">
                  <h1 className="text-4xl font-bold text-foreground">
                    {client?.name}
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingClient(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-lg text-muted-foreground">
                  Training progress and workout history
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/client/${clientId}/injuries`)}
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Manage Injuries
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/client/${clientId}/restricted-exercises`)}
                className="flex items-center gap-2"
              >
                <Ban className="h-4 w-4" />
                Restricted Exercises
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/client/${clientId}/locations`)}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Locations
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Client Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-2xl font-bold cursor-help">{totalWorkouts}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">
                        {workoutOffset > 0 
                          ? `${workoutOffset} offset + ${activeWorkouts.length} in system (excluding cancelled)`
                          : `${activeWorkouts.length} workouts in system (excluding cancelled)`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cancelledCount}</div>
                {lateCancelledCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {lateCancelledCount} late cancel{lateCancelledCount !== 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-[300px]">
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
              {/* Search Bar */}
              {allClientWorkouts.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workouts by date or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchQuery && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing {clientWorkouts.length} of {allClientWorkouts.length} workouts
                    </p>
                  )}
                </div>
              )}
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading workouts...</p>
                </div>
              ) : allClientWorkouts.length === 0 ? (
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
              ) : clientWorkouts.length === 0 && searchQuery ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No workouts found matching "{searchQuery}"</p>
                </div>
              ) : (
                clientWorkouts.map((workout) => {
                  const progress = workoutProgresses[workout.id] || 0;
                  // Calculate workout number based on active workouts only
                  const workoutIndex = activeWorkouts.findIndex(w => w.id === workout.id);
                  const workoutNumber = workoutIndex >= 0 ? totalWorkouts - workoutIndex : 0;
                  
                  return (
                    <div key={workout.id} className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => handleViewWorkout(workout.id)}
                      >
                        <ProgressRing 
                          progress={progress} 
                          size={48}
                          strokeWidth={4}
                        />
                        <div>
                          <h4 className="font-bold">
                            {format(new Date(workout.date + 'T00:00:00'), 'MMM d, yyyy')}
                            {workout.location_id && locations[workout.location_id] && (
                              <> · {locations[workout.location_id].name}</>
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground italic mt-1">
                            {!workout.canceled_at && `Workout #${workoutNumber}`}
                            {!workout.canceled_at && workout.note && ` · `}
                            {workout.note}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDuplicatingWorkout(workout);
                          }}
                          className="hidden group-hover:inline-flex text-muted-foreground hover:text-foreground"
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
                          className="hidden group-hover:inline-flex text-muted-foreground hover:text-foreground"
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
                          className="hidden group-hover:inline-flex text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                         {workout.canceled_at ? (
                           <div className="px-3 py-1.5 bg-destructive/10 text-destructive text-sm font-medium rounded-md flex items-center gap-2">
                             <XCircle className="h-3 w-3" />
                             {workout.late_cancelled ? 'Late canceled' : 'Canceled'}
                           </div>
                         ) : workout.status === 'completed' ? (
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

          {client && editingClient && (
            <EditClientDialog
              open={editingClient}
              onOpenChange={setEditingClient}
              client={client}
            />
          )}
        </div>
      </div>
    </div>
  );
}