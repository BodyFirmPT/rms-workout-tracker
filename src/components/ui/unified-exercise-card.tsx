import { Check, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

interface UnifiedExerciseCardProps {
  exerciseName: string;
  reps: string;
  unit: string;
  setCount: number;
  completedSets?: number;
  note?: string;
  muscleGroup?: string;
  isCompleted?: boolean;
  variant: 'suggested' | 'added';
  onAdd?: () => void;
  onCompleteSet?: (decrement?: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export function UnifiedExerciseCard({
  exerciseName,
  reps,
  unit,
  setCount,
  completedSets = 0,
  note,
  muscleGroup,
  isCompleted = false,
  variant,
  onAdd,
  onCompleteSet,
  onEdit,
  onDelete,
  disabled = false
}: UnifiedExerciseCardProps) {
  const isSuggested = variant === 'suggested';
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg text-sm transition-all duration-200",
        isSuggested 
          ? "bg-muted/30 border-2 border-dashed border-muted-foreground/30" 
          : "bg-background border border-border",
        "hover:shadow-sm"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground truncate">{exerciseName}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {setCount} set{setCount !== 1 ? 's' : ''} × {reps} {unit}
          {note && ` • ${note}`}
          {!isSuggested && (
            <>
              {' • '}
              <span className={cn(
                "font-medium",
                isCompleted ? "text-success" : "text-foreground"
              )}>
                {completedSets}/{setCount} completed
              </span>
            </>
          )}
        </div>
        
        {/* Progress visualization for added exercises */}
        {!isSuggested && setCount > 1 && (
          <div className="mt-2 flex gap-1">
            {Array.from({ length: setCount }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 h-1 rounded-full transition-colors",
                  index < completedSets 
                    ? "bg-success" 
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 ml-3 shrink-0">
        {isSuggested ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            className="h-6 px-2 text-xs"
            disabled={disabled}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        ) : (
          <>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                disabled={disabled}
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                disabled={disabled}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            
            {/* Multiple sets - show individual set controls */}
            {onCompleteSet && setCount > 1 && (
              <div className="flex items-center gap-1">
                {/* Individual set checkmarks */}
                {Array.from({ length: setCount }).map((_, index) => (
                  <button
                    key={index}
                     onClick={() => {
                       // If this set is completed, uncomplete it by decrementing
                       if (index < completedSets && onCompleteSet) {
                         onCompleteSet(true); // Pass true to indicate decrement
                       }
                     }}
                    disabled={disabled || index >= completedSets}
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200",
                      index < completedSets 
                        ? "bg-success border-success text-success-foreground hover:bg-success/80 cursor-pointer" 
                        : "border-muted-foreground/30 text-muted-foreground cursor-default",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {index < completedSets && <Check className="h-2.5 w-2.5" />}
                  </button>
                ))}
                
                {/* Set completion button */}
                {completedSets < setCount && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCompleteSet && onCompleteSet()}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted ml-1"
                    disabled={disabled}
                  >
                    <Check className="h-2.5 w-2.5 mr-1" />
                    Set {completedSets + 1}/{setCount}
                  </Button>
                )}
              </div>
            )}
            
            {/* Single set - show single check button */}
            {onCompleteSet && setCount === 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCompleteSet && onCompleteSet()}
                className={cn(
                  "h-6 w-6 p-0 rounded-full transition-all duration-200",
                  isCompleted 
                    ? "bg-success text-success-foreground hover:bg-success/80" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                disabled={disabled}
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}