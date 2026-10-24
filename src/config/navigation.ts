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
} from "lucide-react";

/**
 * Declarative sidebar menu. Routes/URLs are unchanged — this only controls grouping.
 * `permission` is reserved for the upcoming role-based access work (not enforced yet).
 */
export type Permission = string;

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: Permission;
  /** Only shown to the admin role (existing behaviour for "Users"). */
  adminOnly?: boolean;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Direct links inside this group. */
  items?: NavItem[];
  /** Nested sub-groups, rendered before `items`. */
  children?: NavGroup[];
  permission?: Permission;
  adminOnly?: boolean;
}

export interface NavSection {
  id: string;
  label: string;
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
        title: "Blogs",
        icon: FileText,
        items: [
          { title: "Blogs", url: "/blogs", icon: FileText },
          { title: "Blog Tags", url: "/blog-tags", icon: Tags },
        ],
      },
      { title: "Projects", url: "/projects", icon: Briefcase },
      {
        id: "services",
        title: "Services",
        icon: Wrench,
        items: [
          { title: "Services", url: "/services", icon: Wrench },
          { title: "Process Steps", url: "/process-steps", icon: ListChecks },
        ],
      },
      { title: "Downloads", url: "/downloads", icon: Download },
      {
        id: "shared-blocks",
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
    entries: [{ title: "Meta Tags", url: "/meta-tags", icon: Search }],
  },
  {
    id: "settings",
    label: "Settings",
    entries: [
      { title: "Site Settings", url: "/site-settings", icon: Settings },
      { title: "Social Media", url: "/social-media", icon: Share2 },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    entries: [
      { title: "Users", url: "/users", icon: Users, adminOnly: true },
    ],
  },
];
