import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Crown, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPostHogUser } from "@/lib/posthog";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { WorkoutCountMode } from "@/types/workout";
import { useEmulation } from "@/contexts/EmulationContext";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPaid, isLoading: subscriptionLoading, subscriptionEnd } = useSubscription();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingName, setLoadingName] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [workoutCountMode, setWorkoutCountMode] = useState<WorkoutCountMode>("all");
  const [savingCountMode, setSavingCountMode] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
      
      if (user?.id) {
        const { data } = await supabase
          .from('users')
          .select('full_name, trainer_id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data?.full_name) {
          setFullName(data.full_name);
        }
        if (data?.trainer_id) {
          setTrainerId(data.trainer_id);
          // Load trainer settings
          const { data: trainerData } = await supabase
            .from('trainer')
            .select('workout_count_mode')
            .eq('id', data.trainer_id)
            .maybeSingle();
          if (trainerData?.workout_count_mode) {
            const mode = trainerData.workout_count_mode as WorkoutCountMode;
            setWorkoutCountMode(mode);
            setInitialCountMode(mode);
          }
        }
      }
    };
    getUser();
  }, []);

  const [initialCountMode, setInitialCountMode] = useState<WorkoutCountMode>("all");

  const handleSaveCountMode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!trainerId) {
      console.error("No trainerId found, cannot save workout count mode");
      return;
    }
    
    setSavingCountMode(true);
    try {
      const { error } = await supabase
        .from('trainer')
        .update({ workout_count_mode: workoutCountMode })
        .eq('id', trainerId);
      
      if (error) throw error;
      setInitialCountMode(workoutCountMode);
      toast({ title: "Success", description: "Workout count setting updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingCountMode(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setLoadingName(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Name updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    resetPostHogUser();
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleUpgrade = async () => {
    setLoadingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open subscription portal",
        variant: "destructive",
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold text-foreground mb-8">
          Profile Settings
        </h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} disabled />
              </div>
              
              <form onSubmit={handleUpdateName} className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loadingName}>
                  {loadingName ? "Updating..." : "Update Name"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout Counting</CardTitle>
              <CardDescription>
                Choose which workouts count toward client workout numbers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCountMode} className="space-y-4">
                <RadioGroup
                  value={workoutCountMode}
                  onValueChange={(v) => setWorkoutCountMode(v as WorkoutCountMode)}
                  disabled={savingCountMode}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="count-all" />
                    <Label htmlFor="count-all" className="font-normal cursor-pointer">All workouts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exclude_self_led" id="count-no-self" />
                    <Label htmlFor="count-no-self" className="font-normal cursor-pointer">Exclude self-led workouts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exclude_linked" id="count-no-linked" />
                    <Label htmlFor="count-no-linked" className="font-normal cursor-pointer">Exclude linked workouts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exclude_self_led_linked" id="count-no-both" />
                    <Label htmlFor="count-no-both" className="font-normal cursor-pointer">Exclude self-led &amp; linked workouts</Label>
                  </div>
                </RadioGroup>
                <Button 
                  type="submit"
                  disabled={savingCountMode || workoutCountMode === initialCountMode}
                >
                  {savingCountMode ? "Saving..." : "Save"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Password</CardTitle>
              <CardDescription>
                Set or change your password. This allows you to log in with email and password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Subscription
                {subscriptionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPaid ? (
                  <Badge className="bg-primary"><Crown className="h-3 w-3 mr-1" />Pro</Badge>
                ) : (
                  <Badge variant="secondary">Free</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isPaid 
                  ? subscriptionEnd 
                    ? `Your Pro subscription renews on ${new Date(subscriptionEnd).toLocaleDateString()}`
                    : "You have an active Pro subscription"
                  : "Upgrade to Pro for unlimited clients and premium features"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPaid ? (
                <Button 
                  variant="outline" 
                  onClick={handleManageSubscription}
                  disabled={loadingSubscription}
                >
                  {loadingSubscription ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
                  ) : (
                    <><CreditCard className="h-4 w-4 mr-2" />Manage Subscription</>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleUpgrade}
                  disabled={loadingSubscription}
                >
                  {loadingSubscription ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
                  ) : (
                    <><Crown className="h-4 w-4 mr-2" />Upgrade to Pro - $10/month</>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sign Out</CardTitle>
              <CardDescription>Sign out of your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
