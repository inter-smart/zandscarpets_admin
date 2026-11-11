import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Loader2, X } from "lucide-react";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import { captureVideoThumbnail } from "@/utils/videoThumbnail";
import { toast } from "@/hooks/use-toast";
import { MAX_IMAGE_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES, formatFileSize } from "@/utils/imageUtils";
import { ProjectMediaItem } from "@/services/masters/projectsApi";

const GALLERY_ACCEPT =
  "image/*,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm";

export type GalleryItem =
  | {
      kind: "existing";
      id: number;
      media_type: "image" | "video";
      media_path: string;
      thumbnail: string | null;
    }
  | {
      kind: "new";
      tempId: string;
      media_type: "image" | "video";
      file: File;
      preview: string;
      thumbnail: File | null;
      thumbnailPreview: string | null;
      generatingThumbnail: boolean;
    };

// Serialized shape the Project form appends to FormData at submit time —
// matches ProjectsController's syncProjectMedia contract: a meta entry per
// item (kept existing rows just carry their id + sort_order; new rows carry
// a tempId used to key their paired file/thumbnail fields) plus the actual
// files under `project_media_file__<tempId>` / `project_media_thumbnail__<tempId>`.
export function appendGalleryToFormData(formData: FormData, items: GalleryItem[]) {
  const meta = items.map((item, index) =>
    item.kind === "existing"
      ? { id: item.id, sort_order: index }
      : { tempId: item.tempId, media_type: item.media_type, sort_order: index },
  );
  formData.append("project_media_meta", JSON.stringify(meta));

  items.forEach((item) => {
    if (item.kind !== "new") return;
    formData.append(`project_media_file__${item.tempId}`, item.file);
    if (item.thumbnail) {
      formData.append(`project_media_thumbnail__${item.tempId}`, item.thumbnail);
    }
  });
}

export function projectMediaToGalleryItems(records: ProjectMediaItem[]): GalleryItem[] {
  return [...records]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((record) => ({
      kind: "existing" as const,
      id: record.id,
      media_type: record.media_type,
      media_path: record.media_path,
      thumbnail: record.thumbnail,
    }));
}

const isVideoFile = (file: File) => file.type.startsWith("video/");

interface ProjectGalleryFieldProps {
  items: GalleryItem[];
  onChange: Dispatch<SetStateAction<GalleryItem[]>>;
}

// Inline gallery editor for the Project form: images/videos with a video
// thumbnail auto-captured client-side (same approach as the central Media
// Library's upload dialog) and a manual "Replace" override, plus simple
// up/down reordering (no drag-and-drop dependency in this project yet).
export default function ProjectGalleryField({ items, onChange }: ProjectGalleryFieldProps) {
  const [dragActive, setDragActive] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files || !files.length) return;

    const limitFor = (file: File) => (isVideoFile(file) ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES);
    const accepted = Array.from(files).filter((file) => file.size <= limitFor(file));
    const rejected = Array.from(files).length - accepted.length;
    if (rejected) {
      toast({
        title: "File too large",
        description: `${rejected} file${rejected === 1 ? "" : "s"} exceed${rejected === 1 ? "s" : ""} the limit (images ${formatFileSize(MAX_IMAGE_UPLOAD_BYTES)}, videos ${formatFileSize(MAX_VIDEO_UPLOAD_BYTES)}) and ${rejected === 1 ? "was" : "were"} skipped.`,
        variant: "destructive",
      });
    }
    if (!accepted.length) return;

    const next: Extract<GalleryItem, { kind: "new" }>[] = accepted.map((file) => {
      const video = isVideoFile(file);
      return {
        kind: "new",
        tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        media_type: video ? "video" : "image",
        file,
        preview: URL.createObjectURL(file),
        thumbnail: null,
        thumbnailPreview: null,
        generatingThumbnail: video,
      };
    });

    onChange([...items, ...next]);

    next
      .filter((item) => item.media_type === "video")
      .forEach(({ tempId, file }) => {
        captureVideoThumbnail(file)
          .then((thumb) => {
            onChange((current) =>
              current.map((c) =>
                c.kind === "new" && c.tempId === tempId
                  ? { ...c, thumbnail: thumb, thumbnailPreview: URL.createObjectURL(thumb), generatingThumbnail: false }
                  : c,
              ),
            );
          })
          .catch(() => {
            onChange((current) =>
              current.map((c) => (c.kind === "new" && c.tempId === tempId ? { ...c, generatingThumbnail: false } : c)),
            );
          });
      });
  };

  const removeItem = (index: number) => {
    const target = items[index];
    if (target.kind === "new") {
      URL.revokeObjectURL(target.preview);
      if (target.thumbnailPreview) URL.revokeObjectURL(target.thumbnailPreview);
    }
    onChange(items.filter((_, i) => i !== index));
  };

  const replaceThumbnail = (index: number, file: File) => {
    onChange(
      items.map((item, i) => {
        if (i !== index || item.kind !== "new") return item;
        if (item.thumbnailPreview) URL.revokeObjectURL(item.thumbnailPreview);
        return { ...item, thumbnail: file, thumbnailPreview: URL.createObjectURL(file) };
      }),
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const previewFor = (item: GalleryItem) => (item.kind === "existing" ? resolveImageUrl(item.media_path) : item.preview);
  const thumbnailFor = (item: GalleryItem) =>
    item.kind === "existing" ? resolveImageUrl(item.thumbnail) : item.thumbnailPreview;

  return (
    <div className="space-y-2">
      <Label>Project Gallery</Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.kind === "existing" ? `existing-${item.id}` : item.tempId} className="flex items-center gap-3 rounded-md border p-2">
            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
              {item.media_type === "video" ? (
                <video src={previewFor(item) || undefined} className="w-full h-full object-cover" muted />
              ) : (
                <img src={previewFor(item) || undefined} alt="Gallery item" className="w-full h-full object-cover" />
              )}
            </div>

            {item.media_type === "video" && (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted border flex items-center justify-center">
                  {item.kind === "new" && item.generatingThumbnail ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : thumbnailFor(item) ? (
                    <img src={thumbnailFor(item) || undefined} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground px-1 text-center">No thumb</span>
                  )}
                </div>
                <label className="text-xs text-primary cursor-pointer hover:underline">
                  Replace
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > MAX_IMAGE_UPLOAD_BYTES) {
                        toast({
                          title: "Image too large",
                          description: `Thumbnail must be ${formatFileSize(MAX_IMAGE_UPLOAD_BYTES)} or smaller.`,
                          variant: "destructive",
                        });
                      } else if (file) replaceThumbnail(index, file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <Badge variant="outline" className="capitalize text-xs">
                {item.media_type}
              </Badge>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(index)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <Input
          type="file"
          accept={GALLERY_ACCEPT}
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Images or videos (mp4, mov, avi, mkv, webm). Video thumbnails are captured automatically — use Replace for a
          different frame.
        </p>
      </div>
    </div>
  );
}
