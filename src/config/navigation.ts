import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Settings,
  HelpCircle,
  Share2,
  MousePointerClick,
  Home,
  Tags,
  Monitor,
  MapPin,
  Compass,
  TrendingUp,
  Info,
  Heart,
  Clock,
  Image,
  Users,
  RadioTower,
  MessageSquare,
  Phone,
  Link2,
  Briefcase,
  Wrench,
  ListChecks,
  Factory,
  Mail,
  Package,
  Boxes,
  Star,
  ClipboardList,
  LayoutTemplate,
  ShieldCheck,
  Tag,
  ShoppingBag,
  SlidersHorizontal,
  Shapes,
  Sparkles,
  LayoutList,
  UploadCloud,
  FileText,
  Download,
  Layers,
  Search,
  Database,
  Megaphone,
  Inbox,
  Gift,
  PanelBottom,
  Newspaper,
  Plus,
} from "lucide-react";

/**
 * Declarative sidebar menu. Routes/URLs are unchanged — this only controls grouping.
 * `module` is the permission module (see the server's config/permissionModules.js) that
 * guards an entry; it is inherited from the group/section when not set on the item.
 * Entries without any module (Dashboard) are visible to every logged-in user.
 */
export type PermissionModule = string;

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  module?: PermissionModule;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Direct links inside this group. */
  items?: NavItem[];
  /** Nested sub-groups, rendered before `items`. */
  children?: NavGroup[];
  module?: PermissionModule;
}

export interface NavSection {
  id: string;
  label: string;
  module?: PermissionModule;
  entries: (NavGroup | NavItem)[];
}

export const isNavGroup = (entry: NavGroup | NavItem): entry is NavGroup =>
  "id" in entry;

