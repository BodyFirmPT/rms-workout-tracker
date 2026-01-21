import { useNavigate } from "react-router-dom";
import { AlertCircle, Ban, Upload, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FeatureShowcaseProps {
  selectedClientId?: string;
  clientName?: string;
}

export function FeatureShowcase({ selectedClientId, clientName }: FeatureShowcaseProps) {
  const navigate = useNavigate();

  const features = [
    {
      id: "injury-log",
      title: "Injury Log",
      description: "Track active injuries and recovery history",
      icon: AlertCircle,
      iconBg: "bg-pink-100 dark:bg-pink-900/30",
      iconColor: "text-pink-500",
      preview: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Active Injuries</span>
            <Badge variant="destructive" className="text-xs">Active</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Monitor current injuries requiring attention and track recovery progress over time.
          </p>
        </div>
      ),
      path: selectedClientId ? `/client/${selectedClientId}/injuries` : null,
    },
    {
      id: "restricted-exercises",
      title: "Restricted Exercises",
      description: "Manage exercises to avoid",
      icon: Ban,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-500",
      preview: (
        <div className="space-y-2">
          <div className="text-sm">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Exercise Name</span>
              <span>Muscle Group</span>
            </div>
            <div className="h-px bg-border" />
          </div>
          <p className="text-xs text-muted-foreground">
            Keep track of exercises that should be avoided due to injuries or limitations.
          </p>
        </div>
      ),
      path: selectedClientId ? `/client/${selectedClientId}/restricted-exercises` : null,
    },
    {
      id: "workout-import",
      title: "AI Workout Importer",
      description: "Bulk import historical workouts",
      icon: Upload,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-500",
      preview: (
        <div className="space-y-2">
          <div className="rounded border border-dashed border-muted-foreground/30 p-2 text-xs text-muted-foreground font-mono">
            Paste workout data here...
          </div>
          <p className="text-xs text-muted-foreground">
            Import up to 10 workouts at once using AI-powered parsing.
          </p>
        </div>
      ),
      path: selectedClientId ? `/client/${selectedClientId}/import` : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Client Features</h2>
        <p className="text-muted-foreground">
          {selectedClientId 
            ? `Manage ${clientName || "client"}'s training data`
            : "Select a client above to access these features"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isDisabled = !feature.path;

          return (
            <Card 
              key={feature.id}
              className={`relative transition-all ${
                isDisabled 
                  ? "opacity-60" 
                  : "hover:border-primary/50 hover:shadow-md cursor-pointer"
              }`}
              onClick={() => feature.path && navigate(feature.path)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`rounded-full p-2 ${feature.iconBg}`}>
                    <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>
                  {!isDisabled && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {feature.preview}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
