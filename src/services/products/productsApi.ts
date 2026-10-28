import { updateCmsStatus, updateCmsSortOrder, updateCmsHome, updateCmsFooter, updateCmsNavbar } from "@/services/common/cmsOrderStatusApi";
import { PRODUCTS_API_URL, createCrudApi } from "./productsApiClient";
import type { ProductLabelOption } from "./productLabelsApi";
import type { AttributeOption } from "./attributesApi";

// Attributes the product uses to build variants, with the link's sort order.
export type ProductAttributeOption = AttributeOption & {
  ProductAttributes?: { sort_order: number };
};

// Products > Products — backed by `/api/backend/products/products`. FormData
// bodies: list_media_path (image upload) + gallery_meta / gallery_file__<id> (extra images); the *_ids relation
// arrays are sent as JSON strings.
export { ApiError } from "./productsApiClient";

export interface ProductImageRecord {
  id: number;
  media_path: string;
  media_alt: string | null;
  media_alt_ar: string | null;
  sort_order: number;
}

export interface ProductRecord {
  id: number;
  product_category_id: number;
  title: string;
  title_ar: string;
  slug: string;
  short_description: string;
  short_description_ar: string;
  product_description: string;
  product_description_ar: string;
  list_media_path: string | null;
  list_media_alt: string | null;
  list_media_alt_ar: string | null;
  images?: ProductImageRecord[];
  price: string | number | null;
  badge_label_id: number | null;
  badge?: ProductLabelOption | null;
  list_in_navbar: boolean;
  show_in_home: boolean;
  show_in_footer: boolean;
  sort_order: number;
  is_active: boolean;
  category?: { id: number; title: string; title_ar?: string } | null;
  labels?: ProductLabelOption[];
  attributes?: ProductAttributeOption[];
  variant_count?: number;
  relatedProducts?: ProductOption[];
  createdAt?: string;
  updatedAt?: string;
}

export type ProductOption = Pick<
  ProductRecord,
  "id" | "title" | "title_ar" | "slug" | "list_media_path" | "price"
>;

export interface ProductFilters {
  product_category_id?: number;
  status?: "active" | "inactive";
  show_in_home?: boolean;
  show_in_footer?: boolean;
  list_in_navbar?: boolean;
}

const api = createCrudApi<ProductRecord, ProductOption>(`${PRODUCTS_API_URL}/products`);

// Fetcher shape matches usePaginatedList's `Fetcher<T, F>` contract.
export const fetchProductList = (
  page: number,
  limit: number,
  search?: string,
  filters?: ProductFilters,
) =>
  api.list(page, limit, search, {
    product_category_id: filters?.product_category_id,
    status: filters?.status,
    show_in_home: filters?.show_in_home,
    show_in_footer: filters?.show_in_footer,
    list_in_navbar: filters?.list_in_navbar,
  });
export const fetchProductById = (id: number) => api.getById(id);
// Related-products picker source; pass the product being edited to exclude it.
export const fetchActiveProducts = (excludeId?: number) =>
  api.active(excludeId ? `?excludeId=${excludeId}` : "");
export const createProduct = (formData: FormData) => api.create(formData);
export const updateProduct = (id: number, formData: FormData) => api.update(id, formData);
export const deleteProduct = (id: number) => api.remove(id);

export const toggleProductStatus = (item: { id?: number | string }, isActive: boolean) =>
  updateCmsStatus("products", item.id!, isActive);

export const toggleProductHome = (item: { id?: number | string }, showInHome: boolean) =>
  updateCmsHome("products", item.id!, showInHome);

export const toggleProductNavbar = (item: { id?: number | string }, showInNavbar: boolean) =>
  updateCmsNavbar("products", item.id!, showInNavbar);

export const toggleProductFooter = (item: { id?: number | string }, showInFooter: boolean) =>
  updateCmsFooter("products", item.id!, showInFooter);

export const updateProductSortOrder = (item: { id?: number | string }, sortOrder: number) =>
  updateCmsSortOrder("products", item.id!, sortOrder);