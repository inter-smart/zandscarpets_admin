import { apiFetch } from "@/lib/apiClient";

// Rich text editor images — backed by `/api/backend/editor-images/upload` (any logged-in user).
const EDITOR_IMAGES_URL = `${import.meta.env.VITE_API_BASE_URL}/editor-images`;

// Stores an image inserted in a rich text editor and returns the absolute URL to show in the editor.
// The editor converts it back to the relative `/uploads/...` path when it saves the HTML.
export const uploadEditorImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiFetch(`${EDITOR_IMAGES_URL}/upload`, { method: "POST", body: formData });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    const details = Array.isArray(body.error?.details)
      ? body.error.details.map((item: { msg?: string; message?: string }) => item.msg || item.message).filter(Boolean).join(", ")
      : "";
    throw new Error(details || body.error?.message || body.message || "Failed to upload the image");
  }
  return body.data.url as string;
};