export const NAV: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    entries: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    id: "website",
    label: "Website Content",
    entries: [
      {
        id: "pages",
        module: "website_pages",
        title: "Pages",
        icon: LayoutTemplate,
        children: [
          {
            id: "home",
            title: "Home",
            icon: Home,
            items: [
              { title: "Page Content", url: "/home-cms", icon: Home },
              { title: "Banner", url: "/home-banner", icon: Image },
              { title: "Brands", url: "/home-brands", icon: RadioTower },
              { title: "Testimonials", url: "/home-testimonials", icon: Monitor },
              { title: "Side Images", url: "/home-side-images", icon: SlidersHorizontal },
            ],
          },
          {
            id: "about",
            title: "About",
            icon: Info,
            items: [
              { title: "Page Content", url: "/about-cms", icon: Info },
              { title: "Core Values", url: "/about-core-values", icon: Heart },
              { title: "History", url: "/about-history", icon: Clock },
              { title: "Industries", url: "/about-industries", icon: Factory },
              { title: "Messages", url: "/about-messages", icon: MessageSquare },
            ],
          },
          {
            id: "contact",
            title: "Contact",
            icon: Phone,
            items: [
              { title: "Page Content", url: "/contact-cms", icon: Phone },
              { title: "Connections", url: "/contact-connections", icon: Link2 },
            ],
          },
          {
            id: "services-page",
            title: "Services Page",
            icon: Wrench,
            items: [{ title: "Page Content", url: "/service-cms", icon: Info }],
          },
          {
            id: "categories-page",
            title: "Categories Page",
            icon: Boxes,
            items: [{ title: "Page Content", url: "/category-cms", icon: Boxes }],
          },
          {
            id: "blog-page",
            title: "Blog Page",
            icon: Newspaper,
            items: [{ title: "Page Content", url: "/blog-cms", icon: FileText }],
          },
        ],
        items: [
          { title: "Privacy Policy", url: "/privacy-policy", icon: ShieldCheck },
          { title: "Navigation Pages", url: "/pages", icon: Compass },
        ],
      },
      {
        id: "site-elements",
        module: "site_elements",
        title: "Site Elements",
        icon: PanelBottom,
        items: [
          { title: "Banners", url: "/banners", icon: Image },
          { title: "Ads Banner", url: "/ads-banner", icon: Megaphone },
          { title: "Seasonal Offer", url: "/seasonal-offer", icon: Gift },
          { title: "Footer Media", url: "/footer-media", icon: Image },
          { title: "Floating Icons", url: "/floating-icons", icon: MousePointerClick },
        ],
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    entries: [
      {
        id: "products",
        module: "catalog",
        title: "Products",
        icon: Package,
        items: [
          { title: "Products", url: "/products", icon: ShoppingBag },
          { title: "Categories", url: "/product-categories", icon: Boxes },
          { title: "Category Highlights", url: "/product-highlights", icon: Star },
        ],
      },
      {
        id: "product-setup",
        module: "catalog",
        title: "Product Setup",
        icon: SlidersHorizontal,
        items: [
          { title: "Attributes", url: "/attributes", icon: SlidersHorizontal },
          { title: "Attribute Values", url: "/attribute-values", icon: Shapes },
          { title: "Features", url: "/product-labels?type=feature", icon: Sparkles },
          { title: "Tags", url: "/product-labels?type=tag", icon: Tag },
          { title: "Specifications", url: "/product-labels?type=specification", icon: ListChecks },
          { title: "Detail Fields", url: "/details/fields", icon: LayoutList },
          { title: "Media Library", url: "/details/media", icon: Image },
        ],
      },
      {
        id: "bulk-upload",
        module: "bulk_upload",
        title: "Bulk Upload",
        icon: UploadCloud,
        items: [
          { title: "Overview", url: "/bulk-upload", icon: UploadCloud },
          { title: "Categories", url: "/bulk-upload/categories", icon: Boxes },
          { title: "Attributes", url: "/bulk-upload/attributes", icon: SlidersHorizontal },
          { title: "Attribute Values", url: "/bulk-upload/attribute-values", icon: Shapes },
          { title: "Media", url: "/bulk-upload/media", icon: Image },
          { title: "Products", url: "/bulk-upload/products", icon: ShoppingBag },
          { title: "Product Variants", url: "/bulk-upload/product-variants", icon: Package },
          { title: "Product Main", url: "/bulk-upload/product-main", icon: Sparkles },
        ],
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Content",
    entries: [
      {
        id: "blogs",
        module: "blogs",
        title: "Blogs",
        icon: FileText,
        items: [
          { title: "Blogs", url: "/blogs", icon: FileText },
          { title: "Blog Tags", url: "/blog-tags", icon: Tags },
        ],
      },
      { title: "Projects", url: "/projects", icon: Briefcase, module: "projects" },
      {
        id: "services",
        module: "services",
        title: "Services",
        icon: Wrench,
        items: [
          { title: "Services", url: "/services", icon: Wrench },
          { title: "Process Steps", url: "/process-steps", icon: ListChecks },
        ],
      },
      { title: "Downloads", url: "/downloads", icon: Download, module: "downloads" },
      {
        id: "shared-blocks",
        module: "shared_blocks",
        title: "Shared Blocks",
        icon: Layers,
        items: [
          { title: "Content", url: "/common-content", icon: FileText },
          { title: "Common Features", url: "/common-features", icon: Sparkles },
          { title: "How It Works", url: "/common-how-it-works", icon: ListChecks },
          { title: "Milestones", url: "/milestones", icon: Layers },
        ],
      },
    ],
  },
  {
    id: "reference",
    label: "Reference Data",
    entries: [
      {
        id: "masters",
        module: "masters",
        title: "Masters",
        icon: Database,
        items: [
          { title: "FAQs", url: "/faqs", icon: HelpCircle },
          { title: "Industry", url: "/industry", icon: MapPin },
          { title: "Materials", url: "/materials", icon: Package },
          { title: "Work Plans", url: "/work-plans", icon: ClipboardList },
          { title: "Our Features", url: "/our-features", icon: TrendingUp },
        ],
      },
    ],
  },
  {
    id: "leads",
    label: "Leads",
    entries: [
      {
        id: "enquiries",
        module: "leads",
        title: "Enquiries",
        icon: Inbox,
        items: [
          { title: "Contact Enquiries", url: "/enquiries", icon: Mail },
          { title: "Sample Requests", url: "/sample-requests", icon: Mail },
          { title: "Download Requests", url: "/download-requests", icon: Mail },
          { title: "Quote Requests", url: "/quote-requests", icon: Mail },
        ],
      },
    ],
  },
  {
    id: "seo",
    label: "SEO",
    entries: [{ title: "Meta Tags", url: "/meta-tags", icon: Search, module: "seo" }],
  },
  {
    id: "settings",
    label: "Settings",
    module: "settings",
    entries: [
      { title: "Site Settings", url: "/site-settings", icon: Settings },
      { title: "Social Media", url: "/social-media", icon: Share2 },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    entries: [
      { title: "Users", url: "/users", icon: Users, module: "users" },
      { title: "Roles & Permissions", url: "/roles", icon: ShieldCheck, module: "roles" },
    ],
  },
];

/** Extra search terms per URL so pages can be found by what users want to do. */
const NAV_KEYWORDS: Record<string, string> = {
  "/meta-tags": "seo title description og schema json-ld",
  "/banners": "hero slider image",
  "/ads-banner": "advert promotion offer",
  "/seasonal-offer": "popup promotion discount",
  "/attributes": "size color variant option",
  "/attribute-values": "size color variant option swatch",
  "/details/fields": "description guide gallery video content blocks",
  "/details/media": "images videos files uploads",
  "/product-labels?type=feature": "label highlight",
  "/product-labels?type=tag": "label badge",
  "/product-labels?type=specification": "label spec technical",
  "/pages": "navbar footer menu links",
  "/site-settings": "logo email phone address general",
  "/social-media": "facebook instagram linkedin links",
  "/floating-icons": "whatsapp call chat",
  "/enquiries": "leads contact messages",
  "/quote-requests": "leads quotation",
  "/sample-requests": "leads samples",
  "/download-requests": "leads catalogue brochure",
  "/users": "accounts roles admin staff",
  "/bulk-upload": "import export excel xlsx csv",
};

export interface SearchEntry {
  title: string;
  url: string;
  icon: LucideIcon;
  /** e.g. "Website Content › Pages › Home" */
  breadcrumb: string;
  section: string;
  /** Text matched by the search box. */
  value: string;
}

const toEntry = (item: NavItem, section: string, trail: string[]): SearchEntry => {
  const breadcrumb = [section, ...trail].join(" › ");
  return {
    title: item.title,
    url: item.url,
    icon: item.icon,
    breadcrumb,
    section,
    value: `${item.title} ${breadcrumb} ${NAV_KEYWORDS[item.url] ?? ""}`,
  };
};

const collectGroup = (group: NavGroup, section: string, trail: string[]): SearchEntry[] => {
  const here = [...trail, group.title];
  return [
    ...(group.children ?? []).flatMap((child) => collectGroup(child, section, here)),
    // A single-page group is shown as one link, so its breadcrumb stops above it.
    ...(group.items ?? []).map((item) =>
      toEntry(item, section, group.items!.length === 1 && !group.children?.length ? trail : here),
    ),
  ];
};

/** Flattens a (possibly role-filtered) nav tree into search entries. */
export const flattenNav = (sections: NavSection[]): SearchEntry[] =>
  sections.flatMap((section) =>
    section.entries.flatMap((entry) =>
      isNavGroup(entry)
        ? collectGroup(entry, section.label, [])
        : [toEntry(entry, section.label, [])],
    ),
  );

/** "Create new …" shortcuts shown in the search palette. */
export const QUICK_ACTIONS: NavItem[] = [
  { title: "New product", url: "/products/new", icon: Plus },
  { title: "New category", url: "/product-categories/new", icon: Plus },
  { title: "New blog", url: "/blogs/new", icon: Plus },
  { title: "New project", url: "/projects/new", icon: Plus },
  { title: "New service", url: "/services/new", icon: Plus },
  { title: "New download", url: "/downloads/new", icon: Plus },
  { title: "New FAQ", url: "/faqs/new", icon: Plus },
  { title: "New banner", url: "/banners/new", icon: Plus },
];

/** Module guarding `url` (longest matching menu entry); undefined = open to every logged-in user. */
const URL_MODULES: { path: string; module?: PermissionModule }[] = (() => {
  const out: { path: string; module?: PermissionModule }[] = [];
  const walkGroup = (group: NavGroup, inherited?: PermissionModule) => {
    const mod = group.module ?? inherited;
    (group.items ?? []).forEach((item) =>
      out.push({ path: item.url.split("?")[0], module: item.module ?? mod }),
    );
    (group.children ?? []).forEach((child) => walkGroup(child, mod));
  };
  NAV.forEach((section) =>
    section.entries.forEach((entry) =>
      isNavGroup(entry)
        ? walkGroup(entry, section.module)
        : out.push({ path: entry.url.split("?")[0], module: entry.module ?? section.module }),
    ),
  );
  return out.sort((a, b) => b.path.length - a.path.length);
})();

export const moduleForPath = (pathname: string): PermissionModule | undefined => {
  if (pathname === "/") return undefined;
  const hit = URL_MODULES.find(
    ({ path }) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)),
  );
  return hit?.module;
};

/** True when `pathname` is a create/edit screen (needs "manage"), e.g. /blogs/new, /blogs/3/edit. */
export const isWritePath = (pathname: string): boolean =>
  /\/(new|create)$/.test(pathname) || /\/edit(\/|$)/.test(pathname) || /\/(new|edit)\//.test(pathname);
