import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Users, Settings, Target, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkoutStore } from "@/stores/workoutStore";

export function ClientSelector() {
  const navigate = useNavigate();
  const { 
    clients, 
    workouts,
    loadData,
    loading 
  } = useWorkoutStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getClientWorkoutCount = (clientId: string) => {
    return workouts.filter(w => w.client_id === clientId).length;
  };

  const getClientRecentWorkouts = (clientId: string) => {
    return workouts.filter(w => w.client_id === clientId).length;
  };

  const handleClientSelect = (clientId: string) => {
    navigate(`/client/${clientId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        
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

      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select a Client</CardTitle>
          <CardDescription>
            Choose a client to view their workouts and training progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading clients...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No clients yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create a workout to add your first client
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => {
                const workoutCount = getClientWorkoutCount(client.id);
                
                return (
                  <Card 
                    key={client.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20"
                    onClick={() => handleClientSelect(client.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {workoutCount} workout{workoutCount !== 1 ? 's' : ''}
                        </div>
                        <Button variant="ghost" size="sm">
                          View →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}