import { AlertCircle, Ban, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LandingFeatureShowcase() {
  const features = [
    {
      id: "injury-log",
      title: "Injury Log",
      description: "Track and manage injuries for each client",
      icon: AlertCircle,
      iconBg: "bg-pink-100 dark:bg-pink-900/30",
      iconColor: "text-pink-500",
      preview: (
        <div className="space-y-3">
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Active Injuries</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">Femur Pain from Arizona Pavement Run</span>
                <Badge variant="destructive" className="text-xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm">Broken LEFT wrist</span>
                <Badge variant="destructive" className="text-xs">Active</Badge>
              </div>
            </div>
          </div>
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Injury History</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <span className="text-sm">Calf Soreness at the Origin of the Achilles Tendon</span>
              <Badge variant="secondary" className="text-xs">Recovered</Badge>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "restricted-exercises",
      title: "Restricted Exercises",
      description: "Manage exercises clients should avoid",
      icon: Ban,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-500",
      preview: (
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground p-2 border-b bg-muted/30">
            <span>Exercise Name</span>
            <span>Muscle Group</span>
            <span>Added On</span>
          </div>
          <div className="divide-y">
            <div className="grid grid-cols-3 text-sm p-2">
              <span>Ball Bridge Lats 1 DB</span>
              <span className="text-muted-foreground">Lats</span>
              <span className="text-muted-foreground">Nov 12, 2025</span>
            </div>
            <div className="grid grid-cols-3 text-sm p-2">
              <span>Big Ball Low Ab Roll-Ins</span>
              <span className="text-muted-foreground">Low ab</span>
              <span className="text-muted-foreground">Oct 27, 2025</span>
            </div>
            <div className="grid grid-cols-3 text-sm p-2">
              <span>Concentration curls</span>
              <span className="text-muted-foreground">Biceps</span>
              <span className="text-muted-foreground">Oct 25, 2025</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "workout-import",
      title: "AI Workout Importer",
      description: "Bulk import historical workouts with AI",
      icon: Upload,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-500",
      preview: (
        <div className="space-y-3">
          <div className="rounded-lg border p-3 space-y-2">
            <span className="font-medium text-sm">Workout Data</span>
            <p className="text-xs text-muted-foreground">
              Paste one or more workouts below. Include dates to separate multiple workouts.
            </p>
            <div className="rounded border border-dashed p-3 text-xs text-muted-foreground font-mono bg-muted/30 min-h-[60px]">
              Paste workout data here... Include dates to separate workouts, e.g.: Date: 1/15/2019 Abdominal, Ab Rollouts, 15 reps...
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 border rounded" />
            <span>Import automatically when possible</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h3 className="text-3xl md:text-4xl font-fugaz mb-4">Easy client management</h3>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Track injuries, manage exercise restrictions, and import historical workouts—all in one place.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <Card key={feature.id} className="border-border/50 bg-card/50 overflow-hidden">
              <CardHeader className="pb-2">
                <div className={`rounded-full p-2 w-fit ${feature.iconBg}`}>
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <CardTitle className="text-xl mt-2">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {feature.preview}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
