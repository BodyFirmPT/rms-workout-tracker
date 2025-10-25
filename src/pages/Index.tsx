import { useNavigate } from "react-router-dom";
import { Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientSelector } from "@/components/dashboard/client-selector";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
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
    </div>;
};
export default Index;