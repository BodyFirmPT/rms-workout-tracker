import { useState } from "react";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExerciseMedia } from "@/types/workout";

interface ExerciseMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: ExerciseMedia[];
  exerciseName: string;
  initialIndex?: number;
}

export function ExerciseMediaModal({ open, onOpenChange, media, exerciseName, initialIndex = 0 }: ExerciseMediaModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const current = media[currentIndex];
  if (!current) return null;

  const isVideo = current.media_type === 'video';
  const hasMultiple = media.length > 1;

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const getVimeoEmbedUrl = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  };

  const renderMedia = () => {
    if (!isVideo) {
      return (
        <img
          src={current.url}
          alt={exerciseName}
          className="w-full h-auto rounded-md max-h-[80vh] object-contain"
        />
      );
    }

    const youtubeUrl = getYouTubeEmbedUrl(current.url);
    const vimeoUrl = getVimeoEmbedUrl(current.url);

    if (youtubeUrl || vimeoUrl) {
      return (
        <iframe
          src={youtubeUrl || vimeoUrl || ''}
          className="w-full aspect-video rounded-md"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      );
    }

    return (
      <video
        src={current.url}
        controls
        className="w-full max-h-[80vh] rounded-md"
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-2">
        <div className="relative">
          {renderMedia()}

          {hasMultiple && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full opacity-80 hover:opacity-100"
                onClick={() => setCurrentIndex((currentIndex - 1 + media.length) % media.length)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full opacity-80 hover:opacity-100"
                onClick={() => setCurrentIndex((currentIndex + 1) % media.length)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Dots */}
              <div className="flex justify-center gap-1.5 mt-2">
                {media.map((_, i) => (
                  <button
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      i === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                    onClick={() => setCurrentIndex(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
