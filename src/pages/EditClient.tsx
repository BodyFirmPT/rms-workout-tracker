import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Cable, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkoutStore } from "@/stores/workoutStore";
import { CreateTrainerDialog } from "@/components/workout/create-trainer-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  RESISTANCE_LEVELS,
  RESISTANCE_LABELS,
  DEFAULT_BAND_MAPPING,
  resolveBandColor,
  type BandCategory,
  type ResistanceLevel,
} from "@/lib/band-colors";

export default function EditClient() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const {
    getClientById,
    loadData,
    trainers,
    updateClient,
    bandColors,
    clientBandMappings,
    loadBandData,
  } = useWorkoutStore();

  const client = clientId ? getClientById(clientId) : null;

  const [name, setName] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [workoutCountOffset, setWorkoutCountOffset] = useState(0);
  const [showCreateTrainer, setShowCreateTrainer] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingMapping, setSavingMapping] = useState(false);

  useEffect(() => {
    loadData();
    loadBandData();
  }, [loadData, loadBandData]);

  useEffect(() => {
    if (client) {
      setName(client.name);
      setTrainerId(client.trainer_id);
      setWorkoutCountOffset(client.workout_count_offset || 0);
    }
  }, [client]);

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !name.trim() || !trainerId) return;
    setSavingDetails(true);
    try {
      await updateClient(client.id, {
        name: name.trim(),
        trainer_id: trainerId,
        workout_count_offset: workoutCountOffset,
      });
      toast.success("Client updated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update client");
    } finally {
      setSavingDetails(false);
    }
  };

  const setMapping = async (
    bandCategory: BandCategory,
    resistanceLevel: ResistanceLevel,
    colorId: string,
  ) => {
    if (!clientId) return;
    setSavingMapping(true);
    try {
      const existing = clientBandMappings.find(
        (m) =>
          m.client_id === clientId &&
          m.band_category === bandCategory &&
          m.resistance_level === resistanceLevel,
      );
      if (existing) {
        const { error } = await (supabase.from as any)("client_band_mapping")
          .update({ color_id: colorId })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from as any)("client_band_mapping").insert({
          client_id: clientId,
          band_category: bandCategory,
          resistance_level: resistanceLevel,
          color_id: colorId,
        });
        if (error) throw error;
      }
      await loadBandData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update mapping");
    } finally {
      setSavingMapping(false);
    }
  };

  const resetMapping = async (
    bandCategory: BandCategory,
    resistanceLevel: ResistanceLevel,
  ) => {
    if (!clientId) return;
    const existing = clientBandMappings.find(
      (m) =>
        m.client_id === clientId &&
        m.band_category === bandCategory &&
        m.resistance_level === resistanceLevel,
    );
    if (!existing) return;
    setSavingMapping(true);
    try {
      const { error } = await (supabase.from as any)("client_band_mapping")
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
      await loadBandData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to reset mapping");
    } finally {
      setSavingMapping(false);
    }
  };

  const renderBandSection = (
    bandCategory: BandCategory,
    title: string,
    description: string,
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {RESISTANCE_LEVELS[bandCategory].map((level) => {
          const resolved = resolveBandColor({
            clientId: clientId || null,
            bandCategory,
            resistanceLevel: level,
            palette: bandColors,
            mappings: clientBandMappings,
          });
          const override = clientBandMappings.find(
            (m) =>
              m.client_id === clientId &&
              m.band_category === bandCategory &&
              m.resistance_level === level,
          );
          const defaultColorName = DEFAULT_BAND_MAPPING[bandCategory][level];
          return (
            <div key={level} className="flex items-center gap-3 flex-wrap">
              <div className="w-28">
                <Label>{RESISTANCE_LABELS[level]}</Label>
              </div>
              <span
                className="inline-block h-5 w-5 rounded-full border border-border shrink-0"
                style={{ backgroundColor: resolved.hex }}
              />
              <Select
                value={override?.color_id ?? ""}
                onValueChange={(v) => setMapping(bandCategory, level, v)}
                disabled={savingMapping}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue
                    placeholder={
                      defaultColorName ? `Default: ${defaultColorName}` : "Pick a color"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {bandColors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-border"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {override && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetMapping(bandCategory, level)}
                  disabled={savingMapping}
                >
                  Reset
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  if (!client) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <p className="text-muted-foreground">Client not found</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/client/${clientId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to {client.name}
          </Button>
        </div>

        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-full">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Edit Client</h1>
            <p className="text-muted-foreground">
              Update client information and band color preferences.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
              <CardDescription>Name, trainer, and workout history offset.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitDetails} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Client Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter client name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trainer">Trainer</Label>
                  <div className="flex gap-2">
                    <Select value={trainerId} onValueChange={setTrainerId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a trainer" />
                      </SelectTrigger>
                      <SelectContent>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateTrainer(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offset">Workout Count Offset</Label>
                  <Input
                    id="offset"
                    type="number"
                    min="0"
                    value={workoutCountOffset}
                    onChange={(e) =>
                      setWorkoutCountOffset(parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add previous workouts done before using this system
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!name.trim() || !trainerId || savingDetails}
                  >
                    {savingDetails ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pt-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Cable className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Band Color Mapping</h2>
              <p className="text-sm text-muted-foreground">
                Customize which physical color each resistance level maps to. Unset
                levels use the system defaults.
              </p>
            </div>
          </div>

          {renderBandSection(
            "band",
            "Resistance Bands",
            "1-handle, 2-handle, flat, figure-8, leg cuffs.",
          )}
          {renderBandSection(
            "ankle_weight",
            "Ankle Weights",
            "Used for ankle-weight band exercises.",
          )}
        </div>
      </div>

      <CreateTrainerDialog
        open={showCreateTrainer}
        onOpenChange={setShowCreateTrainer}
      />
    </div>
  );
}
