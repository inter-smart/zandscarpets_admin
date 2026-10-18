import { apiFetch } from "@/lib/apiClient";

// Products > Categories page CMS — backed by `/api/backend/products/category-cms`
// (authMiddleware-gated). Singleton resource: same fetch/save-in-place shape as contactCmsApi.ts.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CATEGORY_CMS_URL = `${API_BASE_URL}/products/category-cms`;

export interface CategoryCms {
  id?: number;
  title: string;
  title_ar?: string | null;
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

export const fetchCategoryCms = async (): Promise<ApiEnvelope<CategoryCms | null>> => {
  const response = await apiFetch(CATEGORY_CMS_URL);
  return parseEnvelope<CategoryCms | null>(response);
};

// `id` defaults to 1: the backend ignores it and does a findOne()/find-or-create.
export const saveCategoryCms = async (
  data: Omit<CategoryCms, "id" | "createdAt" | "updatedAt">,
  id: number = 1,
): Promise<ApiEnvelope<CategoryCms>> => {
  const response = await apiFetch(`${CATEGORY_CMS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseEnvelope<CategoryCms>(response);
};
