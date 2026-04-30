import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

interface BandColor {
  id: string;
  name: string;
  hex: string;
  sort_order: number;
}

// Returns a text-shadow outline for colors that are too light to read on a white-ish bg.
function getTextStyle(hex: string): React.CSSProperties {
  const h = hex.replace("#", "");
  if (h.length !== 6) return { color: hex };
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Perceived luminance (0-255)
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  const style: React.CSSProperties = { color: hex };
  if (luminance > 200) {
    style.textShadow =
      "-1px -1px 0 hsl(var(--foreground)), 1px -1px 0 hsl(var(--foreground)), -1px 1px 0 hsl(var(--foreground)), 1px 1px 0 hsl(var(--foreground))";
  }
  return style;
}

export default function AdminBandColors() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [colors, setColors] = useState<BandColor[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#000000");
  const [newSort, setNewSort] = useState<number>(0);

  useEffect(() => {
    void checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        toast.error("Admin privileges required");
        navigate("/dashboard");
        return;
      }
      setIsAdmin(true);
      await loadColors();
    } finally {
      setLoading(false);
    }
  };

  const loadColors = async () => {
    const { data, error } = await (supabase.from as any)("band_color_option")
      .select("*")
      .order("sort_order");
    if (error) {
      toast.error("Failed to load colors");
      return;
    }
    setColors((data as BandColor[]) || []);
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    const { error } = await (supabase.from as any)("band_color_option").insert({
      name: newName.trim(),
      hex: newHex,
      sort_order: newSort,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Color added");
    setNewName("");
    setNewHex("#000000");
    setNewSort(0);
    await loadColors();
  };

  const handleUpdate = async (color: BandColor) => {
    const { error } = await (supabase.from as any)("band_color_option")
      .update({
        name: color.name,
        hex: color.hex,
        sort_order: color.sort_order,
      })
      .eq("id", color.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await (supabase.from as any)("band_color_option")
      .delete()
      .eq("id", deleteId);
    setDeleteId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    await loadColors();
  };

  const updateLocal = (id: string, patch: Partial<BandColor>) => {
    setColors((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Band Colors</h1>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
        </div>

        <div className="bg-card border rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Color</h2>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
            <div>
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Orange"
              />
            </div>
            <div>
              <Label htmlFor="new-hex">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="new-hex"
                  type="color"
                  value={newHex}
                  onChange={(e) => setNewHex(e.target.value)}
                  className="w-20 h-10 p-1"
                />
                <span
                  className="text-sm font-medium"
                  style={getTextStyle(newHex)}
                >
                  {newName || "Preview"}
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="new-sort">Order</Label>
              <Input
                id="new-sort"
                type="number"
                value={newSort}
                onChange={(e) => setNewSort(parseInt(e.target.value) || 0)}
                className="w-24"
              />
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Swatch</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-32">Hex</TableHead>
                <TableHead className="w-28">Order</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colors.map((color) => (
                <TableRow key={color.id}>
                  <TableCell>
                    <div
                      className="h-8 w-8 rounded border"
                      style={{ backgroundColor: color.hex }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={color.name}
                      onChange={(e) =>
                        updateLocal(color.id, { name: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={color.hex}
                        onChange={(e) =>
                          updateLocal(color.id, { hex: e.target.value })
                        }
                        className="w-16 h-9 p-1"
                      />
                      <span
                        className="text-sm font-medium whitespace-nowrap"
                        style={getTextStyle(color.hex)}
                      >
                        {color.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={color.sort_order}
                      onChange={(e) =>
                        updateLocal(color.id, {
                          sort_order: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUpdate(color)}
                        title="Save"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(color.id)}
                        className="hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {colors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No colors yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Color</AlertDialogTitle>
            <AlertDialogDescription>
              This may break client band mappings that reference this color. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
