import { apiFetch } from "@/lib/apiClient";

// Bulk Upload: download template / validate (dry run) / commit, for each of
// Categories, Attributes, Attribute Values, Products, Product Variants,
// and Product Main (the combined cascading-create sheet).
// Not built on createCrudApi — this isn't CRUD, it's a 3-call wizard
// (template/validate/commit) that shares one response envelope with every
// other service in this app.

export const BULK_UPLOAD_API_URL = `${import.meta.env.VITE_API_BASE_URL}/bulk-upload`;

export type BulkUploadEntity =
  | "blogs"
  | "categories"
  | "attributes"
  | "attribute-values"
  | "products"
  | "product-variants"
  | "product-main";

export interface BulkUploadIssue {
  row: number | null;
  column: string | null;
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface BulkUploadValidateResult {
  status: "failed" | "passed";
  validationId?: string;
  errors: BulkUploadIssue[];
  warnings: BulkUploadIssue[];
  summary: { created: number; skipped: number; updated?: number };
  preview?: Record<string, unknown>[];
}

export interface BulkUploadCommitResult {
  created: number;
  skipped: number;
  // Only present for entities that support upsert (Categories, for now) —
  // a row matching existing data was updated in place rather than created.
  updated?: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
interface ApiErrorEnvelope {
  success: false;
  error?: { message?: string; code?: string; statusCode?: number; details?: unknown };
  message?: string;
}

export class BulkUploadApiError extends Error {
  code?: string;
  details?: unknown;
  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "BulkUploadApiError";
    this.code = code;
    this.details = details;
  }
}

const parseEnvelope = async <T>(response: Response): Promise<T> => {
  const body = await response.json().catch(() => ({}) as ApiEnvelope<T> & ApiErrorEnvelope);
  if (!response.ok || !body.success) {
    const errorBody = body as ApiErrorEnvelope;
    const message = errorBody.error?.message || errorBody.message || `Request failed with status ${response.status}`;
    throw new BulkUploadApiError(message, errorBody.error?.code, errorBody.error?.details);
  }
  return (body as ApiEnvelope<T>).data;
};

const entityUrl = (entity: BulkUploadEntity) => `${BULK_UPLOAD_API_URL}/${entity}`;

export const downloadTemplateUrl = (entity: BulkUploadEntity) => `${entityUrl(entity)}/template`;

// A real download needs the auth cookie, which a plain <a href> to a
// cross-origin API also sends (credentials: "include" is a fetch-only
// concept) — so this just triggers the browser's normal navigation/download
// flow against the API URL directly.
export const downloadTemplate = (entity: BulkUploadEntity) => {
  window.open(downloadTemplateUrl(entity), "_blank");
};

export const validateBulkUploadFile = (entity: BulkUploadEntity, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch(`${entityUrl(entity)}/validate`, { method: "POST", body: formData }).then((r) =>
    parseEnvelope<BulkUploadValidateResult>(r),
  );
};

export const commitBulkUploadImport = (entity: BulkUploadEntity, validationId: string) =>
  apiFetch(`${entityUrl(entity)}/commit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ validationId }),
  }).then((r) => parseEnvelope<BulkUploadCommitResult>(r));
