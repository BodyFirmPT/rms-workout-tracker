import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, ArrowRight, Loader2 } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [hasClients, setHasClients] = useState(false);

  useEffect(() => {
    const checkAuthAndClients = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/signup");
        return;
      }

      // Get user's trainer_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('trainer_id, client_id')
        .eq('id', session.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        setCheckingAuth(false);
        return;
      }

      if (userData?.trainer_id) {
        setTrainerId(userData.trainer_id);

        // Check if user already has clients (besides their own self-client)
        const { data: clients, error: clientsError } = await supabase
          .from('client')
          .select('id')
          .eq('trainer_id', userData.trainer_id)
          .neq('id', userData.client_id || '');

        if (!clientsError && clients && clients.length > 0) {
          // User already has clients, skip onboarding
          setHasClients(true);
          navigate("/dashboard");
          return;
        }
      }

      setCheckingAuth(false);
    };

    checkAuthAndClients();
  }, [navigate]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim() || !trainerId) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('client')
        .insert({
          name: clientName.trim(),
          trainer_id: trainerId
        });

      if (error) throw error;

      toast({
        title: "Client created!",
        description: `${clientName} has been added to your roster.`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-8 rounded-full bg-primary" />
          <div className="h-2 w-8 rounded-full bg-muted" />
        </div>

        <Card className="border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Add your first client</CardTitle>
            <CardDescription className="text-base">
              Create a client to start tracking their workouts. You can always add more later.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleCreateClient} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  placeholder="e.g., John Smith"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-12"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Enter your client's name as you'd like it to appear in workouts
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full h-12" 
                  disabled={!clientName.trim() || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Client
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleSkip}
                >
                  Skip for now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          You can track your own workouts too - they'll appear under "My workouts" in the dashboard.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
