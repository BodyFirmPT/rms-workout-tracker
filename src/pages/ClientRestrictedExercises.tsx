import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, User, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWorkoutStore } from "@/stores/workoutStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddRestrictedExerciseDialog } from "@/components/workout/add-restricted-exercise-dialog";
import { DeleteRestrictedExerciseDialog } from "@/components/workout/delete-restricted-exercise-dialog";
import { format } from "date-fns";

interface RestrictedExercise {
  id: string;
  name: string;
  created_at: string;
}

export default function ClientRestrictedExercises() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingExercise, setDeletingExercise] = useState<RestrictedExercise | null>(null);
  const [restrictedExercises, setRestrictedExercises] = useState<RestrictedExercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { getClientById, loadData } = useWorkoutStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (clientId) {
      loadRestrictedExercises();
    }
  }, [clientId]);

  const loadRestrictedExercises = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restricted_exercise')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestrictedExercises(data || []);
    } catch (error) {
      console.error('Error loading restricted exercises:', error);
      toast.error('Failed to load restricted exercises');
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
            <Button onClick={() => navigate("/")} className="mt-4">
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
            <div className="p-3 bg-destructive/10 rounded-full">
              <Ban className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Restricted Exercises
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage exercises that {client?.name} should avoid
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Restricted Exercises List */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-[300px]">
                  <CardTitle>Restricted Exercises</CardTitle>
                  <CardDescription>
                    Exercises that {client?.name} cannot perform
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : restrictedExercises.length === 0 ? (
                <div className="text-center py-8">
                  <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No restricted exercises yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Restricted Exercise
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exercise Name</TableHead>
                      <TableHead>Added On</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restrictedExercises.map((exercise) => (
                      <TableRow key={exercise.id}>
                        <TableCell className="font-medium">{exercise.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(exercise.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingExercise(exercise)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddRestrictedExerciseDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        clientId={clientId!}
        onSuccess={loadRestrictedExercises}
      />

      {deletingExercise && (
        <DeleteRestrictedExerciseDialog
          open={!!deletingExercise}
          onOpenChange={(open) => !open && setDeletingExercise(null)}
          exercise={deletingExercise}
          onSuccess={loadRestrictedExercises}
        />
      )}
    </div>
  );
}