import { updateCmsStatus, updateCmsSortOrder } from "@/services/common/cmsOrderStatusApi";
import { apiFetch } from "@/lib/apiClient";

// Downloads — backed by `/api/backend/downloads`. File upload via FormData (PDF only, 10MB);
// envelope parsing follows the apiFetch + ApiError convention used across the admin.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DOWNLOADS_URL = `${API_BASE_URL}/downloads`;

export interface DownloadRecord {
  id: number;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  file_path: string | null;
  file_original_filename: string | null;
  file_size_bytes: number | null;
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
  error?: { message?: string; code?: string; statusCode?: number; details?: unknown };
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
    const message =
      errorBody.error?.message || errorBody.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, errorBody.error?.code, errorBody.error?.details);
  }
  return body;
};

export interface DownloadListResponse {
  data: {
    data: DownloadRecord[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      isSearchApplied?: boolean;
    };
  };
}

export const fetchDownloadList = async (
  page: number,
  limit: number,
  search?: string,
): Promise<DownloadListResponse> => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (search) params.append("search", search);
  const response = await apiFetch(`${DOWNLOADS_URL}?${params}`);
  return parseEnvelope<DownloadListResponse["data"]>(response);
};

export const fetchDownloadById = async (id: number): Promise<{ data: DownloadRecord }> => {
  const response = await apiFetch(`${DOWNLOADS_URL}/${id}`);
  return parseEnvelope<DownloadRecord>(response);
};

export const createDownload = async (formData: FormData): Promise<{ data: DownloadRecord }> => {
  const response = await apiFetch(DOWNLOADS_URL, { method: "POST", body: formData });
  return parseEnvelope<DownloadRecord>(response);
};

export const updateDownload = async (id: number, formData: FormData): Promise<{ data: DownloadRecord }> => {
  const response = await apiFetch(`${DOWNLOADS_URL}/${id}`, { method: "PUT", body: formData });
  return parseEnvelope<DownloadRecord>(response);
};

export const deleteDownload = async (id: number): Promise<{ data: { id: number } }> => {
  const response = await apiFetch(`${DOWNLOADS_URL}/${id}`, { method: "DELETE" });
  return parseEnvelope<{ id: number }>(response);
};

export const toggleDownloadStatus = (item: { id?: number | string }, isActive: boolean) =>
  updateCmsStatus("downloads", item.id!, isActive);

export const updateDownloadSortOrder = (item: { id?: number | string }, sortOrder: number) =>
  updateCmsSortOrder("downloads", item.id!, sortOrder);
