import { updateCmsStatus, updateCmsSortOrder } from "@/services/common/cmsOrderStatusApi";
import { PRODUCTS_API_URL, createCrudApi } from "./productsApiClient";

// Products > Labels — backed by `/api/backend/products/product-labels` (JSON
// bodies). Features, tags and specifications share one `product_labels` master
// table, discriminated by `type`; the badge flag lives on the label row.
export { ApiError } from "./productsApiClient";

export const LABEL_TYPES = ["feature", "tag", "specification"] as const;
export type LabelType = (typeof LABEL_TYPES)[number];

export interface ProductLabelRecord {
  id: number;
  type: LabelType;
  title: string;
  title_ar: string;
  slug: string;
  is_active: boolean;
  is_product_badge: boolean;
  show_in_filter: boolean;
  sort_order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductLabelPayload {
  type: LabelType;
  title: string;
  title_ar: string;
  is_product_badge: boolean;
  show_in_filter: boolean;
  sort_order: number;
  is_active: boolean;
}

export type ProductLabelOption = Pick<
  ProductLabelRecord,
  "id" | "title" | "title_ar" | "type"
>;

const api = createCrudApi<ProductLabelRecord, ProductLabelOption>(
  `${PRODUCTS_API_URL}/product-labels`,
);

// `type` travels through `filters` so usePaginatedList refetches when the
// active tab changes.
export const fetchProductLabelList = (
  page: number,
  limit: number,
  search?: string,
  filters?: { type?: LabelType },
) => api.list(page, limit, search, filters?.type ? { type: filters.type } : undefined);
export const fetchProductLabelById = (id: number) => api.getById(id);
export const fetchActiveProductLabels = (type?: LabelType) =>
  api.active(type ? `?type=${type}` : "");
// Badge-capable labels only (master labels flagged `is_product_badge`).
export const fetchActiveBadgeLabels = () => api.active("?badge=true");
export const createProductLabel = (payload: ProductLabelPayload) => api.create(payload);
export const updateProductLabel = (id: number, payload: ProductLabelPayload) =>
  api.update(id, payload);
export const deleteProductLabel = (id: number) => api.remove(id);

export const toggleProductLabelStatus = (item: { id?: number | string }, isActive: boolean) =>
  updateCmsStatus("product-labels", item.id!, isActive);

export const updateProductLabelSortOrder = (item: { id?: number | string }, sortOrder: number) =>
  updateCmsSortOrder("product-labels", item.id!, sortOrder);