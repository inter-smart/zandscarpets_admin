import { apiFetch } from "@/lib/apiClient";

// Seasonal Offer popup — backed by `/api/backend/seasonal-offer` (authMiddleware-gated). Singleton
// resource with a media field, mirrors homeCmsApi.ts's multipart FormData + ApiError convention.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SEASONAL_OFFER_URL = `${API_BASE_URL}/seasonal-offer`;

export interface SeasonalOffer {
  id?: number;
  is_active: boolean;
  auto_show_delay_seconds?: number | null;
  media_path?: string | null;
  badge_image?: string | null;
  button_text?: string;
  button_text_ar?: string;
  button_link?: string;
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

// Fetch Seasonal Offer data
export const fetchSeasonalOffer = async (): Promise<
  ApiEnvelope<SeasonalOffer | null>
> => {
  const response = await apiFetch(SEASONAL_OFFER_URL);
  return parseEnvelope<SeasonalOffer | null>(response);
};

// Create or update the Seasonal Offer singleton row. `id` defaults to 1, mirroring
// homeCmsApi.ts's `PUT .../1` — the backend ignores the id and does a findOne().
export const saveSeasonalOffer = async (
  data: FormData,
  id: number = 1,
): Promise<ApiEnvelope<SeasonalOffer>> => {
  const response = await apiFetch(`${SEASONAL_OFFER_URL}/${id}`, {
    method: "PUT",
    body: data,
  });
  return parseEnvelope<SeasonalOffer>(response);
};
