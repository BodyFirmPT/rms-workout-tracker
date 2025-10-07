import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CategoryHeaderProps {
  name: string;
  groupCount: number;
  totalExercises: number;
  onCopyToWorkout?: () => void;
  disabled?: boolean;
}

export function CategoryHeader({
  name,
  groupCount,
  totalExercises,
  onCopyToWorkout,
  disabled = false
}: CategoryHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 px-3 bg-primary/5 border-l-4 border-primary rounded-r-md">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
          {name}
        </h4>
        <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
          {groupCount} groups
        </Badge>
      </div>
      {totalExercises > 0 && onCopyToWorkout && (
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
          <DropdownMenuContent align="end" className="w-56 z-50 bg-popover">
            <DropdownMenuItem onClick={onCopyToWorkout}>
              Copy to another workout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
