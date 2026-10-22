import { apiFetch } from "@/lib/apiClient";
import { ApiError } from "./contactEnquiryApi";

// Quote Requests — backed by `/api/backend/enquiries/quote-request`
// (authMiddleware-gated). Submissions come from the public quote-cart flow,
// so there's no create/edit here - just list/get/delete, plus a status
// update for admin follow-up tracking (new/contacted/followed_up).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QUOTE_REQUEST_URL = `${API_BASE_URL}/enquiries/quote-request`;

export { ApiError };

export interface QuoteRequestItemRecord {
  id: number;
  quote_request_id: number;
  product_id: number | null;
  product_title: string;
  product_title_ar: string | null;
  product_slug: string | null;
  variant_id: number | null;
  variant_label: string | null;
  variant_label_ar: string | null;
  variant_sku: string | null;
  media_path: string | null;
  quantity: number;
  unit_price_snapshot: string | null;
}

export type QuoteRequestStatus = "new" | "contacted" | "followed_up";

export interface QuoteRequestRecord {
  id: number;
  reference_code: string | null;
  name: string;
  email: string;
  phone: string;
  company_name: string | null;
  message: string | null;
  recaptcha_score: number | null;
  status: QuoteRequestStatus;
  items?: QuoteRequestItemRecord[];
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

export interface QuoteRequestListResponse {
  data: {
    data: QuoteRequestRecord[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  };
}

export interface QuoteRequestFilters {
  status?: QuoteRequestStatus;
}

// Fetcher shape matches usePaginatedList's `Fetcher<T, F>` contract.
export const fetchQuoteRequestList = async (
  page: number,
  limit: number,
  search?: string,
  filters?: QuoteRequestFilters,
): Promise<QuoteRequestListResponse> => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (search) params.append("search", search);
  if (filters?.status) params.append("status", filters.status);

  const response = await apiFetch(`${QUOTE_REQUEST_URL}?${params}`);
  return parseEnvelope<QuoteRequestListResponse["data"]>(response);
};

export const fetchQuoteRequestById = async (
  id: number,
): Promise<{ data: QuoteRequestRecord }> => {
  const response = await apiFetch(`${QUOTE_REQUEST_URL}/${id}`);
  return parseEnvelope<QuoteRequestRecord>(response);
};

export const deleteQuoteRequest = async (id: number): Promise<{ data: { id: number } }> => {
  const response = await apiFetch(`${QUOTE_REQUEST_URL}/${id}`, { method: "DELETE" });
  return parseEnvelope<{ id: number }>(response);
};

export const updateQuoteRequestStatus = async (
  id: number,
  status: QuoteRequestStatus,
): Promise<{ data: QuoteRequestRecord }> => {
  const response = await apiFetch(`${QUOTE_REQUEST_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return parseEnvelope<QuoteRequestRecord>(response);
};
