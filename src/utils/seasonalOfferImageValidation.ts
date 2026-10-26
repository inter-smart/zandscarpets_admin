// Validation for the seasonal offer popup images. The popup card is ~800x400 (2:1) and the
// badge is cropped to a 132px circle, so both need predictable proportions.
import { toast } from "@/hooks/use-toast";

export const SEASONAL_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

export const SEASONAL_MAIN_MAX_BYTES = 2 * 1024 * 1024; // 2MB
export const SEASONAL_BADGE_MAX_BYTES = 500 * 1024; // 500KB

export const SEASONAL_MAIN_RECOMMENDED =
  "JPG, PNG or WebP, 2:1 ratio, 1600×800 to 3200×1600px, max 2MB";
export const SEASONAL_BADGE_RECOMMENDED =
  "JPG, PNG or WebP, square (1:1), 264×264 to 600×600px, max 500KB";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const readDimensions = (file: File): Promise<{ width: number; height: number } | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });

// Returns an error message, or null when the file is acceptable.
export const validateSeasonalMainImage = async (file: File): Promise<string | null> => {
  if (!ALLOWED_TYPES.includes(file.type)) return "Main image must be a JPG, PNG or WebP file.";

  const dims = await readDimensions(file);
  if (!dims) return "This image could not be read.";

  const { width, height } = dims;
  if (width < 1600 || height < 800) {
    return `Main image must be at least 1600×800px. Current size: ${width}×${height}px.`;
  }
  if (width > 3200 || height > 1600) {
    return `Main image must be at most 3200×1600px. Current size: ${width}×${height}px.`;
  }

  // Ratio only warns: the image is accepted but cropped (object-cover) to fit the 2:1 card.
  const ratio = width / height;
  if (Math.abs(ratio - 2) / 2 > 0.1) {
    toast({
      title: "Image will be cropped",
      description: `Recommended ratio is 2:1 (this image is ${width}×${height}px). Edges will be cropped in the popup.`,
    });
  }
  return null;
};

export const validateSeasonalBadgeImage = async (file: File): Promise<string | null> => {
  if (!ALLOWED_TYPES.includes(file.type)) return "Badge image must be a JPG, PNG or WebP file.";

  const dims = await readDimensions(file);
  if (!dims) return "This image could not be read.";

  const { width, height } = dims;
  if (Math.abs(width / height - 1) > 0.05) {
    return `Badge image must be square (1:1). Current size: ${width}×${height}px.`;
  }
  if (width < 264 || height < 264) {
    return `Badge image must be at least 264×264px. Current size: ${width}×${height}px.`;
  }
  if (width > 600 || height > 600) {
    return `Badge image must be at most 600×600px. Current size: ${width}×${height}px.`;
  }
  return null;
};
