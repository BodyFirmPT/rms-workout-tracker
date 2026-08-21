import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckCircle2 } from "lucide-react";
import { WorkoutExercise } from "@/types/workout";
import { cn } from "@/lib/utils";

interface ExerciseOrderListProps {
  exercises: WorkoutExercise[];
  getMuscleGroupName: (muscleGroupId: string) => string;
  onReorder: (orderedIds: string[]) => void;
  disabled?: boolean;
}

function SortableRow({
  exercise,
  position,
  muscleGroupName,
  disabled,
}: {
  exercise: WorkoutExercise;
  position: number;
  muscleGroupName: string;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-md border bg-card px-3 py-2.5",
        isDragging && "shadow-lg opacity-90 z-10 relative"
      )}
    >
      <button
        type="button"
        className={cn(
          "text-muted-foreground touch-none",
          disabled ? "opacity-40 cursor-not-allowed" : "cursor-grab active:cursor-grabbing hover:text-foreground"
        )}
        aria-label={`Reorder ${exercise.exercise_name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <span className="w-6 shrink-0 text-sm font-mono text-muted-foreground">{position}</span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{exercise.exercise_name}</span>
          {exercise.is_completed && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {muscleGroupName} · {exercise.set_count} {exercise.set_count === 1 ? 'set' : 'sets'} ·{' '}
          {exercise.reps_count} {exercise.reps_unit}
        </div>
      </div>
    </div>
  );
}

export function ExerciseOrderList({
  exercises,
  getMuscleGroupName,
  onReorder,
  disabled,
}: ExerciseOrderListProps) {
  const [items, setItems] = useState(exercises);

  useEffect(() => {
    setItems(exercises);
  }, [exercises]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    onReorder(next.map(i => i.id));
  };

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Add exercises to set their order.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((exercise, index) => (
            <SortableRow
              key={exercise.id}
              exercise={exercise}
              position={index + 1}
              muscleGroupName={getMuscleGroupName(exercise.muscle_group_id)}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
