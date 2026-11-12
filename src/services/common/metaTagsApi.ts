import { apiFetch } from "@/lib/apiClient";

export interface MetaTag {
  id: number;
  type: "page" | "product" | "product-variant" | "blog" | "project";
  page_name?: string | null;
  product_id?: number | null;
  variant_id?: number | null;
  blog_id?: string | null;
  project_id?: number | null;
  product?: { id: number; title: string } | null;
  variant?: { id: number; label: string; product?: { id: number; title: string } | null } | null;
  project?: { id: number; title: string } | null;
  meta_title: string;
  meta_title_ar?: string | null;
  meta_description: string;
  meta_description_ar?: string | null;
  meta_keywords: string;
  meta_keywords_ar?: string | null;
  other_meta?: string | null;
  other_meta_ar?: string | null;
  deleted_at?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MetaTagsListResponse {
  success: boolean;
  message: string;
  statusCode: number;
  timestamp: string;
  data: {
    data: MetaTag[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      isSearchApplied: boolean;
    };
  };
}

export interface MetaTagItemResponse {
  success: boolean;
  message: string;
  statusCode: number;
  timestamp: string;
  data: MetaTag;
}

export interface MetaTagFilters {
  type?: string;
  page_name?: string;
  product_id?: number;
  variant_id?: number;
  blog_id?: string;
  project_id?: number;
}

export interface MetaTagPayload {
  type: "page" | "product" | "product-variant" | "blog" | "project";
  page_name?: string | null;
  product_id?: number | null;
  variant_id?: number | null;
  blog_id?: string | null;
  project_id?: number | null;
  meta_title: string;
  meta_title_ar?: string;
  meta_description: string;
  meta_description_ar?: string;
  meta_keywords: string;
  meta_keywords_ar?: string;
  other_meta?: string;
  other_meta_ar?: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

// apiFetch + ApiError + envelope-parsing convention (see productsApiClient.ts):
// response bodies from the admin API wrap errors in `{ error: { message } }`,
// so we surface the backend's message (e.g. the duplicate-target conflict)
// instead of a generic failure.
interface ApiErrorEnvelope {
  success: false;
  error?: {
    message?: string;
    code?: string;
    statusCode?: number;
    details?: unknown;
  };
  message?: string;
}

interface ApiFieldError {
  path?: string;
  msg?: string;
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

  get fieldErrors(): ApiFieldError[] {
    return Array.isArray(this.details) ? (this.details as ApiFieldError[]) : [];
  }
}

const parseEnvelope = async <T>(response: Response): Promise<T> => {
  const body = await response
    .json()
    .catch(() => ({}) as T & ApiErrorEnvelope);
  if (!response.ok || !(body as { success?: boolean }).success) {
    const errorBody = body as ApiErrorEnvelope;
    const details = errorBody.error?.details;
    const firstDetail = Array.isArray(details)
      ? (details[0] as ApiFieldError | undefined)?.msg
      : undefined;
    const message =
      firstDetail ||
      errorBody.error?.message ||
      errorBody.message ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, errorBody.error?.code, details);
  }
  return body;
};

// Fetch all Meta Tags with pagination, search and optional target filters
export const fetchMetaTagsList = async (
  page: number = 1,
  limit: number = 15,
  search?: string,
  filters?: MetaTagFilters
): Promise<MetaTagsListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  if (filters?.type) {
    params.append("type", filters.type);
  }
  if (filters?.page_name) {
    params.append("page_name", filters.page_name);
  }
  if (filters?.product_id) {
    params.append("product_id", String(filters.product_id));
  }
  if (filters?.variant_id) {
    params.append("variant_id", String(filters.variant_id));
  }
  if (filters?.blog_id) {
    params.append("blog_id", filters.blog_id);
  }
  if (filters?.project_id) {
    params.append("project_id", String(filters.project_id));
  }

  const response = await apiFetch(
    `${API_BASE_URL}/site-settings/meta-data?${params}`
  );

  return parseEnvelope<MetaTagsListResponse>(response);
};

export const createMetaTag = async (
  data: MetaTagPayload
): Promise<MetaTagItemResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/site-settings/meta-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseEnvelope<MetaTagItemResponse>(response);
};

export const updateMetaTag = async (
  id: number,
  data: MetaTagPayload
): Promise<MetaTagItemResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/site-settings/meta-data/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseEnvelope<MetaTagItemResponse>(response);
};

export const fetchMetaTagById = async (
  id: number
): Promise<MetaTagItemResponse> => {
  const response = await apiFetch(`${API_BASE_URL}/site-settings/meta-data/${id}`);

  return parseEnvelope<MetaTagItemResponse>(response);
};