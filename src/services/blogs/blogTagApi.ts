import { updateCmsStatus, updateCmsSortOrder } from "@/services/common/cmsOrderStatusApi";
import { apiFetch } from "@/lib/apiClient";

// Blogs > Tags — backed by `/api/backend/blog-tags`.
// Uses the apiFetch + ApiError + envelope-parsing convention from pagesApi.ts.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BLOG_TAGS_URL = `${API_BASE_URL}/blog-tags`;

export interface BlogTagRecord {
  id: number;
  title: string;
  title_ar: string;
  sort_order: number;
  is_active: boolean;
  deleted_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  statusCode?: number;
  timestamp?: string;
  data: T;
}

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

const parseEnvelope = async <T>(
  response: Response,
): Promise<ApiEnvelope<T>> => {
  const body = await response
    .json()
    .catch(() => ({}) as ApiEnvelope<T> & ApiErrorEnvelope);
  if (!response.ok || !body.success) {
    const errorBody = body as ApiErrorEnvelope;
    const message =
      errorBody.error?.message ||
      errorBody.message ||
      `Request failed with status ${response.status}`;
    throw new ApiError(
      message,
      errorBody.error?.code,
      errorBody.error?.details,
    );
  }
  return body;
};

export interface BlogTagListResponse {
  data: {
    data: BlogTagRecord[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      isSearchApplied?: boolean;
    };
  };
}

export interface BlogTagPayload {
  title: string;
  title_ar: string;
  sort_order: number;
  is_active: boolean;
}

// Fetcher shape matches usePaginatedList's `Fetcher<T>` contract.
export const fetchBlogTagList = async (
  page: number,
  limit: number,
  search?: string,
): Promise<BlogTagListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  const response = await apiFetch(`${BLOG_TAGS_URL}?${params}`);
  return parseEnvelope<BlogTagListResponse["data"]>(response);
};

export const fetchBlogTagById = async (
  id: number,
): Promise<{ data: BlogTagRecord }> => {
  const response = await apiFetch(`${BLOG_TAGS_URL}/${id}`);
  return parseEnvelope<BlogTagRecord>(response);
};

// Source for the blog form's tag multi-select (active tags only).
export const fetchActiveBlogTags = async (): Promise<{
  data: Pick<BlogTagRecord, "id" | "title" | "title_ar">[];
}> => {
  const response = await apiFetch(`${BLOG_TAGS_URL}/active`);
  return parseEnvelope<Pick<BlogTagRecord, "id" | "title" | "title_ar">[]>(
    response,
  );
};

export const createBlogTag = async (
  payload: BlogTagPayload,
): Promise<{ data: BlogTagRecord }> => {
  const response = await apiFetch(BLOG_TAGS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseEnvelope<BlogTagRecord>(response);
};

export const updateBlogTag = async (
  id: number,
  payload: BlogTagPayload,
): Promise<{ data: BlogTagRecord }> => {
  const response = await apiFetch(`${BLOG_TAGS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseEnvelope<BlogTagRecord>(response);
};

export const deleteBlogTag = async (
  id: number,
): Promise<{ data: { id: number } }> => {
  const response = await apiFetch(`${BLOG_TAGS_URL}/${id}`, {
    method: "DELETE",
  });
  return parseEnvelope<{ id: number }>(response);
};

// Quick status toggle / sort-order change via the shared single-field CMS endpoints.
export const toggleBlogTagStatus = (item: { id?: number | string }, isActive: boolean) =>
  updateCmsStatus("blog-tags", item.id!, isActive);

export const updateBlogTagSortOrder = (item: { id?: number | string }, sortOrder: number) =>
  updateCmsSortOrder("blog-tags", item.id!, sortOrder);
