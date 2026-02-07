import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ExerciseImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  exerciseName: string;
}

export function ExerciseImageModal({ open, onOpenChange, imageUrl, exerciseName }: ExerciseImageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-2">
        <img
          src={imageUrl}
          alt={exerciseName}
          className="w-full h-auto rounded-md max-h-[80vh] object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
