import { apiFetch } from "@/lib/apiClient";

// Contact > CMS — backed by `/api/backend/contact/contact-cms` (authMiddleware-gated). Singleton
// resource, no media fields, mirrors homeCmsApi.ts's ApiError + envelope-parsing convention.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CONTACT_CMS_URL = `${API_BASE_URL}/contact/contact-cms`;

export interface ContactCms {
  id?: number;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  form_title: string;
  form_title_ar: string;
  social_media_title: string;
  social_media_title_ar: string;
  map_url: string;
  // phone / email / office detail cards
  phone_title?: string | null;
  phone_title_ar?: string | null;
  phone_description?: string | null;
  phone_description_ar?: string | null;
  phone_value?: string | null;
  phone_icon_media_alt?: string | null;
  phone_icon_media_alt_ar?: string | null;
  phone_icon_media_path?: string | null;
  email_title?: string | null;
  email_title_ar?: string | null;
  email_description?: string | null;
  email_description_ar?: string | null;
  email_value?: string | null;
  email_icon_media_alt?: string | null;
  email_icon_media_alt_ar?: string | null;
  email_icon_media_path?: string | null;
  office_title?: string | null;
  office_title_ar?: string | null;
  office_description?: string | null;
  office_description_ar?: string | null;
  office_value?: string | null;
  office_value_ar?: string | null;
  office_icon_media_alt?: string | null;
  office_icon_media_alt_ar?: string | null;
  office_icon_media_path?: string | null;
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

// Fetch Contact CMS data
export const fetchContactCms = async (): Promise<ApiEnvelope<ContactCms | null>> => {
  const response = await apiFetch(CONTACT_CMS_URL);
  return parseEnvelope<ContactCms | null>(response);
};

// Create or update the Contact CMS singleton row. `id` defaults to 1, mirroring
// homeCmsApi.ts's `PUT .../1` — the backend ignores the id and does a findOne().
export const saveContactCms = async (
  formData: FormData,
  id: number = 1,
): Promise<ApiEnvelope<ContactCms>> => {
  const response = await apiFetch(`${CONTACT_CMS_URL}/${id}`, {
    method: "PUT",
    body: formData,
  });
  return parseEnvelope<ContactCms>(response);
};
