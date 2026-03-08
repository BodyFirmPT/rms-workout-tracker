import { useState, useRef } from "react";
import { ImagePlus, Loader2, X, Film, Link, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateExerciseMediaInput } from "@/types/workout";

interface ExerciseMediaUploadProps {
  media: CreateExerciseMediaInput[];
  onMediaChange: (media: CreateExerciseMediaInput[]) => void;
  disabled?: boolean;
}

const MAX_MEDIA = 5;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for videos
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images

export function ExerciseMediaUpload({ media, onMediaChange, disabled }: ExerciseMediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = media.length < MAX_MEDIA;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_MEDIA - media.length;
    const filesToUpload = files.slice(0, remaining);

    if (files.length > remaining) {
      toast.error(`Only ${remaining} more media items can be added (max ${MAX_MEDIA})`);
    }

    setIsUploading(true);
    try {
      const newMedia: CreateExerciseMediaInput[] = [];

      for (const file of filesToUpload) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isImage && !isVideo) {
          toast.error(`${file.name}: Only images and videos are supported`);
          continue;
        }

        const maxSize = isVideo ? MAX_FILE_SIZE : MAX_IMAGE_SIZE;
        if (file.size > maxSize) {
          toast.error(`${file.name}: File must be less than ${isVideo ? '50MB' : '5MB'}`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('exercise-images')
          .upload(fileName, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('exercise-images')
          .getPublicUrl(fileName);

        newMedia.push({
          media_type: isVideo ? 'video' : 'image',
          url: publicUrl,
          sort_order: media.length + newMedia.length,
        });
      }

      if (newMedia.length > 0) {
        onMediaChange([...media, ...newMedia]);
        toast.success(`${newMedia.length} file${newMedia.length > 1 ? 's' : ''} uploaded`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddUrl = () => {
    const url = externalUrl.trim();
    if (!url) return;

    // Detect if it's a video URL
    const isVideo = /\.(mp4|mov|webm|avi)$/i.test(url) ||
      /youtube\.com|youtu\.be|vimeo\.com/i.test(url) ||
      /youtube\.com\/shorts\//i.test(url);

    onMediaChange([...media, {
      media_type: isVideo ? 'video' : 'image',
      url,
      sort_order: media.length,
    }]);

    setExternalUrl("");
    setShowUrlInput(false);
    toast.success("Media added");
  };

  const handleRemove = (index: number) => {
    const updated = media.filter((_, i) => i !== index).map((m, i) => ({ ...m, sort_order: i }));
    onMediaChange(updated);
  };

  const isVideoUrl = (url: string) => {
    return /\.(mp4|mov|webm|avi)$/i.test(url) ||
      /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading || !canAddMore}
        multiple
      />

      {/* Media grid */}
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {media.map((item, index) => (
            <div key={index} className="relative group">
              {item.media_type === 'video' ? (
                <div className="h-20 w-20 rounded-md border bg-muted flex items-center justify-center">
                  <Film className="h-6 w-6 text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={`Media ${index + 1}`}
                  className="h-20 w-20 object-cover rounded-md border"
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add controls */}
      {canAddMore && (
        <div className="flex flex-wrap gap-2">
          {showUrlInput ? (
            <div className="flex gap-2 w-full">
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="Paste image or video URL..."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
              />
              <Button type="button" size="sm" onClick={handleAddUrl} disabled={!externalUrl.trim()}>
                Add
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setShowUrlInput(false); setExternalUrl(""); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUrlInput(true)}
                disabled={disabled || isUploading}
                className="gap-2"
              >
                <Link className="h-4 w-4" />
                URL
              </Button>
            </>
          )}
          <span className="text-xs text-muted-foreground self-center">
            {media.length}/{MAX_MEDIA}
          </span>
        </div>
      )}
    </div>
  );
}
