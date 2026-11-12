import { apiFetch } from "@/lib/apiClient";

// Lean, server-paged option sources for the Meta Tags target pickers. Each
// request asks the backend for just id + label rows (`limit` switches the
// `/active` endpoints into their paged mode); everything else is dropped here.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const PICKER_PAGE_SIZE = 20;

export interface PickerOption {
  value: string;
  label: string;
}

export interface PickerPage {
  options: PickerOption[];
  hasMore: boolean;
}

interface PagedBody<T> {
  data?: { data?: T[]; pagination?: { totalPages?: number; currentPage?: number } };
  message?: string;
}

const fetchPaged = async <T>(
  url: string,
  params: { search?: string; page?: number; id?: string },
  toOption: (row: T) => PickerOption,
  signal?: AbortSignal,
): Promise<PickerPage> => {
  const query = new URLSearchParams({ limit: String(params.id ? 1 : PICKER_PAGE_SIZE) });
  if (params.page) query.set("page", String(params.page));
  if (params.search) query.set("search", params.search);
  if (params.id) query.set("id", params.id);

  const response = await apiFetch(`${url}?${query.toString()}`, { signal });
  const body: PagedBody<T> = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Failed to load options");

  const rows = body.data?.data ?? [];
  const pagination = body.data?.pagination;
  return {
    options: rows.map(toOption),
    hasMore: Boolean(pagination && (pagination.currentPage ?? 1) < (pagination.totalPages ?? 1)),
  };
};

type ProductRow = { id: number; title: string };
type VariantRow = { id: number; label: string; product?: { title?: string } | null };
type BlogRow = { id: string; title: string };
type ProjectRow = { id: number; title: string };

const toProduct = (r: ProductRow): PickerOption => ({ value: String(r.id), label: r.title });
const toVariant = (r: VariantRow): PickerOption => ({
  value: String(r.id),
  // Labels repeat across products, so show the parent product too.
  label: r.product?.title ? `${r.label} — ${r.product.title}` : r.label,
});
const toBlog = (r: BlogRow): PickerOption => ({ value: r.id, label: r.title ? `${r.title} (${r.id})` : r.id });
const toProject = (r: ProjectRow): PickerOption => ({ value: String(r.id), label: r.title });

const PRODUCTS_URL = `${API_BASE_URL}/products/products/active`;
const VARIANTS_URL = `${API_BASE_URL}/products/variants/active`;
const BLOGS_URL = `${API_BASE_URL}/blogs/active`;
const PROJECTS_URL = `${API_BASE_URL}/masters/projects/active`;

export type PickerFetcher = (search: string, page: number, signal?: AbortSignal) => Promise<PickerPage>;

export const searchProducts: PickerFetcher = (search, page, signal) => fetchPaged<ProductRow>(PRODUCTS_URL, { search, page }, toProduct, signal);
export const searchVariants: PickerFetcher = (search, page, signal) => fetchPaged<VariantRow>(VARIANTS_URL, { search, page }, toVariant, signal);
export const searchBlogs: PickerFetcher = (search, page, signal) => fetchPaged<BlogRow>(BLOGS_URL, { search, page }, toBlog, signal);
export const searchProjects: PickerFetcher = (search, page, signal) => fetchPaged<ProjectRow>(PROJECTS_URL, { search, page }, toProject, signal);

// Single-record lookups, used to label a pre-selected (deep-linked) target.
export const getProductOption = async (id: string) => (await fetchPaged<ProductRow>(PRODUCTS_URL, { id }, toProduct)).options[0];
export const getVariantOption = async (id: string) => (await fetchPaged<VariantRow>(VARIANTS_URL, { id }, toVariant)).options[0];
export const getBlogOption = async (slug: string) => (await fetchPaged<BlogRow>(BLOGS_URL, { id: slug }, toBlog)).options[0];
export const getProjectOption = async (id: string) => (await fetchPaged<ProjectRow>(PROJECTS_URL, { id }, toProject)).options[0];
