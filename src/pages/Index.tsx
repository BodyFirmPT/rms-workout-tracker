import { useNavigate } from "react-router-dom";
import { Settings, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientSelector } from "@/components/dashboard/client-selector";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmulation } from "@/contexts/EmulationContext";

const Index = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const { emulatedUser } = useEmulation();

  useEffect(() => {
    checkAdminStatus();
  }, [emulatedUser]);

  const checkAdminStatus = async () => {
    const userId = emulatedUser?.id || (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[300px]">
              <h1 className="text-4xl font-bold text-foreground mb-2">BodyFirm PT</h1>
              <p className="text-lg text-muted-foreground">
                Select a client to view their training sessions and create new workouts
              </p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate("/admin")} className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/profile")} className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Button>
              <Button variant="outline" onClick={() => navigate("/muscle-groups")} className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manage Muscle Groups
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ClientSelector />
        </div>
      </div>
    </div>
  );
};

export default Index;