import { updateCmsStatus, updateCmsSortOrder } from "@/services/common/cmsOrderStatusApi";
import { DETAILS_API_URL, createCrudApi } from "./detailsApiClient";

// Dynamic Details > Detail Fields (master list) — backed by
// `/api/backend/details/detail-fields`. JSON bodies.
export { ApiError } from "./detailsApiClient";

export const FIELD_TYPES = ["rich_text", "image", "video"] as const;
export type DetailFieldType = (typeof FIELD_TYPES)[number];

export interface DetailFieldRecord {
  id: number;
  name: string;
  name_ar?: string | null;
  slug: string;
  type: DetailFieldType;
  allows_multiple: boolean;
  sort_order: number;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DetailFieldPayload {
  name: string;
  name_ar?: string;
  type: DetailFieldType;
  allows_multiple: boolean;
  sort_order: number;
  is_active: boolean;
}

export type DetailFieldOption = Pick<
  DetailFieldRecord,
  "id" | "name" | "slug" | "type" | "allows_multiple"
>;

const api = createCrudApi<DetailFieldRecord, DetailFieldOption>(
  `${DETAILS_API_URL}/detail-fields`,
);

export const fetchDetailFieldList = (page: number, limit: number, search?: string) =>
  api.list(page, limit, search);
export const fetchDetailFieldById = (id: number) => api.getById(id);
export const fetchActiveDetailFields = () => api.active();
export const createDetailField = (payload: DetailFieldPayload) => api.create(payload);
export const updateDetailField = (id: number, payload: DetailFieldPayload) =>
  api.update(id, payload);
export const deleteDetailField = (id: number) => api.remove(id);

export const toggleDetailFieldStatus = (item: { id?: number | string }, isActive: boolean) =>
  updateCmsStatus("detail-fields", item.id!, isActive);

export const updateDetailFieldSortOrder = (item: { id?: number | string }, sortOrder: number) =>
  updateCmsSortOrder("detail-fields", item.id!, sortOrder);
