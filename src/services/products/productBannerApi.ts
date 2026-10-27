import { PRODUCTS_API_URL, createCrudApi } from "./productsApiClient";

// Products > Product Banners — backed by `/api/backend/products/product-banners`.
// One detail-page banner per product (unique `product_id` on the server). FormData
// body: media_path (image upload) plus the text fields.
export { ApiError } from "./productsApiClient";

export interface ProductBannerRecord {
  id: number;
  product_id: number;
  product?: { id: number; title: string };
  media_path: string;
  media_alt: string;
  media_alt_ar: string;
  title: string;
  title_ar: string;
  sub_title: string;
  sub_title_ar: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const api = createCrudApi<ProductBannerRecord>(`${PRODUCTS_API_URL}/product-banners`);

// Fetcher shape matches usePaginatedList's `Fetcher<T>` contract. `attributes`
// limits the columns returned (used to find products that already have a banner).
export const fetchProductBannersList = (
  page: number,
  limit: number,
  search?: string,
  attributes?: string[],
) => api.list(page, limit, search, { attributes: attributes?.join(",") });
export const fetchProductBannerById = (id: number) => api.getById(id);
export const createProductBanner = (formData: FormData) => api.create(formData);
export const updateProductBanner = (id: number, formData: FormData) =>
  api.update(id, formData);
export const deleteProductBanner = (id: number) => api.remove(id);
