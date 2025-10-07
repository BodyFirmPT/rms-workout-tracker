import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Copy, Plus, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateWorkoutDialog } from "./create-workout-dialog";
import { toast } from "@/hooks/use-toast";

interface CopyExercisesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceWorkoutId: string;
  muscleGroupId?: string;
  categoryName?: string;
  muscleGroupName?: string;
  exerciseCount: number;
}

export function CopyExercisesDialog({
  open,
  onOpenChange,
  sourceWorkoutId,
  muscleGroupId,
  categoryName,
  muscleGroupName,
  exerciseCount,
}: CopyExercisesDialogProps) {
  const { workouts, getClientById, copyExercisesToWorkout, copyExercisesByCategoryToWorkout, loadData } = useWorkoutStore();
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);
  const [copying, setCopying] = useState<string | null>(null);

  const sourceWorkout = workouts.find(w => w.id === sourceWorkoutId);
  const clientId = sourceWorkout?.client_id;

  // Get recent workouts for the same client (excluding the current one)
  const recentWorkouts = workouts
    .filter(w => w.client_id === clientId && w.id !== sourceWorkoutId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const handleCopyToWorkout = async (targetWorkoutId: string) => {
    setCopying(targetWorkoutId);
    try {
      if (categoryName && copyExercisesByCategoryToWorkout) {
        await copyExercisesByCategoryToWorkout(sourceWorkoutId, targetWorkoutId, categoryName);
      } else if (muscleGroupId && copyExercisesToWorkout) {
        await copyExercisesToWorkout(sourceWorkoutId, targetWorkoutId, muscleGroupId);
      }
      
      const sourceName = categoryName || muscleGroupName || 'exercises';
      toast({
        title: "Exercises copied",
        description: `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} from ${sourceName} copied successfully.`,
      });
      onOpenChange(false);
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy exercises. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCopying(null);
    }
  };

  const handleCreateAndCopy = async (newWorkoutId: string) => {
    setShowCreateWorkout(false);
    await handleCopyToWorkout(newWorkoutId);
  };

  if (!sourceWorkout || !clientId) return null;

  const client = getClientById(clientId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Copy {categoryName || muscleGroupName} Exercises</DialogTitle>
            <DialogDescription>
              Copy {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} to another workout for {client?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create New Workout Option */}
            <Card className="border-dashed border-2">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Create New Workout</p>
                    <p className="text-sm text-muted-foreground">Start a fresh workout with these exercises</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowCreateWorkout(true)}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </CardContent>
            </Card>

            {/* Recent Workouts List */}
            {recentWorkouts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Recent Workouts</h3>
                <ScrollArea className="h-[300px] rounded-md border">
                  <div className="p-4 space-y-2">
                    {recentWorkouts.map((workout) => {
                      const workoutDate = new Date(workout.date + 'T00:00:00');
                      return (
                        <Card key={workout.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <p className="font-medium">
                                    {format(workoutDate, 'MMMM d, yyyy')}
                                  </p>
                                  <Badge 
                                    variant={
                                      workout.status === 'completed' 
                                        ? 'default' 
                                        : workout.status === 'started' 
                                        ? 'secondary' 
                                        : 'outline'
                                    }
                                    className={
                                      workout.status === 'completed'
                                        ? 'bg-success/10 text-success border-success/20'
                                        : ''
                                    }
                                  >
                                    {workout.status}
                                  </Badge>
                                </div>
                                {workout.note && (
                                  <p className="text-sm text-muted-foreground">{workout.note}</p>
                                )}
                              </div>
                              <Button
                                onClick={() => handleCopyToWorkout(workout.id)}
                                disabled={copying === workout.id}
                                size="sm"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                {copying === workout.id ? 'Copying...' : 'Copy Here'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {recentWorkouts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No other workouts found for this client.</p>
                <p className="text-sm mt-2">Create a new workout to copy these exercises.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Workout Dialog */}
      {clientId && (
        <CreateWorkoutDialog
          open={showCreateWorkout}
          onOpenChange={setShowCreateWorkout}
          defaultClientId={clientId}
          onWorkoutCreated={handleCreateAndCopy}
        />
      )}
    </>
  );
}
