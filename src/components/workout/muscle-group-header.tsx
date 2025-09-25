import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MuscleGroupHeaderProps {
  name: string;
  exerciseCount: number;
  isCustom?: boolean;
  isFirst: boolean;
  isLast: boolean;
  hasContent: boolean;
  onAddExercise: () => void;
  disabled?: boolean;
}

export function MuscleGroupHeader({
  name,
  exerciseCount,
  isCustom = false,
  isFirst,
  isLast,
  hasContent,
  onAddExercise,
  disabled = false
}: MuscleGroupHeaderProps) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 bg-muted/50 border border-border ${
      isFirst ? 'rounded-t-lg' : ''
    } ${isLast && !hasContent ? 'rounded-b-lg' : 'border-b-0'} ${
      !isFirst ? 'border-t-0' : ''
    }`}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{name}</h3>
        {isCustom && (
          <Badge variant="outline" className="text-xs px-1.5 py-0">Custom</Badge>
        )}
        <Badge variant="secondary" className="text-xs px-1.5 py-0">
          {exerciseCount}
        </Badge>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onAddExercise} 
        className="h-6 px-2 text-xs" 
        disabled={disabled}
      >
        <Plus className="h-2.5 w-2.5 mr-1" />
        Add
      </Button>
    </div>
  );
}