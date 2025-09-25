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

  // Separate default and custom muscle groups
  const defaultMuscleGroups = muscleGroups.filter(mg => mg.default_group);
  const customMuscleGroups = muscleGroups.filter(mg => !mg.default_group);

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

        <div className="space-y-6">
          {/* Header Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{muscleGroups.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Default Groups</CardTitle>
                <Badge variant="secondary" className="h-4 px-2 text-xs">System</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{defaultMuscleGroups.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custom Groups</CardTitle>
                <Badge variant="outline" className="h-4 px-2 text-xs">Custom</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customMuscleGroups.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Default Muscle Groups */}
          {defaultMuscleGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">System</Badge>
                  Default Muscle Groups
                </CardTitle>
                <CardDescription>
                  Built-in muscle groups used for exercise categorization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {defaultMuscleGroups.map((muscleGroup) => (
                    <div
                      key={muscleGroup.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{muscleGroup.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Default group
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
              </CardContent>
            </Card>
          )}

          {/* Custom Muscle Groups */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Custom</Badge>
                    Custom Muscle Groups
                  </CardTitle>
                  <CardDescription>
                    Your personalized muscle group categories
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading muscle groups...</p>
                </div>
              ) : customMuscleGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Custom Groups</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your own muscle group categories to organize exercises
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Custom Group
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {customMuscleGroups.map((muscleGroup) => (
                    <div
                      key={muscleGroup.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{muscleGroup.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Custom group
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
        </div>

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