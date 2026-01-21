import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Plus, Trash2, Edit, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkoutStore } from "@/stores/workoutStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddLocationDialog } from "@/components/workout/add-location-dialog";
import { EditLocationDialog } from "@/components/workout/edit-location-dialog";
import { DeleteLocationDialog } from "@/components/workout/delete-location-dialog";
import { ManageEquipmentDialog } from "@/components/workout/manage-equipment-dialog";

interface Location {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  equipment_count?: number;
  shared_count?: number;
}

export default function ClientLocations() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [managingEquipmentLocation, setManagingEquipmentLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { getClientById, loadData } = useWorkoutStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (clientId) {
      loadLocations();
    }
  }, [clientId]);

  const loadLocations = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      // Query through the junction table to get locations for this client
      const { data, error } = await supabase
        .from('client_locations')
        .select(`
          location_id,
          location:location_id (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('client_id', clientId);

      if (error) throw error;
      
      // Get equipment counts for each location
      const locationIds = (data || []).map(item => item.location?.id).filter(Boolean);
      const { data: equipmentData } = await supabase
        .from('equipment')
        .select('location_id')
        .in('location_id', locationIds);
      
      // Count equipment per location
      const equipmentCounts: Record<string, number> = {};
      (equipmentData || []).forEach(item => {
        equipmentCounts[item.location_id] = (equipmentCounts[item.location_id] || 0) + 1;
      });
      
      // Check how many clients each location is shared with
      const { data: sharingData } = await supabase
        .from('client_locations')
        .select('location_id, client_id')
        .in('location_id', locationIds);
      
      const clientCounts: Record<string, number> = {};
      (sharingData || []).forEach(item => {
        clientCounts[item.location_id] = (clientCounts[item.location_id] || 0) + 1;
      });
      
      // Transform the data
      const locationsWithCount = (data || [])
        .filter(item => item.location)
        .map(item => ({
          ...item.location!,
          equipment_count: equipmentCounts[item.location!.id] || 0,
          shared_count: clientCounts[item.location!.id] || 1,
        }));
      
      setLocations(locationsWithCount as any);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const client = clientId ? getClientById(clientId) : null;
  
  if (!client && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Client not found</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/client/${clientId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {client?.name}
            </Button>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Workout Locations
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage where {client?.name} trains
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Locations List */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-[300px]">
                  <CardTitle>Training Locations</CardTitle>
                  <CardDescription>
                    Locations and available equipment for {client?.name}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : locations.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No locations yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Location
                  </Button>
                </div>
              ) : (
                  <div className="space-y-4">
                  {locations.map((location) => (
                    <div key={location.id} className="group flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{location.name}</h4>
                          {location.shared_count && location.shared_count > 1 && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              Shared with {location.shared_count - 1} other{location.shared_count - 1 === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                        {location.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {location.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {location.equipment_count} equipment item{location.equipment_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManagingEquipmentLocation(location)}
                          className="text-xs"
                        >
                          <Wrench className="h-3 w-3 mr-1" />
                          Equipment
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingLocation(location)}
                          className="hidden group-hover:inline-flex text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingLocation(location)}
                          className="hidden group-hover:inline-flex text-destructive hover:text-destructive"
                          title={location.shared_count && location.shared_count > 1 ? "Remove from this client" : "Delete location"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddLocationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        clientId={clientId!}
        onSuccess={loadLocations}
      />

      {editingLocation && (
        <EditLocationDialog
          open={!!editingLocation}
          onOpenChange={(open) => !open && setEditingLocation(null)}
          location={editingLocation}
          onSuccess={loadLocations}
        />
      )}

      {deletingLocation && (
        <DeleteLocationDialog
          open={!!deletingLocation}
          onOpenChange={(open) => !open && setDeletingLocation(null)}
          location={deletingLocation}
          clientId={clientId!}
          onSuccess={loadLocations}
        />
      )}

      {managingEquipmentLocation && (
        <ManageEquipmentDialog
          open={!!managingEquipmentLocation}
          onOpenChange={(open) => !open && setManagingEquipmentLocation(null)}
          location={managingEquipmentLocation}
          onSuccess={loadLocations}
        />
      )}
    </div>
  );
}