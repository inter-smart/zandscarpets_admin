import { apiFetch } from "@/lib/apiClient";
import { updateCmsStatus, updateCmsSortOrder } from "@/services/common/cmsOrderStatusApi";
import { PRODUCTS_API_URL, createCrudApi, parseEnvelope } from "./productsApiClient";

// Products > Variants — backed by `/api/backend/products/variants`. FormData
// bodies (media_path is an optional image upload); attribute_value_ids is a
// JSON string. One value per attribute the product uses.
export { ApiError } from "./productsApiClient";

export interface VariantAttributeLite {
  id: number;
  title: string;
  title_ar: string;
  type: string;
}

export interface VariantAttributeValueLite {
  id: number;
  value: string | null;
  value_ar: string | null;
  slug: string | null;
  media_path: string | null;
  color_code: string | null;
}

export interface VariantValueLink {
  id: number;
  attribute_id: number;
  attribute_value_id: number;
  attribute?: VariantAttributeLite;
  attributeValue?: VariantAttributeValueLite;
}

export interface ProductVariantRecord {
  id: number;
  product_id: number;
  label: string;
  label_ar: string;
  sku: string | null;
  media_path: string | null;
  media_alt: string | null;
  media_alt_ar: string | null;
  combination_key: string;
  is_active: boolean;
  sort_order: number;
  valueLinks?: VariantValueLink[];
  images?: {
    id: number;
    media_path: string;
    media_alt: string | null;
    media_alt_ar: string | null;
    sort_order: number;
  }[];
  product?: { id: number; title: string; title_ar?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

// Slim pick for the SEO-meta variant picker: label plus its product for
// disambiguation across products.
export interface ActiveProductVariantOption {
  id: number;
  label: string;
  product_id: number;
  product?: { id: number; title: string } | null;
}

export interface VariantFilters {
  product_id: number;
  status?: "active" | "inactive";
}

export interface GenerateSelectionsPayload {
  product_id: number;
  selections: { attribute_id: number; value_ids: number[] }[];
}

export interface GenerateResult {
  created: number;
  skipped: number;
  variant_ids: number[];
  skipped_keys: string[];
}

const api = createCrudApi<ProductVariantRecord>(`${PRODUCTS_API_URL}/variants`);

export const fetchProductVariantList = (
  page: number,
  limit: number,
  search?: string,
  filters?: VariantFilters,
) =>
  api.list(page, limit, search, {
    product_id: filters?.product_id,
    status: filters?.status,
  });
export const fetchProductVariantById = (id: number) => api.getById(id);

// Active variants across all products, for dropdowns (SEO meta picker).
export const fetchActiveProductVariants = () =>
  apiFetch(`${PRODUCTS_API_URL}/variants/active`).then((r) =>
    parseEnvelope<ActiveProductVariantOption[]>(r),
  );
export const createProductVariant = (formData: FormData) => api.create(formData);
export const updateProductVariant = (id: number, formData: FormData) =>
  api.update(id, formData);
export const deleteProductVariant = (id: number) => api.remove(id);

// Builds every combination of the chosen values, skipping ones that exist.
export const generateProductVariants = (payload: GenerateSelectionsPayload) =>
  apiFetch(`${PRODUCTS_API_URL}/variants/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => parseEnvelope<GenerateResult>(r));

// Resolve a single variant from a set of attribute value ids.
export const matchProductVariant = (productId: number, valueIds: number[]) =>
  apiFetch(
    `${PRODUCTS_API_URL}/variants/match?product_id=${productId}&value_ids=${valueIds.join(",")}`,
  ).then((r) => parseEnvelope<ProductVariantRecord | null>(r));

export const toggleProductVariantStatus = (
  item: { id?: number | string },
  isActive: boolean,
) => updateCmsStatus("product-variants", item.id!, isActive);

export const updateProductVariantSortOrder = (
  item: { id?: number | string },
  sortOrder: number,
) => updateCmsSortOrder("product-variants", item.id!, sortOrder);
