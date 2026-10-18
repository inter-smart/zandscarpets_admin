import { updateCmsStatus } from "@/services/common/cmsOrderStatusApi";
import { apiFetch } from "@/lib/apiClient";

// Blogs — backed by `/api/backend/blogs` (authMiddleware-gated). Create / update are multipart:
// hero image (`media_path`), gallery images (`gallery_file__<tempId>`) and JSON fields
// (`category_ids`, `tag_ids`, `gallery_meta`). Same ApiError + envelope convention as the other
// services.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BLOGS_URL = `${API_BASE_URL}/blogs`;

export interface BlogImageRecord {
  id: number;
  media_path: string;
  media_alt: string | null;
  media_alt_ar: string | null;
  sort_order: number;
}

export interface BlogRecord {
  id: number;
  slug: string;
  title: string;
  title_ar: string | null;
  excerpt: string;
  excerpt_ar: string | null;
  // not part of the list response
  content?: string;
  content_ar?: string | null;
  author_name: string | null;
  author_name_ar: string | null;
  media_path: string | null;
  media_alt: string | null;
  media_alt_ar: string | null;
  published_at: string;
  is_active: boolean;
  tags?: { id: number; title: string; title_ar: string }[];
  categories?: { id: number; title: string; title_ar: string }[];
  images?: BlogImageRecord[];
  // hand-picked related posts, in display order
  related_links?: { related_blog_id: number; sort_order: number }[];
  createdAt?: string;
  updatedAt?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiErrorEnvelope {
  success: false;
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
    const detail = Array.isArray(errorBody.error?.details)
      ? (errorBody.error?.details as { msg?: string; message?: string }[])
          .map((item) => item.msg || item.message)
          .filter(Boolean)
          .join(", ")
      : "";
    const message =
      detail ||
      errorBody.error?.message ||
      errorBody.message ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, errorBody.error?.code, errorBody.error?.details);
  }
  return body;
};

export interface BlogListResponse {
  data: {
    data: BlogRecord[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      isSearchApplied?: boolean;
    };
  };
}

export const fetchBlogList = async (
  page: number,
  limit: number,
  search?: string,
): Promise<BlogListResponse> => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (search) params.append("search", search);
  const response = await apiFetch(`${BLOGS_URL}?${params}`);
  return parseEnvelope<BlogListResponse["data"]>(response);
};

export const fetchBlogById = async (id: number): Promise<{ data: BlogRecord }> => {
  const response = await apiFetch(`${BLOGS_URL}/${id}`);
  return parseEnvelope<BlogRecord>(response);
};

export const createBlog = async (formData: FormData): Promise<{ data: BlogRecord }> => {
  const response = await apiFetch(BLOGS_URL, { method: "POST", body: formData });
  return parseEnvelope<BlogRecord>(response);
};

export const updateBlog = async (id: number, formData: FormData): Promise<{ data: BlogRecord }> => {
  const response = await apiFetch(`${BLOGS_URL}/${id}`, { method: "PUT", body: formData });
  return parseEnvelope<BlogRecord>(response);
};

export const deleteBlog = async (id: number): Promise<{ data: { id: number } }> => {
  const response = await apiFetch(`${BLOGS_URL}/${id}`, { method: "DELETE" });
  return parseEnvelope<{ id: number }>(response);
};

export const toggleBlogStatus = (item: { id?: number | string }, isActive: boolean) =>
  updateCmsStatus("blogs", item.id!, isActive);

// Stores an image dropped into the article editor and returns the URL to insert.
export const uploadBlogContentImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiFetch(`${BLOGS_URL}/upload-image`, { method: "POST", body: formData });
  const body = await parseEnvelope<{ path: string; url: string }>(response);
  return body.data.url;
};
