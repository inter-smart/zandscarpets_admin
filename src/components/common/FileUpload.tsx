import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X, Eye, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { generatePlaceholderWithSizes, formatFileSize, MAX_IMAGE_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES } from "@/utils/imageUtils";

interface FileUploadProps {
  label?: string;
  value?: File | string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  maxImageSize?: number; // Specific limit for images
  maxVideoSize?: number; // Specific limit for videos
  placeholder?: string;
  preview?: boolean;
  altText?: string;
  onAltTextChange?: (altText: string) => void;
  className?: string;
  recommendedDimensions?: string; // e.g., "1440×900px"
  dimensionNote?: string; // Additional context about dimensions
  // Extra async check run after the built-in size checks; return an error message or null.
  validateImage?: (file: File) => Promise<string | null>;
}

export function FileUpload({
  label,
  value,
  onChange,
  accept = "image/*",
  maxSize = 5242880, // 5MB
  maxImageSize = MAX_IMAGE_UPLOAD_BYTES, // Default 300KB for images
  maxVideoSize = MAX_VIDEO_UPLOAD_BYTES, // Default 10MB for videos
  placeholder = "Drop files here or click to browse",
  preview = true,
  altText = "",
  onAltTextChange,
  className,
  recommendedDimensions,
  dimensionNote,
  validateImage,
}: FileUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  // Generate placeholder with size information only
  const enhancedPlaceholder = generatePlaceholderWithSizes(
    accept,
    maxImageSize,
    maxVideoSize,
    placeholder
  );

  // Custom file validation
  const validateFile = useCallback(
    (file: File) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      // Always use specific size limits (now they have defaults)
      if (isImage && file.size > maxImageSize) {
        return {
          code: "file-too-large",
          message: `Image size must be under ${formatFileSize(maxImageSize)}. Current size: ${formatFileSize(file.size)}`,
        };
      }

      if (isVideo && file.size > maxVideoSize) {
        return {
          code: "file-too-large",
          message: `Video size must be under ${(
            maxVideoSize /
            (1024 * 1024)
          ).toFixed(0)}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(
            2
          )}MB`,
        };
      }

      // For other file types, use general maxSize
      if (!isImage && !isVideo && file.size > maxSize) {
        return {
          code: "file-too-large",
          message: `File size must be under ${(maxSize / (1024 * 1024)).toFixed(
            0
          )}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        };
      }

      return null;
    },
    [maxSize, maxImageSize, maxVideoSize]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setCustomError(null); // Clear previous errors

      const file = acceptedFiles[0];
      if (file) {
        // Custom validation for specific image/video sizes
        const customValidation = validateFile(file);
        if (customValidation) {
          setCustomError(customValidation.message);
          return;
        }

        if (validateImage) {
          const message = await validateImage(file);
          if (message) {
            setCustomError(message);
            return;
          }
        }

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        onChange(file);
        if (preview && (isImage || isVideo)) {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }
      }
    },
    [onChange, preview, validateFile, validateImage]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: accept
        .split(",")
        .reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {}),
      maxSize: undefined, // Always use custom validation
      multiple: false,
    });

  const handleRemove = () => {
    onChange(null);
    setCustomError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };


  const getDisplayUrl = () => {
    if (previewUrl) return previewUrl; // File blob URL for new uploads

    if (typeof value === "string") {
      // Empty string means no file has been set — don't treat it as a path
      if (!value.trim()) {
        return null;
      }

      // Check if it's already a complete URL (starts with http:// or https://)
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return value; // Already complete URL, use as-is
      }

      // It's a relative path, prepend VITE_IMAGE_URL
      const baseUrl = import.meta.env.VITE_IMAGE_URL;
      if (baseUrl) {
        // Remove leading slash from value to avoid double slashes
        const cleanPath = value.replace(/^\//, "");
        return `${baseUrl}/${cleanPath}`;
      }

      // Fallback: return original value if VITE_IMAGE_URL is not set
      return value;
    }

    return null;
  };

  const getMediaType = (fileOrUrl: File | string | null) => {
    if (fileOrUrl instanceof File) {
      return fileOrUrl.type.startsWith("image/") ? "image" :
             fileOrUrl.type.startsWith("video/") ? "video" :
             fileOrUrl.type === "application/pdf" ? "document" : "unknown";
    }

    if (typeof fileOrUrl === "string") {
      // Check file extension for URLs/paths
      const extension = fileOrUrl.toLowerCase().split('.').pop();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
      const videoExtensions = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv', 'flv'];

      if (extension && imageExtensions.includes(extension)) return "image";
      if (extension && videoExtensions.includes(extension)) return "video";
      if (extension === "pdf") return "document";
    }

    return "unknown";
  };

  const displayUrl = getDisplayUrl();
  const hasFile = value || displayUrl;
  const mediaType = getMediaType(value);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label></Label>}

      <Card>
        <CardContent className="p-4">
          {!hasFile ? (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                {isDragActive ? "Drop the file here..." : enhancedPlaceholder}
              </p>
              <Button type="button" variant="outline" size="sm">
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {preview && displayUrl && mediaType === "image" && (
                <div className="relative inline-block">
                  <img
                    src={displayUrl}
                    alt={altText || "Preview"}
                    className="max-w-full h-32 object-cover rounded border"
                  />
                </div>
              )}
              {preview && displayUrl && mediaType === "document" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-8 w-8 shrink-0" />
                  <span>PDF document</span>
                </div>
              )}
              {preview && displayUrl && mediaType === "video" && (
                <div className="relative inline-block">
                  <video
                    src={displayUrl}
                    className="max-w-full h-32 rounded border"
                    controls
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-foreground truncate">
                    {value instanceof File ? value.name : "Current file"}
                  </span>
                  <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
                    {displayUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(displayUrl, "_blank")}
                        className="flex-1 sm:flex-none min-w-0"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="hidden xs:inline">View</span>
                        <span className="xs:hidden">👁</span>
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  className="w-full sm:w-auto"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          )}

          {(fileRejections.length > 0 || customError) && (
            <div className="mt-2 text-sm text-destructive">
              {customError || fileRejections[0]?.errors[0]?.message}
            </div>
          )}
        </CardContent>
      </Card>

      {recommendedDimensions && (
        <div className="text-sm text-muted-foreground">
          <strong>Recommended dimensions:</strong> {recommendedDimensions}
          {dimensionNote && (
            <div className="mt-1 text-xs">
              {dimensionNote}
            </div>
          )}
        </div>
      )}

      {onAltTextChange && hasFile && mediaType === "image" && (
        <div>
          <Label htmlFor="altText" className="text-sm">
            Alt Text
          </Label>
          <Input
            id="altText"
            value={altText}
            onChange={(e) => onAltTextChange(e.target.value)}
            placeholder="Describe this image for accessibility"
            className="mt-1"
          />
        </div>
      )}

    </div>
  );
}
