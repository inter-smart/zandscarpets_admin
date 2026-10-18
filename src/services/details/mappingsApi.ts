import { apiFetch, parseEnvelope, ApiError, DETAILS_API_URL } from "./detailsApiClient";
import { MediaRecord } from "./mediaApi";

// Dynamic Details > product-level field & item management — backed by
// `/api/backend/details/mappings`. JSON bodies.
export { ApiError };

export interface DetailItemRecord {
  id: number;
  mapping_id: number;
  text_content: string | null;
  text_content_ar?: string | null;
  media_id: number | null;
  media: MediaRecord | null;
  sort_order: number;
}

export interface DetailMappingRecord {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  field_id: number;
  hidden: boolean;
  sort_order: number;
  field: {
    id: number;
    name: string;
    name_ar?: string | null;
    slug: string;
    type: "rich_text" | "image" | "video";
    allows_multiple: boolean;
  };
  items: DetailItemRecord[];
}

const MAPPINGS_URL = `${DETAILS_API_URL}/mappings`;

const json = async <T>(url: string, method: string, body?: object) =>
  parseEnvelope<T>(
    await apiFetch(url, {
      method,
      ...(body !== undefined
        ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
        : {}),
    }),
  );

export const fetchProductDetailMappings = (productId: number) =>
  json<DetailMappingRecord[]>(`${MAPPINGS_URL}/products/${productId}`, "GET");

export const addFieldToProduct = (
  productId: number,
  payload: { field_id: number; variant_id?: number },
) => json<DetailMappingRecord>(`${MAPPINGS_URL}/products/${productId}`, "POST", payload);

export const removeMapping = (mappingId: number) =>
  json<{ id: number }>(`${MAPPINGS_URL}/${mappingId}`, "DELETE");

export const addDetailItem = (
  mappingId: number,
  payload: { text_content?: string; text_content_ar?: string; media_id?: number },
) => json<DetailItemRecord>(`${MAPPINGS_URL}/${mappingId}/items`, "POST", payload);

export const editDetailItem = (
  mappingId: number,
  itemId: number,
  payload: { text_content?: string; text_content_ar?: string; media_id?: number },
) => json<DetailItemRecord>(`${MAPPINGS_URL}/${mappingId}/items/${itemId}`, "PUT", payload);

export const removeDetailItem = (itemId: number) =>
  json<{ id: number }>(`${MAPPINGS_URL}/items/${itemId}`, "DELETE");

export const reorderDetailItems = (mappingId: number, orderedIds: number[]) =>
  json<{ ordered_ids: number[] }>(`${MAPPINGS_URL}/${mappingId}/items/reorder`, "PUT", {
    ordered_ids: orderedIds,
  });
