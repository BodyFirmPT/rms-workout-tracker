import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Users, Settings, Target, Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateClientDialog } from "@/components/workout/create-client-dialog";
import { EditClientDialog } from "@/components/workout/edit-client-dialog";
import { DeleteClientDialog } from "@/components/workout/delete-client-dialog";
import { Client } from "@/types/workout";
import { supabase } from "@/integrations/supabase/client";
import { useEmulation } from "@/contexts/EmulationContext";

export function ClientSelector() {
  const navigate = useNavigate();
  const { emulatedUser } = useEmulation();
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [userClientId, setUserClientId] = useState<string | null>(null);
  
  const { 
    clients, 
    workouts,
    loadData,
    loading 
  } = useWorkoutStore();

  useEffect(() => {
    loadData();
    loadUserClientId();
  }, [loadData, emulatedUser]);

  const loadUserClientId = async () => {
    // Check if we're emulating a user
    if (emulatedUser?.client_id) {
      setUserClientId(emulatedUser.client_id);
      return;
    }

    // Otherwise, get the actual logged-in user's client_id
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data?.client_id) {
        setUserClientId(data.client_id);
      }
    }
  };

  const getClientWorkoutCount = (clientId: string) => {
    return workouts.filter(w => w.client_id === clientId).length;
  };

  const getClientRecentWorkouts = (clientId: string) => {
    return workouts.filter(w => w.client_id === clientId).length;
  };

  const handleClientSelect = (clientId: string) => {
    navigate(`/client/${clientId}`);
  };

  const getClientDisplayName = (client: Client) => {
    if (client.id === userClientId) {
      return `${client.name} (me)`;
    }
    return client.name;
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

      {/* Client Selection */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[300px]">
              <CardTitle>Select a Client</CardTitle>
              <CardDescription>
                Choose a client to view their workouts and training progress
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateClient(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Client
            </Button>
          </div>
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
                    className="relative group cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20"
                  >
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClient(client);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingClient(client);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div onClick={() => handleClientSelect(client.id)}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg pr-16">
                          {getClientDisplayName(client)}
                        </CardTitle>
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
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateClientDialog
        open={showCreateClient}
        onOpenChange={setShowCreateClient}
      />

      {editingClient && (
        <EditClientDialog
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
          client={editingClient}
        />
      )}

      {deletingClient && (
        <DeleteClientDialog
          open={!!deletingClient}
          onOpenChange={(open) => !open && setDeletingClient(null)}
          client={deletingClient}
        />
      )}
    </div>
  );
}