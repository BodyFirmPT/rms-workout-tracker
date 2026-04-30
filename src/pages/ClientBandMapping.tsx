import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Cable } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useWorkoutStore } from "@/stores/workoutStore";
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

export default function ClientBandMapping() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { getClientById, loadData, bandColors, clientBandMappings, loadBandData } = useWorkoutStore();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    loadBandData();
  }, [loadData, loadBandData]);

  const client = clientId ? getClientById(clientId) : null;

  const setMapping = async (
    bandCategory: BandCategory,
    resistanceLevel: ResistanceLevel,
    colorId: string,
  ) => {
    if (!clientId) return;
    setSaving(true);
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
      setSaving(false);
    }
  };

  const resetMapping = async (bandCategory: BandCategory, resistanceLevel: ResistanceLevel) => {
    if (!clientId) return;
    const existing = clientBandMappings.find(
      (m) =>
        m.client_id === clientId &&
        m.band_category === bandCategory &&
        m.resistance_level === resistanceLevel,
    );
    if (!existing) return;
    setSaving(true);
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
      setSaving(false);
    }
  };

  const renderSection = (bandCategory: BandCategory, title: string, description: string) => (
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
            <div key={level} className="flex items-center gap-3">
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
                disabled={saving}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder={defaultColorName ? `Default: ${defaultColorName}` : "Pick a color"} />
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
                <Button variant="ghost" size="sm" onClick={() => resetMapping(bandCategory, level)} disabled={saving}>
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
          <Button onClick={() => navigate("/dashboard")} className="mt-4">Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/client/${clientId}`)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to {client.name}
          </Button>
        </div>
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-full">
            <Cable className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Band Color Mapping</h1>
            <p className="text-muted-foreground">
              Customize which physical color each resistance level maps to for {client.name}.
              Unset levels use the system defaults.
            </p>
          </div>
        </div>
        <div className="space-y-6">
          {renderSection("band", "Resistance Bands", "1-handle, 2-handle, flat, figure-8, leg cuffs.")}
          {renderSection("ankle_weight", "Ankle Weights", "Used for ankle-weight band exercises.")}
        </div>
      </div>
    </div>
  );
}
