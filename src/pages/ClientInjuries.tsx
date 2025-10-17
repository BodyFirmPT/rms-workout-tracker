import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { AlertCircle, ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkoutStore } from "@/stores/workoutStore";
import { AddInjuryDialog } from "@/components/injury/add-injury-dialog";
import { EditInjuryDialog } from "@/components/injury/edit-injury-dialog";
import { DeleteInjuryDialog } from "@/components/injury/delete-injury-dialog";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Injury } from "@/types/injury";

export default function ClientInjuries() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingInjury, setEditingInjury] = useState<Injury | null>(null);
  const [deletingInjury, setDeletingInjury] = useState<Injury | null>(null);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { getClientById, loadData } = useWorkoutStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const client = clientId ? getClientById(clientId) : null;

  const loadInjuries = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("injury")
        .select("*")
        .eq("client_id", clientId)
        .order("start_date", { ascending: false });

      if (error) throw error;
      setInjuries(data || []);
    } catch (error) {
      console.error("Error loading injuries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInjuries();
  }, [clientId]);

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

  const activeInjuries = injuries.filter(i => !i.end_date);
  const recoveredInjuries = injuries.filter(i => i.end_date);

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
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Injury Log
              </h1>
              <p className="text-lg text-muted-foreground">
                Track and manage injuries for {client?.name}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Active Injuries */}
          {activeInjuries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Injuries</CardTitle>
                <CardDescription>
                  Current injuries requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeInjuries.map((injury) => (
                  <div key={injury.id} className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{injury.name}</h4>
                        <Badge variant="destructive" className="text-xs">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Started: {format(new Date(injury.start_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingInjury(injury)}
                        className="hidden group-hover:inline-flex text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingInjury(injury)}
                        className="hidden group-hover:inline-flex text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Injury History */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle>Injury History</CardTitle>
                  <CardDescription>
                    {recoveredInjuries.length > 0 
                      ? "Past injuries that have been resolved"
                      : "No injury history yet"}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Injury
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading injuries...</p>
                </div>
              ) : injuries.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No injuries recorded yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Record First Injury
                  </Button>
                </div>
              ) : recoveredInjuries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recovered injuries</p>
                </div>
              ) : (
                recoveredInjuries.map((injury) => (
                  <div key={injury.id} className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{injury.name}</h4>
                        <Badge variant="secondary" className="text-xs">Recovered</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(injury.start_date), 'MMM d, yyyy')} - {injury.end_date && format(new Date(injury.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingInjury(injury)}
                        className="hidden group-hover:inline-flex text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingInjury(injury)}
                        className="hidden group-hover:inline-flex text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {clientId && (
          <>
            <AddInjuryDialog 
              open={showAddDialog} 
              onOpenChange={setShowAddDialog}
              clientId={clientId}
              onSuccess={loadInjuries}
            />

            {editingInjury && (
              <EditInjuryDialog
                open={!!editingInjury}
                onOpenChange={(open) => !open && setEditingInjury(null)}
                injury={editingInjury}
                onSuccess={loadInjuries}
              />
            )}

            {deletingInjury && (
              <DeleteInjuryDialog
                open={!!deletingInjury}
                onOpenChange={(open) => !open && setDeletingInjury(null)}
                injury={deletingInjury}
                onSuccess={loadInjuries}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
