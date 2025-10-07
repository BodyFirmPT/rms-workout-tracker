import { Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MuscleGroupHeaderProps {
  name: string;
  exerciseCount: number;
  isCustom?: boolean;
  isFirst: boolean;
  isLast: boolean;
  hasContent: boolean;
  onAddExercise: () => void;
  onCopyToWorkout?: () => void;
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
  onCopyToWorkout,
  disabled = false
}: MuscleGroupHeaderProps) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 bg-muted border-2 border-border/80 ${
      isFirst ? 'rounded-t-lg' : ''
    } ${isLast && !hasContent ? 'rounded-b-lg' : 'border-b-0'} ${
      !isFirst ? 'border-t-0' : ''
    } shadow-sm`}>
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold text-foreground">{name}</h3>
        {isCustom && (
          <Badge variant="outline" className="text-xs px-1.5 py-0">Custom</Badge>
        )}
        <Badge variant="secondary" className="text-xs px-1.5 py-0">
          {exerciseCount}
        </Badge>
      </div>
      <div className="flex items-center gap-1">
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
        {exerciseCount > 0 && onCopyToWorkout && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                disabled={disabled}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onCopyToWorkout}>
                Copy to another workout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}