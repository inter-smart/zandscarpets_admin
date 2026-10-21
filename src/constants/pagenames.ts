// Static list of site page names for SEO meta data. Slugs are the canonical
// value stored in `meta_data.page_name` (matches the storefront's URL-based
// lookup); labels are display text.
export interface PageName {
  label: string;
  slug: string;
}

export const PAGE_NAMES: PageName[] = [
  { label: "Home", slug: "home" },
  { label: "About", slug: "about" },
  { label: "Services", slug: "services" },
  { label: "Contact", slug: "contact" },
  { label: "Blogs", slug: "blogs" },
  { label: "Downloads", slug: "downloads" },
  { label: "Privacy", slug: "privacy" },
  { label: "Our Work", slug: "our-work" },
  { label: "Category", slug: "category" },
  { label: "Products", slug: "products" },
];

export const pageLabel = (slug?: string | null): string | null =>
  PAGE_NAMES.find((p) => p.slug === slug)?.label ?? null;