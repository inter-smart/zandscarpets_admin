import { apiFetch } from "@/lib/apiClient";
import { ApiError } from "./contactEnquiryApi";

// Download Requests — backed by `/api/backend/enquiries/download-request`
// (authMiddleware-gated). Read-only from this dashboard: submissions come
// from the public Downloads page's lead form, so only list/get/delete exist here.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DOWNLOAD_REQUEST_URL = `${API_BASE_URL}/enquiries/download-request`;

export { ApiError };

export interface DownloadRequestRecord {
  id: number;
  name: string;
  phone: string;
  email: string;
  company_name: string | null;
  download_title: string | null;
  // set instead of download_title when the request came from a product's own datasheet button
  product_title: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: { message?: string; code?: string; details?: unknown };
}

const parseEnvelope = async <T>(response: Response): Promise<ApiEnvelope<T>> => {
  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!response.ok || !body.success) {
    throw new ApiError(
      body.error?.message || body.message || `Request failed with status ${response.status}`,
      body.error?.code,
      body.error?.details,
    );
  }
  return body;
};

export interface DownloadRequestListResponse {
  data: {
    data: DownloadRequestRecord[];
    pagination: { totalCount: number; totalPages: number; currentPage: number; limit: number };
  };
}

export const fetchDownloadRequestList = async (
  page: number,
  limit: number,
  search?: string,
): Promise<DownloadRequestListResponse> => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (search) params.append("search", search);

  const response = await apiFetch(`${DOWNLOAD_REQUEST_URL}?${params}`);
  return parseEnvelope<DownloadRequestListResponse["data"]>(response);
};

export const fetchDownloadRequestById = async (id: number): Promise<{ data: DownloadRequestRecord }> => {
  const response = await apiFetch(`${DOWNLOAD_REQUEST_URL}/${id}`);
  return parseEnvelope<DownloadRequestRecord>(response);
};

export const deleteDownloadRequest = async (id: number): Promise<{ data: { id: number } }> => {
  const response = await apiFetch(`${DOWNLOAD_REQUEST_URL}/${id}`, { method: "DELETE" });
  return parseEnvelope<{ id: number }>(response);
};
