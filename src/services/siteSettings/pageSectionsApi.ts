import { apiFetch } from "@/lib/apiClient";

// Site Settings > Section Visibility — backed by `/api/backend/site-settings/page-sections`
// (authMiddleware-gated). Mirrors contactCmsApi.ts's envelope-parsing convention.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PAGE_SECTIONS_URL = `${API_BASE_URL}/site-settings/page-sections`;

export interface PageSection {
  section_key: string;
  label: string;
  is_enabled: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiErrorEnvelope {
  success: false;
  error?: { message?: string };
  message?: string;
}

const parseEnvelope = async <T>(
  response: Response,
): Promise<ApiEnvelope<T>> => {
  const body = await response
    .json()
    .catch(() => ({}) as ApiEnvelope<T> & ApiErrorEnvelope);
  if (!response.ok || !body.success) {
    const errorBody = body as ApiErrorEnvelope;
    throw new Error(
      errorBody.error?.message ||
        errorBody.message ||
        `Request failed with status ${response.status}`,
    );
  }
  return body;
};

export const fetchPageSections = async (
  pageSlug: string,
): Promise<ApiEnvelope<PageSection[]>> => {
  const response = await apiFetch(
    `${PAGE_SECTIONS_URL}?page_slug=${encodeURIComponent(pageSlug)}`,
  );
  return parseEnvelope<PageSection[]>(response);
};

export const updatePageSection = async (
  pageSlug: string,
  sectionKey: string,
  isEnabled: boolean,
): Promise<ApiEnvelope<unknown>> => {
  const response = await apiFetch(PAGE_SECTIONS_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page_slug: pageSlug,
      section_key: sectionKey,
      is_enabled: isEnabled,
    }),
  });
  return parseEnvelope<unknown>(response);
};
