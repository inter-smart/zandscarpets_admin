import { updateCmsStatus, updateCmsSortOrder } from "@/services/common/cmsOrderStatusApi";
import { apiFetch } from "@/lib/apiClient";

// Masters > Ads Banner — backed by `/api/backend/masters/ads-banner`. File
// upload via FormData, following the same media-path round-trip rules as
// socialMediaApi.ts; envelope parsing follows the apiFetch + ApiError
// convention from pagesApi.ts.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const ADS_BANNER_URL = `${API_BASE_URL}/masters/ads-banner`;

export interface AdsBannerRecord {
  id: number;
  media_path: string | null;
  media_alt: string | null;
  media_alt_ar?: string | null;
  link?: string | null;
  link_new_tab?: boolean | null;
  button_text?: string | null;
  button_text_ar?: string | null;
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

export interface AdsBannerListResponse {
  data: {
    data: AdsBannerRecord[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      isSearchApplied?: boolean;
    };
  };
}

// Fetcher shape matches usePaginatedList's `Fetcher<T>` contract.
export const fetchAdsBannerList = async (
  page: number,
  limit: number,
  search?: string,
): Promise<AdsBannerListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  const response = await apiFetch(`${ADS_BANNER_URL}?${params}`);
  return parseEnvelope<AdsBannerListResponse["data"]>(response);
};

export const fetchAdsBannerById = async (
  id: number,
): Promise<{ data: AdsBannerRecord }> => {
  const response = await apiFetch(`${ADS_BANNER_URL}/${id}`);
  return parseEnvelope<AdsBannerRecord>(response);
};

export const createAdsBanner = async (
  formData: FormData,
): Promise<{ data: AdsBannerRecord }> => {
  const response = await apiFetch(ADS_BANNER_URL, {
    method: "POST",
    body: formData,
  });
  return parseEnvelope<AdsBannerRecord>(response);
};

export const updateAdsBanner = async (
  id: number,
  formData: FormData,
): Promise<{ data: AdsBannerRecord }> => {
  const response = await apiFetch(`${ADS_BANNER_URL}/${id}`, {
    method: "PUT",
    body: formData,
  });
  return parseEnvelope<AdsBannerRecord>(response);
};

export const deleteAdsBanner = async (
  id: number,
): Promise<{ data: { id: number } }> => {
  const response = await apiFetch(`${ADS_BANNER_URL}/${id}`, {
    method: "DELETE",
  });
  return parseEnvelope<{ id: number }>(response);
};

export const toggleAdsBannerStatus = (item: { id?: number | string }, isActive: boolean) =>
  updateCmsStatus("ads-banner", item.id!, isActive);

export const updateAdsBannerSortOrder = (item: { id?: number | string }, sortOrder: number) =>
  updateCmsSortOrder("ads-banner", item.id!, sortOrder);
