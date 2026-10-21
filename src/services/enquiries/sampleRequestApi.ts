import { apiFetch } from "@/lib/apiClient";
import { ApiError } from "./contactEnquiryApi";

// Sample Requests — backed by `/api/backend/enquiries/sample-request`
// (authMiddleware-gated). Read-only from this dashboard: submissions come
// from the public "Get a sample" form, so only list/get/delete exist here.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SAMPLE_REQUEST_URL = `${API_BASE_URL}/enquiries/sample-request`;

export { ApiError };

export interface SampleRequestRecord {
  id: number;
  name: string;
  phone: string;
  email: string;
  company_name: string | null;
  category_title: string | null;
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

export interface SampleRequestListResponse {
  data: {
    data: SampleRequestRecord[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  };
}

export const fetchSampleRequestList = async (
  page: number,
  limit: number,
  search?: string,
): Promise<SampleRequestListResponse> => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (search) params.append("search", search);

  const response = await apiFetch(`${SAMPLE_REQUEST_URL}?${params}`);
  return parseEnvelope<SampleRequestListResponse["data"]>(response);
};

export const fetchSampleRequestById = async (
  id: number,
): Promise<{ data: SampleRequestRecord }> => {
  const response = await apiFetch(`${SAMPLE_REQUEST_URL}/${id}`);
  return parseEnvelope<SampleRequestRecord>(response);
};

export const deleteSampleRequest = async (id: number): Promise<{ data: { id: number } }> => {
  const response = await apiFetch(`${SAMPLE_REQUEST_URL}/${id}`, { method: "DELETE" });
  return parseEnvelope<{ id: number }>(response);
};
