import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  trainer_id: string | null;
}

interface Trainer {
  id: string;
  name: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) throw roleError;

      if (!roleData) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast.error("Failed to verify admin access");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [usersResponse, trainersResponse, rolesResponse] = await Promise.all([
        supabase.from("users").select("id, email, full_name, trainer_id"),
        supabase.from("trainer").select("id, name"),
        supabase.from("user_roles").select("user_id, role").eq("role", "admin")
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (trainersResponse.error) throw trainersResponse.error;
      if (rolesResponse.error) throw rolesResponse.error;

      setUsers(usersResponse.data || []);
      setTrainers(trainersResponse.data || []);
      setUserRoles(rolesResponse.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    }
  };

  const handleTrainerChange = async (userId: string, trainerId: string | null) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ trainer_id: trainerId === "none" ? null : trainerId })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Trainer updated successfully");
      await loadData();
    } catch (error) {
      console.error("Error updating trainer:", error);
      toast.error("Failed to update trainer");
    }
  };

  const isUserAdmin = (userId: string) => {
    return userRoles.some(role => role.user_id === userId);
  };

  const handleAdminToggle = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
        toast.success("Admin role removed");
      } else {
        // Add admin role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (error) throw error;
        toast.success("Admin role granted");
      }

      await loadData();
    } catch (error) {
      console.error("Error toggling admin status:", error);
      toast.error("Failed to update admin status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>

        <div className="bg-card rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email || "N/A"}</TableCell>
                  <TableCell>{user.full_name || "N/A"}</TableCell>
                  <TableCell>
                    <Select
                      value={user.trainer_id || "none"}
                      onValueChange={(value) => handleTrainerChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select trainer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Trainer</SelectItem>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isUserAdmin(user.id)}
                        onCheckedChange={(checked) => handleAdminToggle(user.id, isUserAdmin(user.id))}
                      />
                      {isUserAdmin(user.id) && (
                        <span className="text-sm">Admin</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
