import { useState, useEffect } from "react";
import { Plus, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ViewRestrictionsDialog } from "@/components/workout/view-restrictions-dialog";

interface Restriction {
  id: string;
  name: string;
}

interface MuscleGroupHeaderProps {
  name: string;
  exerciseCount: number;
  isCustom?: boolean;
  isFirst: boolean;
  isLast: boolean;
  hasContent: boolean;
  onAddExercise?: () => void;
  disabled?: boolean;
  muscleGroupId?: string;
  clientId?: string;
}

export function MuscleGroupHeader({
  name,
  exerciseCount,
  isCustom = false,
  isFirst,
  isLast,
  hasContent,
  onAddExercise,
  disabled = false,
  muscleGroupId,
  clientId,
}: MuscleGroupHeaderProps) {
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [showRestrictionsDialog, setShowRestrictionsDialog] = useState(false);

  useEffect(() => {
    if (muscleGroupId && clientId && !disabled) {
      loadRestrictions();
    } else {
      setRestrictions([]);
    }
  }, [muscleGroupId, clientId, disabled]);

  const loadRestrictions = async () => {
    if (!muscleGroupId || !clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('restricted_exercise')
        .select('id, name')
        .eq('client_id', clientId)
        .eq('muscle_group_id', muscleGroupId);

      if (error) throw error;
      setRestrictions(data || []);
    } catch (error) {
      console.error('Error loading restrictions:', error);
      setRestrictions([]);
    }
  };

  return (
    <>
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
        <div className="flex items-center gap-2">
          {restrictions.length > 0 && !disabled && (
            <Badge 
              variant="outline" 
              className="text-xs px-1.5 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              onClick={() => setShowRestrictionsDialog(true)}
            >
              <Ban className="h-3 w-3 mr-1" />
              {restrictions.length} {restrictions.length === 1 ? 'restriction' : 'restrictions'}
            </Badge>
          )}
          {onAddExercise && (
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
          )}
        </div>
      </div>

      <ViewRestrictionsDialog
        open={showRestrictionsDialog}
        onOpenChange={setShowRestrictionsDialog}
        restrictions={restrictions}
        muscleGroupName={name}
      />
    </>
  );
}