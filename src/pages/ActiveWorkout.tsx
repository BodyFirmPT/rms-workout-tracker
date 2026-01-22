import { useState, useEffect } from "react";
import { ArrowLeft, Play, Timer, MoreVertical, Printer, Edit, Plus, XCircle, Share2, Check, Copy } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkoutStore } from "@/stores/workoutStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActiveWorkout as ActiveWorkoutComponent } from "@/components/workout/active-workout";
import { EditWorkoutDialog } from "@/components/workout/edit-workout-dialog";
import { AddInjuryDialog } from "@/components/injury/add-injury-dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ActiveWorkout = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { workouts, startWorkout, getClientById, loadData } = useWorkoutStore();
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [showEditWorkout, setShowEditWorkout] = useState(false);
  const [showAddInjury, setShowAddInjury] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (workouts.length === 0) return;

    if (id) {
      // Show specific workout by ID
      const workout = workouts.find(w => w.id === id);
      if (workout) {
        setCurrentWorkout(workout);
      } else {
        // Workout not found, redirect to dashboard
        navigate("/dashboard");
      }
    } else {
      // No ID provided - look for a started workout
      const startedWorkout = workouts.find(w => w.status === 'started');
      if (startedWorkout) {
        // Redirect to the started workout
        navigate(`/workout/${startedWorkout.id}`, { replace: true });
      } else {
        // No started workout, redirect to dashboard
        navigate("/", { replace: true });
      }
    }
  }, [id, workouts, navigate]);

  const handleStartWorkout = async () => {
    if (currentWorkout) {
      await startWorkout(currentWorkout.id);
      // Reload data to get updated workout status
      await loadData();
    }
  };

  const generateShareToken = () => {
    // Generate a random 12-character alphanumeric token
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const handleShareWorkout = async () => {
    if (!currentWorkout) return;
    
    setIsGeneratingLink(true);
    
    try {
      let shareToken = currentWorkout.share_token;
      
      // If no share token exists, generate one
      if (!shareToken) {
        shareToken = generateShareToken();
        
        const { error } = await supabase
          .from('workout')
          .update({ share_token: shareToken })
          .eq('id', currentWorkout.id);
        
        if (error) throw error;
        
        // Update local state
        setCurrentWorkout(prev => prev ? { ...prev, share_token: shareToken } : null);
      }
      
      // Build the share URL
      const shareUrl = `${window.location.origin}/share/${shareToken}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Link copied!",
        description: "Share this link with your client so they can track their workout.",
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Error",
        description: "Failed to generate share link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Show loading state while determining workout
  if (!currentWorkout) {
    return <div className="min-h-screen bg-background">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
          <div className="text-center py-12">
            <Timer className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
          </div>
        </div>
      </div>;
  }

  const client = getClientById(currentWorkout.client_id);
  const showStartButton = currentWorkout.status === 'draft' || currentWorkout.status === 'completed';
  
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/client/${currentWorkout.client_id}`)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {client?.name || 'Client'}
          </Button>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[300px]">
              <h1 className="text-3xl font-bold text-foreground">
                {currentWorkout.status === 'completed' ? 'Completed Workout' : 
                 currentWorkout.status === 'started' ? 'Active Workout' : 'Workout Details'}
              </h1>
              {currentWorkout.canceled_at && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Canceled
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditWorkout(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Workout
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAddInjury(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Injury
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareWorkout} disabled={isGeneratingLink}>
                    {currentWorkout.share_token ? (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Share Link
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 mr-2" />
                        {isGeneratingLink ? 'Generating...' : 'Share with Client'}
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/workout/${currentWorkout.id}/print`)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Workout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {showStartButton && <Button onClick={handleStartWorkout} size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Workout
            </Button>}
          </div>
        </div>
        
        <ActiveWorkoutComponent workoutId={currentWorkout.id} />
      </div>

      {currentWorkout && (
        <>
          <EditWorkoutDialog
            open={showEditWorkout}
            onOpenChange={setShowEditWorkout}
            workout={currentWorkout}
          />
          <AddInjuryDialog
            open={showAddInjury}
            onOpenChange={setShowAddInjury}
            clientId={currentWorkout.client_id}
            onSuccess={() => {
              setShowAddInjury(false);
              loadData();
            }}
          />
        </>
      )}
    </div>;
};

export default ActiveWorkout;
