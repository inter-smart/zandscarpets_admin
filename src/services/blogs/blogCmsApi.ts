import { apiFetch } from "@/lib/apiClient";

// Blogs > Blog page CMS — backed by `/api/backend/blog-cms`
// (authMiddleware-gated). Singleton resource: same fetch/save-in-place shape as contactCmsApi.ts.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BLOG_CMS_URL = `${API_BASE_URL}/blog-cms`;

export interface BlogCms {
  id?: number;
  title: string;
  title_ar?: string | null;
  related_title?: string | null;
  related_title_ar?: string | null;
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
  error?: { message?: string };
  message?: string;
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

const parseEnvelope = async <T>(response: Response): Promise<ApiEnvelope<T>> => {
  const body = await response.json().catch(() => ({}) as ApiEnvelope<T> & ApiErrorEnvelope);
  if (!response.ok || !body.success) {
    const errorBody = body as ApiErrorEnvelope;
    throw new ApiError(
      errorBody.error?.message ||
        errorBody.message ||
        `Request failed with status ${response.status}`,
    );
  }
  return body;
};

export const fetchBlogCms = async (): Promise<ApiEnvelope<BlogCms | null>> => {
  const response = await apiFetch(BLOG_CMS_URL);
  return parseEnvelope<BlogCms | null>(response);
};

// `id` defaults to 1: the backend ignores it and does a findOne()/find-or-create.
export const saveBlogCms = async (
  data: Omit<BlogCms, "id" | "createdAt" | "updatedAt">,
  id: number = 1,
): Promise<ApiEnvelope<BlogCms>> => {
  const response = await apiFetch(`${BLOG_CMS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseEnvelope<BlogCms>(response);
};
