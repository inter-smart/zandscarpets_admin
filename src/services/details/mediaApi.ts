import { apiFetch, parseEnvelope, ApiError, DETAILS_API_URL, listParams, PaginatedListResponse } from "./detailsApiClient";
import { commonValidations } from "@/utils/formUtils";

// Dynamic Details > Media — the central, reusable media table behind
// image/video detail items. Backed by `/api/backend/details/media`.
// Uploads only (no external links): FormData with a `file` field (+
// optional `thumbnail` for videos).
export { ApiError };

export type MediaKind = "image" | "video";

// Mirrors the server's per-kind limits (mediaController.js / mediaLimits.js)
// so the client can reject oversized files immediately instead of waiting
// on a round trip.
export const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
export const MAX_VIDEO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_BULK_UPLOAD_COUNT = 20;

export const maxSizeForKind = (kind: MediaKind) =>
  kind === "image" ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;

export const formatMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(0)}MB`;

export const kindFromMimetype = (mimetype: string): MediaKind | null => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return null;
};

export interface MediaRecord {
  id: number;
  kind: MediaKind;
  location: string;
  mime_type: string | null;
  size_bytes: number | null;
  alt_text: string | null;
  title: string | null;
  description: string | null;
  alt_text_ar?: string | null;
  title_ar?: string | null;
  description_ar?: string | null;
  thumbnail_location: string | null;
  createdAt?: string;
}

// Shared "optional, no HTML/script tags" rule for alt text/title/description
// — reuses the exact same zod schema the rest of the admin's forms use
// (commonValidations.optionalSafeText), so there's one place that defines
// what "safe text" means. Returns an error message to show, or null if ok.
export const validateMediaText = (value: string, fieldLabel: string): string | null => {
  if (!value.trim()) return null;
  const result = commonValidations.optionalSafeText.safeParse(value);
  return result.success ? null : `${fieldLabel} must not contain HTML or script tags`;
};

// A video's own `location` is a video file, not something an <img> can
// render — thumbnail previews (grids, item lists) must use its
// `thumbnail_location` instead, falling back to nothing (never the raw
// video path) when no thumbnail was captured/uploaded.
export const mediaThumbnailPath = (media: MediaRecord | null | undefined): string | null | undefined => {
  if (!media) return null;
  return media.kind === "video" ? media.thumbnail_location : media.location;
};

const MEDIA_URL = `${DETAILS_API_URL}/media`;

export const fetchMediaList = (page: number, limit: number, search?: string, kind?: MediaKind) =>
  apiFetch(`${MEDIA_URL}?${listParams(page, limit, search, { kind })}`).then((r) =>
    parseEnvelope<PaginatedListResponse<MediaRecord>["data"]>(r),
  );

export interface MediaUploadMeta {
  altText?: string;
  title?: string;
  description?: string;
  thumbnail?: File | null;
}

export const uploadMedia = (file: File, meta: MediaUploadMeta = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  if (meta.altText) formData.append("alt_text", meta.altText);
  if (meta.title) formData.append("title", meta.title);
  if (meta.description) formData.append("description", meta.description);
  if (meta.thumbnail) formData.append("thumbnail", meta.thumbnail);
  return apiFetch(MEDIA_URL, { method: "POST", body: formData }).then((r) =>
    parseEnvelope<MediaRecord>(r),
  );
};

export interface MediaDetailsPatch {
  alt_text?: string;
  title?: string;
  description?: string;
  alt_text_ar?: string;
  title_ar?: string;
  description_ar?: string;
}

// Partial update: only the keys present in `patch` change. An empty string
// for any of them genuinely clears that field to null server-side (see
// mediaController.js's normalizeText), it never falls back to the old value.
export const updateMediaDetails = (id: number, patch: MediaDetailsPatch) =>
  apiFetch(`${MEDIA_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).then((r) => parseEnvelope<MediaRecord>(r));

export const deleteMedia = (id: number) =>
  apiFetch(`${MEDIA_URL}/${id}`, { method: "DELETE" }).then((r) =>
    parseEnvelope<{ id: number }>(r),
  );
