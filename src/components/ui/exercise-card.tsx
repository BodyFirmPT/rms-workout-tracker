import { CheckCircle, Circle, Plus } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

interface ExerciseCardProps {
  exerciseName: string;
  reps: string;
  completedSets: number;
  totalSets: number;
  unit: string;
  note?: string;
  muscleGroup: string;
  isCompleted: boolean;
  onCompleteSet?: () => void;
  isActive?: boolean;
}

export function ExerciseCard({
  exerciseName,
  reps,
  completedSets,
  totalSets,
  unit,
  note,
  muscleGroup,
  isCompleted,
  onCompleteSet,
  isActive = false
}: ExerciseCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-card",
      isCompleted && "bg-success/5 border-success/20",
      isActive && "ring-2 ring-primary/20"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {muscleGroup}
              </Badge>
              {isCompleted && (
                <CheckCircle className="h-4 w-4 text-success" />
              )}
            </div>
            
            <h4 className="font-semibold text-foreground mb-1 truncate">
              {exerciseName}
            </h4>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium">{reps} {unit}</span>
              <span>•</span>
              <span>{completedSets}/{totalSets} sets</span>
            </div>
            
            {note && (
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {note}
              </p>
            )}
          </div>
          
          {onCompleteSet && !isCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCompleteSet}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Progress visualization */}
        <div className="mt-3 flex gap-1">
          {Array.from({ length: totalSets }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex-1 h-2 rounded-full transition-colors",
                index < completedSets 
                  ? "bg-success" 
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}