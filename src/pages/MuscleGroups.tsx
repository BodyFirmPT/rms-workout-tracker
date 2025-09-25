import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Edit, Trash2, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateMuscleGroupDialog } from "@/components/muscle-groups/create-muscle-group-dialog";
import { EditMuscleGroupDialog } from "@/components/muscle-groups/edit-muscle-group-dialog";
import { DeleteMuscleGroupDialog } from "@/components/muscle-groups/delete-muscle-group-dialog";
import { MuscleGroup } from "@/types/workout";

const MuscleGroups = () => {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMuscleGroup, setEditingMuscleGroup] = useState<MuscleGroup | null>(null);
  const [deletingMuscleGroup, setDeletingMuscleGroup] = useState<MuscleGroup | null>(null);

  const { muscleGroups, loadData, loading } = useWorkoutStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

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
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Target className="h-8 w-8" />
                Muscle Groups
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Manage your muscle group categories for workout tracking
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Muscle Group
            </Button>
          </div>
        </div>

        {/* All Muscle Groups */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Muscle Groups</CardTitle>
                <CardDescription>
                  Manage all your muscle group categories
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Muscle Group
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading muscle groups...</p>
              </div>
            ) : muscleGroups.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Muscle Groups</h3>
                <p className="text-muted-foreground mb-6">
                  Create muscle group categories to organize exercises
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Muscle Group
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {muscleGroups.map((muscleGroup) => (
                  <div
                    key={muscleGroup.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{muscleGroup.name}</h4>
                        {muscleGroup.default_group && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {muscleGroup.default_group ? 'System group' : 'Custom group'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMuscleGroup(muscleGroup)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingMuscleGroup(muscleGroup)}
                        className="text-destructive hover:text-destructive"
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

        {/* Dialogs */}
        <CreateMuscleGroupDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />

        {editingMuscleGroup && (
          <EditMuscleGroupDialog 
            open={!!editingMuscleGroup}
            onOpenChange={(open) => !open && setEditingMuscleGroup(null)}
            muscleGroup={editingMuscleGroup}
          />
        )}

        {deletingMuscleGroup && (
          <DeleteMuscleGroupDialog 
            open={!!deletingMuscleGroup}
            onOpenChange={(open) => !open && setDeletingMuscleGroup(null)}
            muscleGroup={deletingMuscleGroup}
          />
        )}
      </div>
    </div>
  );
};

export default MuscleGroups;