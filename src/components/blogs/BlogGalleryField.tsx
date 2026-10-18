import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowUp, ArrowDown, X } from "lucide-react";
import { resolveImageUrl } from "@/lib/resolveImageUrl";
import type { BlogImageRecord } from "@/services/blogs/blogApi";

export type BlogGalleryItem =
  | {
      kind: "existing";
      id: number;
      media_path: string;
      media_alt: string;
      media_alt_ar: string;
    }
  | {
      kind: "new";
      tempId: string;
      file: File;
      preview: string;
      media_alt: string;
      media_alt_ar: string;
    };

// Serialized shape appended to the blog form's FormData (see the blog controller's syncGallery):
// a meta entry per image (kept images carry their id, new ones a tempId that keys their file) plus
// the files under `gallery_file__<tempId>`.
export function appendGalleryToFormData(formData: FormData, items: BlogGalleryItem[]) {
  const meta = items.map((item, index) =>
    item.kind === "existing"
      ? { id: item.id, sort_order: index, media_alt: item.media_alt, media_alt_ar: item.media_alt_ar }
      : { tempId: item.tempId, sort_order: index, media_alt: item.media_alt, media_alt_ar: item.media_alt_ar },
  );
  formData.append("gallery_meta", JSON.stringify(meta));

  items.forEach((item) => {
    if (item.kind === "new") formData.append(`gallery_file__${item.tempId}`, item.file);
  });
}

export function blogImagesToGalleryItems(records: BlogImageRecord[] = []): BlogGalleryItem[] {
  return [...records]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((record) => ({
      kind: "existing" as const,
      id: record.id,
      media_path: record.media_path,
      media_alt: record.media_alt ?? "",
      media_alt_ar: record.media_alt_ar ?? "",
    }));
}

interface BlogGalleryFieldProps {
  items: BlogGalleryItem[];
  onChange: Dispatch<SetStateAction<BlogGalleryItem[]>>;
}

// Gallery editor for the blog form: images with alt text (EN / AR) and up / down ordering. The
// gallery shows as a swiper on the blog page, where the "[gallery]" marker sits in the content.
export default function BlogGalleryField({ items, onChange }: BlogGalleryFieldProps) {
  const [dragActive, setDragActive] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files || !files.length) return;

    const next: BlogGalleryItem[] = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        kind: "new" as const,
        tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        media_alt: "",
        media_alt_ar: "",
      }));

    onChange([...items, ...next]);
  };

  const removeItem = (index: number) => {
    const target = items[index];
    if (target.kind === "new") URL.revokeObjectURL(target.preview);
    onChange(items.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const setAlt = (index: number, key: "media_alt" | "media_alt_ar", value: string) =>
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));

  const previewFor = (item: BlogGalleryItem) =>
    item.kind === "existing" ? resolveImageUrl(item.media_path) : item.preview;

  return (
    <div className="space-y-2">
      <Label>Gallery (swiper)</Label>
      <p className="text-xs text-muted-foreground">
        Shown as a swiper in the article. Use the "Gallery" button in the content editor to choose where it
        appears; without it, the swiper shows after the article.
      </p>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.kind === "existing" ? `existing-${item.id}` : item.tempId}
            className="flex items-start gap-3 rounded-md border p-2"
          >
            <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
              <img src={previewFor(item) || undefined} alt="Gallery item" className="w-full h-full object-cover" />
            </div>

            <div className="grid flex-1 min-w-0 grid-cols-1 gap-2 md:grid-cols-2">
              <Input
                value={item.media_alt}
                onChange={(e) => setAlt(index, "media_alt", e.target.value)}
                placeholder="Alt text"
              />
              <Input
                dir="rtl"
                value={item.media_alt_ar}
                onChange={(e) => setAlt(index, "media_alt_ar", e.target.value)}
                placeholder="النص البديل"
              />
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
          accept="image/*"
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">Images only (jpeg, png, webp, svg), up to 5MB each.</p>
      </div>
    </div>
  );
}
