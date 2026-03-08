import { useState } from "react";
import { Check, Plus, Edit, Trash2, Zap, Dumbbell, MoreVertical, Wind, Clock, Cable, Paperclip } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { ExerciseTimer } from "@/components/workout/exercise-timer";
import { ExerciseMediaModal } from "@/components/workout/exercise-media-modal";
import { ExerciseMedia } from "@/types/workout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BAND_COLOR_MAP: Record<string, string> = {
  Black: '#374151',
  Blue: '#3b82f6',
  Purple: '#8b5cf6',
  Red: '#ef4444',
  Green: '#22c55e',
  Yellow: '#eab308',
  Pink: '#ec4899',
};

function getBandDisplayColor(color: string): string {
  return BAND_COLOR_MAP[color] ?? 'currentColor';
}

interface UnifiedExerciseCardProps {
  exerciseName: string;
  repsCount: number;
  repsUnit: string;
  weightCount: number;
  weightUnit: string;
  leftWeight?: number;
  setCount: number;
  completedSets?: number;
  note?: string;
  muscleGroup?: string;
  isCompleted?: boolean;
  variant: 'suggested' | 'added';
  type?: 'exercise' | 'weight' | 'band' | 'stretch';
  bandColor?: string | null;
  bandType?: string | null;
  imageUrl?: string | null;
  media?: ExerciseMedia[];
  workoutDate?: string;
  clientName?: string;
  onAdd?: () => void;
  onCompleteSet?: (decrement?: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  workoutStarted?: boolean;
}

export function UnifiedExerciseCard({
  exerciseName,
  repsCount,
  repsUnit,
  weightCount,
  weightUnit,
  leftWeight,
  setCount,
  completedSets = 0,
  note,
  muscleGroup,
  isCompleted = false,
  variant,
  type = 'weight',
  bandColor,
  bandType,
  imageUrl,
  media,
  workoutDate,
  clientName,
  onAdd,
  onCompleteSet,
  onEdit,
  onDelete,
  disabled = false,
  workoutStarted = false
}: UnifiedExerciseCardProps) {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const hasMedia = (media && media.length > 0) || !!imageUrl;
  const isSuggested = variant === 'suggested';
  const isStretch = type === 'stretch';
  const isBand = type === 'band';
  const isTimedExercise = !isSuggested && (repsUnit.toLowerCase() === 'sec' || repsUnit.toLowerCase() === 'seconds');
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3 py-1.5 px-2 text-sm transition-all duration-200 border-b border-border/50",
        isSuggested 
          ? "bg-muted/30 border-l-2 border-l-muted-foreground/30 text-muted-foreground" 
          : "hover:bg-muted/30",
        isCompleted && "opacity-60"
      )}
    >
      {/* Icon */}
      {isSuggested ? (
        <Zap className="h-3 w-3 text-muted-foreground/70 shrink-0" />
      ) : isBand ? (
        <Cable className="h-3 w-3 text-muted-foreground/60 shrink-0" />
      ) : isStretch ? (
        <Wind className="h-3 w-3 text-muted-foreground/60 shrink-0" />
      ) : (
        <Dumbbell className="h-3 w-3 text-muted-foreground/60 shrink-0" />
      )}
      
      {/* Exercise content - name, details, and note all at same indentation */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(
            "font-medium break-words",
            isSuggested 
              ? "text-muted-foreground" 
              : isCompleted 
                ? "line-through text-muted-foreground" 
                : "text-foreground"
          )}>
            {exerciseName}
          </span>
          {hasMedia && (
            <button
              type="button"
              onClick={() => setShowMediaModal(true)}
              className={cn(
                isSuggested ? "text-muted-foreground hover:text-muted-foreground/80" : "text-primary hover:text-primary/80",
                "transition-colors inline-flex items-center gap-0.5"
              )}
              title="View media"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {media && media.length > 1 && <span className="text-[10px]">{media.length}</span>}
            </button>
          )}
          <span className={cn(
            "text-xs font-mono",
            isSuggested ? "text-muted-foreground/70" : "text-muted-foreground"
          )}>
            {setCount} × {repsCount} {repsUnit}
            {isBand && bandColor && bandType 
              ? <> • <span style={{ color: getBandDisplayColor(bandColor) }} className="font-semibold">{bandColor}</span> {bandType} band</>
              : weightCount > 0 && leftWeight !== null && leftWeight !== undefined 
                ? ` @ R:${weightCount} ${weightUnit} L:${leftWeight} ${weightUnit}` 
                : weightCount > 0 
                  ? ` @ ${weightCount} ${weightUnit}` 
                  : ''}
          </span>
        </div>
        {note && (
          <div className="text-xs text-muted-foreground mt-0.5 break-words">
            {note}
          </div>
        )}
        {workoutDate && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mt-0.5">
            <Clock className="h-2.5 w-2.5" />
            <span>
              {formatDistanceToNow(new Date(workoutDate + 'T00:00:00'), { addSuffix: true })}
              {clientName && <> · {clientName}</>}
            </span>
          </div>
        )}
      </div>
      
      {/* Progress - compact */}
      {!isSuggested && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono whitespace-nowrap">
          <span className={cn(
            "font-medium",
            isCompleted ? "text-success" : "text-foreground"
          )}>
            {completedSets}/{setCount}
          </span>
          {setCount > 1 && (
            <div className="flex gap-0.5 ml-1">
              {Array.from({ length: setCount }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    index < completedSets ? "bg-success" : "bg-muted"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Timer for timed exercises */}
      {isTimedExercise && (
        <ExerciseTimer 
          duration={repsCount} 
          setCount={setCount}
          completedSets={completedSets}
          onComplete={() => onCompleteSet?.()}
          onReset={() => onCompleteSet?.(true)}
        />
      )}
      
      {/* Actions - compact buttons */}
      <div className={cn("flex items-center shrink-0", isTimedExercise ? "gap-0" : "gap-0.5")}>
        {isSuggested ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
            disabled={disabled}
          >
            <Plus className="h-2.5 w-2.5 mr-1" />
            Quick Add
          </Button>
        ) : (
          <>
            {/* Completion control - prioritize this (hide for timed exercises since timer handles it) */}
            {onCompleteSet && !isTimedExercise && (
              <>
                {setCount > 1 ? (
                  // Multiple sets - show completion controls
                  <div className="flex items-center gap-1">
                    {completedSets > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCompleteSet && onCompleteSet(true)}
                        className="h-8 w-8 p-0 border-2 border-primary text-primary hover:bg-primary/10"
                        disabled={disabled}
                        title="Undo last set"
                      >
                        <span className="text-base font-bold">-</span>
                      </Button>
                    )}
                    {completedSets < setCount && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCompleteSet && onCompleteSet()}
                        className="h-8 px-3 text-sm font-semibold border-2 border-primary text-primary hover:bg-primary/10"
                        disabled={disabled}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {completedSets + 1}
                      </Button>
                    )}
                  </div>
                ) : (
                  // Single set - show check button
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCompleteSet && onCompleteSet()}
                    className={cn(
                      "h-9 w-9 p-0 rounded-full border-2",
                      isCompleted 
                        ? "bg-success border-success text-success-foreground hover:bg-success/80" 
                        : "border-primary text-primary hover:bg-primary/10"
                    )}
                    disabled={disabled}
                  >
                    <Check className="h-5 w-5 font-bold" strokeWidth={3} />
                  </Button>
                )}
              </>
            )}
            
            {/* Edit and Delete actions */}
            {(onEdit || onDelete) && (
              workoutStarted ? (
                // Hide behind menu when workout is started
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                      disabled={disabled}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={onDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Show buttons directly when workout is not started
                <>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onEdit}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                      disabled={disabled}
                    >
                      <Edit className="h-2.5 w-2.5" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDelete}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                      disabled={disabled}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </>
              )
            )}
          </>
        )}
      </div>

      {/* Media Modal */}
      {hasMedia && (
        <ExerciseMediaModal
          open={showMediaModal}
          onOpenChange={setShowMediaModal}
          media={media && media.length > 0 ? media : (imageUrl ? [{ id: 'legacy', exercise_id: '', media_type: 'image' as const, url: imageUrl, sort_order: 0 }] : [])}
          exerciseName={exerciseName}
        />
      )}
    </div>
  );
}