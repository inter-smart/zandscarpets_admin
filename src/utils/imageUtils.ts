// Image and file utilities
// Client-side cap for every image upload in the admin (300KB).
export const MAX_IMAGE_UPLOAD_BYTES = 300 * 1024;
// Client-side cap for every video upload in the admin (10MB).
export const MAX_VIDEO_UPLOAD_BYTES = 10 * 1024 * 1024;

export const formatFileSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${Math.round(mb)}MB` : `${Math.round(bytes / 1024)}KB`;
};

export const generatePlaceholderWithSizes = (
  accept: string,
  maxImageSize: number,
  maxVideoSize: number,
  basePlaceholder: string = "Drop files here or click to browse"
): string => {
  const acceptsImages = accept.includes("image");
  const acceptsVideos = accept.includes("video");
  
  if (acceptsImages && acceptsVideos) {
    return `${basePlaceholder} (images: max ${formatFileSize(maxImageSize)}, videos: max ${formatFileSize(maxVideoSize)})`;
  } else if (acceptsImages) {
    return `${basePlaceholder} (max ${formatFileSize(maxImageSize)})`;
  } else if (acceptsVideos) {
    return `${basePlaceholder} (max ${formatFileSize(maxVideoSize)})`;
  }
  
  return basePlaceholder;
};