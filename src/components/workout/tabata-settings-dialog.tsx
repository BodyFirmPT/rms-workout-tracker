import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Timer } from "lucide-react";
import { TabataSettings, loadTabataSettings, saveTabataSettings } from "@/hooks/useTabataEngine";
import { primeAudio } from "@/lib/beep";

interface TabataSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (settings: TabataSettings) => void;
}

export function TabataSettingsDialog({ open, onOpenChange, onStart }: TabataSettingsDialogProps) {
  const [settings, setSettings] = useState<TabataSettings>(() => loadTabataSettings());

  const update = <K extends keyof TabataSettings>(key: K, value: TabataSettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const handleStart = () => {
    primeAudio();
    saveTabataSettings(settings);
    onStart(settings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Tabata Mode
          </DialogTitle>
          <DialogDescription>
            Set your intervals, then run the workout full screen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="work-time">Work (seconds)</Label>
              <Input
                id="work-time"
                type="number"
                min={5}
                max={600}
                value={settings.workSeconds}
                onChange={e => update('workSeconds', Math.max(1, Number(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rest-time">Rest (seconds)</Label>
              <Input
                id="rest-time"
                type="number"
                min={0}
                max={600}
                value={settings.restSeconds}
                onChange={e => update('restSeconds', Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sequence</Label>
            <RadioGroup
              value={settings.mode}
              onValueChange={value => update('mode', value as TabataSettings['mode'])}
              className="gap-2"
            >
              <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="sets" className="mt-1" />
                <span>
                  <span className="block text-sm font-medium">Repeat sets</span>
                  <span className="block text-xs text-muted-foreground">
                    Each exercise runs all of its sets before moving on
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="circuit" className="mt-1" />
                <span>
                  <span className="block text-sm font-medium">Circuit rounds</span>
                  <span className="block text-xs text-muted-foreground">
                    One pass through every exercise per round
                  </span>
                </span>
              </label>
            </RadioGroup>
          </div>

          {settings.mode === 'circuit' && (
            <div className="space-y-2">
              <Label htmlFor="rounds">Rounds</Label>
              <Input
                id="rounds"
                type="number"
                min={1}
                max={20}
                value={settings.rounds}
                onChange={e => update('rounds', Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="lead-in">Lead-in countdown (seconds)</Label>
            <Input
              id="lead-in"
              type="number"
              min={0}
              max={60}
              value={settings.leadInSeconds}
              onChange={e => update('leadInSeconds', Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleStart}>Start Tabata</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
