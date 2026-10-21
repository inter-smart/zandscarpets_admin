import { apiFetch } from "@/lib/apiClient";

// Generic single-field status / sort-order updates shared by every CMS list page.
// Backed by `PATCH /api/backend/cms/:resource/:id/(status|sort-order)` — only the
// changed field is sent, never the full record.
const CMS_URL = `${import.meta.env.VITE_API_BASE_URL}/cms`;

export type CmsResource =
  | "social-media"
  | "footer-media"
  | "floating-icons"
  | "pages"
  | "ads-banner"
  | "faqs"
  | "industry"
  | "our-features"
  | "materials"
  | "work-plan"
  | "home-banner"
  | "home-brands"
  | "home-testimonials"
  | "home-side-images"
  | "core-values"
  | "history"
  | "about-industries"
  | "messages"
  | "common-milestones"
  | "common-features"
  | "common-how-it-works"
  | "connections"
  | "projects"
  | "services"
  | "process-steps"
  | "product-categories"
  | "product-highlights"
  | "product-labels"
  | "products"
  | "product-media"
  | "product-variants"
  | "attributes"
  | "attribute-values"
  | "detail-fields"
  | "blogs"
  | "blog-tags"
  | "downloads";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiErrorEnvelope {
  error?: { message?: string; code?: string; details?: unknown };
  message?: string;
}

export class ApiError extends Error {
  code?: string;
  details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

const parseEnvelope = async <T>(response: Response): Promise<ApiEnvelope<T>> => {
  const body = await response.json().catch(() => ({}) as ApiEnvelope<T> & ApiErrorEnvelope);
  if (!response.ok || !body.success) {
    const errorBody = body as ApiErrorEnvelope;
    throw new ApiError(
      errorBody.error?.message || errorBody.message || `Request failed with status ${response.status}`,
      errorBody.error?.code,
      errorBody.error?.details,
    );
  }
  return body;
};

const patch = async <T>(path: string, payload: Record<string, unknown>) =>
  parseEnvelope<T>(
    await apiFetch(`${CMS_URL}/${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );

export const updateCmsStatus = (resource: CmsResource, id: number | string, isActive: boolean) =>
  patch<{ id: number; is_active: boolean }>(`${resource}/${id}/status`, { is_active: isActive });

// Clamped to the backend's minimum of 1.
export const updateCmsSortOrder = (resource: CmsResource, id: number | string, sortOrder: number) =>
  patch<{ id: number; sort_order: number }>(`${resource}/${id}/sort-order`, {
    sort_order: Math.max(1, sortOrder),
  });

export const updateCmsNavbar = (resource: CmsResource, id: number | string, showInNavbar: boolean) =>
  patch<{ id: number; show_in_navbar: boolean }>(`${resource}/${id}/navbar`, {
    show_in_navbar: showInNavbar,
  });

export const updateCmsFooter = (resource: CmsResource, id: number | string, showInFooter: boolean) =>
  patch<{ id: number; show_in_footer: boolean }>(`${resource}/${id}/footer`, {
    show_in_footer: showInFooter,
  });

export const updateCmsHome = (resource: CmsResource, id: number | string, showInHome: boolean) =>
  patch<{ id: number; show_in_home: boolean }>(`${resource}/${id}/home`, {
    show_in_home: showInHome,
  });
