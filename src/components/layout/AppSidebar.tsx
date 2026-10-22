import { useState, useEffect, useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  ChevronRight,
  HelpCircle,
  Share2,
  MousePointerClick,
  Home,
  Tags,
  Monitor,
  MapPin,
  Compass,
  Smartphone,
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
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/lib/utils";

const Logo =
  "https://cdn-lanhl.nitrocdn.com/BEDNLEoRmIKjWuHGWySaweMWUMbmbmac/assets/images/source/rev-b24f0bb/www.zandscarpets.com/assets/images/logo.svg";
const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Downloads", url: "/downloads", icon: Download },
];

const homeSection = [
  { title: "CMS", url: "/home-cms", icon: Home },
  { title: "Banner", url: "/home-banner", icon: Image },
  { title: "Brands", url: "/home-brands", icon: RadioTower },
  { title: "Testimonials", url: "/home-testimonials", icon: Monitor },
  { title: "Side Images", url: "/home-side-images", icon: SlidersHorizontal },
];

const aboutSection = [
  { title: "CMS", url: "/about-cms", icon: Info },
  { title: "Core Values", url: "/about-core-values", icon: Heart },
  { title: "History", url: "/about-history", icon: Clock },
  { title: "Industries", url: "/about-industries", icon: Factory },
  { title: "Messages", url: "/about-messages", icon: MessageSquare },
];

const categorySection = [
  { title: "CMS", url: "/category-cms", icon: Boxes },
];

const blogPageSection = [{ title: "CMS", url: "/blog-cms", icon: FileText }];

const blogsSection = [
  { title: "Blogs", url: "/blogs", icon: FileText },
  { title: "Blog Tags", url: "/blog-tags", icon: Tags },
];

const contactSection = [
  { title: "CMS", url: "/contact-cms", icon: Phone },
  { title: "Connections", url: "/contact-connections", icon: Link2 },
];

const projectsSection = [
  {
    title: "Projects",
    url: "/projects",
    icon: Briefcase,
  },
];

const productsSection = [
  { title: "Products", url: "/products", icon: ShoppingBag },
  { title: "Categories", url: "/product-categories", icon: Boxes },
  { title: "Category Highlights", url: "/product-highlights", icon: Star },
  { title: "Attributes", url: "/attributes", icon: SlidersHorizontal },
  { title: "Attribute Values", url: "/attribute-values", icon: Shapes },
  { title: "Detail Fields", url: "/details/fields", icon: LayoutList },
  { title: "Media Library", url: "/details/media", icon: Image },
  { title: "Features", url: "/product-labels?type=feature", icon: Sparkles },
  { title: "Tags", url: "/product-labels?type=tag", icon: Tag },
  { title: "Specifications", url: "/product-labels?type=specification", icon: ListChecks },
  { title: "Data Sheets", url: "/data-sheets", icon: FileText },
];

const bulkUploadSection = [
  { title: "Overview", url: "/bulk-upload", icon: UploadCloud },
  { title: "Categories", url: "/bulk-upload/categories", icon: Boxes },
  { title: "Attributes", url: "/bulk-upload/attributes", icon: SlidersHorizontal },
  { title: "Attribute Values", url: "/bulk-upload/attribute-values", icon: Shapes },
  { title: "Media", url: "/bulk-upload/media", icon: Image },
  { title: "Products", url: "/bulk-upload/products", icon: ShoppingBag },
  { title: "Product Variants", url: "/bulk-upload/product-variants", icon: Package },
  { title: "Product Main", url: "/bulk-upload/product-main", icon: Sparkles },
];

const enquiriesSection = [
  {
    title: "Contact Enquiries",
    url: "/enquiries",
    icon: Mail,
  },
  {
    title: "Sample Requests",
    url: "/sample-requests",
    icon: Mail,
  },
  {
    title: "Download Requests",
    url: "/download-requests",
    icon: Mail,
  },
  {
    title: "Quote Requests",
    url: "/quote-requests",
    icon: Mail,
  },
];

const commonSection = [
  { title: "Site Settings", url: "/site-settings", icon: Settings },
  { title: "Social Media", url: "/social-media", icon: Share2 },
  { title: "Floating Icons", url: "/floating-icons", icon: MousePointerClick },
  { title: "Meta Tags", url: "/meta-tags", icon: Tags },
  { title: "Banners", url: "/banners", icon: Image },
  { title: "Footer Media", url: "/footer-media", icon: Image },
  { title: "Pages", url: "/pages", icon: Compass },
];
const policiesSection = [
  { title: "Privacy Policy", url: "/privacy-policy", icon: ShieldCheck },
];
const mastersSection = [
  { title: "Faqs", url: "/faqs", icon: HelpCircle },
  { title: "Industry", url: "/industry", icon: MapPin },
  { title: "Materials", url: "/materials", icon: Package },
  { title: "Work Plans", url: "/work-plans", icon: ClipboardList },
  { title: "Our Features", url: "/our-features", icon: TrendingUp },
  { title: "Ads Banner", url: "/ads-banner", icon: Image },
  { title: "Seasonal Offer", url: "/seasonal-offer", icon: Sparkles },
];
const servicesSection = [
  { title: "Services", url: "/services", icon: Wrench },
  { title: "CMS", url: "/service-cms", icon: Info },
  { title: "Process Steps", url: "/process-steps", icon: ListChecks },
];
const commonItemsSection = [
  { title: "Content", url: "/common-content", icon: FileText },
  { title: "Our Features", url: "/common-features", icon: Sparkles },
  { title: "How It Works", url: "/common-how-it-works", icon: ListChecks },
  { title: "Milestones", url: "/milestones", icon: Layers },
];
const adminSection = [{ title: "Users", url: "/users", icon: Users }];

const CMS_SECTIONS = ["home", "about", "category", "blog-page", "contact", "services", "common"];

const isNavActive = (
  location: { pathname: string; search: string },
  url: string,
  end = false,
) => {
  const [path, query] = url.split("?");
  const pathMatch = end
    ? location.pathname === path
    : location.pathname === path || location.pathname.startsWith(`${path}/`);
  if (!pathMatch) return false;

  // Query-param links (e.g. /product-labels?type=tag) are only active when the
  // matching param is present, so each type highlights its own entry.
  if (query) {
    const want = new URLSearchParams(query);
    const have = new URLSearchParams(location.search);
    for (const [key, value] of want) {
      if (have.get(key) !== value) return false;
    }
  }

  return true;
};

const navItemCls =
  "flex items-center w-full text-left text-sidebar-foreground hover:bg-sidebar-accent/50";

export function AppSidebar() {
  const location = useLocation();
  const { role } = useAuth();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [cmsOpen, setCmsOpen] = useState(false);

  // CMS is open only while one of its sub-sections is open; opening any
  // other group closes it.
  useEffect(() => {
    if (openSection === null) return;
    setCmsOpen(CMS_SECTIONS.includes(openSection));
  }, [openSection]);

  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Auto-open sections based on current path
  useEffect(() => {
    const path = location.pathname;

    // Home section
    if (path.includes("/home-")) {
      setOpenSection("home");
    }
    // About section
    else if (path.includes("/about-")) {
      setOpenSection("about");
    }
    // Category page section
    else if (path.includes("/category-cms")) {
      setOpenSection("category");
    }
    // Blog page CMS
    else if (path.includes("/blog-cms")) {
      setOpenSection("blog-page");
    }
    // Blogs section
    else if (path.startsWith("/blogs") || path.startsWith("/blog-tags")) {
      setOpenSection("blogs");
    }
    // Contact section
    else if (path.includes("/contact-")) {
      setOpenSection("contact");
    }
    // Common Items section
    else if (
      ["/milestones", "/common-content", "/common-features", "/common-how-it-works"].some(
        (route) => path.startsWith(route),
      )
    ) {
      setOpenSection("common-items");
    }
    // Common sections
    else if (
      [
        "/site-settings",
        "/social-media",
        "/floating-icons",
        "/meta-tags",
        "/common-faq",
        "/banners",
        "/footer-media",
        "/pages",
      ].some((route) => path.includes(route))
    ) {
      setOpenSection("common");
    } else if (path.includes("/bulk-upload")) {
      // Checked before "/products" below — "/bulk-upload/products" would
      // otherwise also match that section's "/products" substring check.
      setOpenSection("bulk-upload");
    } else if (
      [
        "/products",
        "/product-categories",
        "/product-highlights",
        "/attributes",
        "/attribute-values",
        "/product-labels",
        "/details",
      ].some((route) =>
        path.includes(route),
      )
    ) {
      setOpenSection("products");
    } else if (["/projects"].some((route) => path.includes(route))) {
      setOpenSection("projects");
    } else if (
      ["/enquiries", "/sample-requests", "/download-requests", "/quote-requests"].some((route) =>
        path.includes(route),
      )
    ) {
      setOpenSection("enquiries");
    } else if (["/privacy-policy"].some((route) => path.includes(route))) {
      setOpenSection("policies");
    }
    // Masters section
    else if (
      [
        "/faqs",
        "/industry",
        "/materials",
        "/work-plans",
        "/our-features",
        "/ads-banner",
        "/seasonal-offer",
        "/projects",
      ].some((route) => path.includes(route))
    ) {
      setOpenSection("masters");
    }
    // Services section
    else if (
      ["/services", "/service-cms", "/process-steps"].some((route) =>
        path.includes(route),
      )
    ) {
      setOpenSection("services");
    }
    // Admin section
    else if (["/users"].some((route) => path.includes(route))) {
      setOpenSection("admin");
    }
    // Dashboard (or any other unmatched route) — collapse everything
    else {
      setOpenSection(null);
    }
  }, [location.pathname]);

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar border-r border-sidebar-border gap-0">
        {/* Logo Section */}
        <div
          className={`border-b border-sidebar-border ${isCollapsed ? "py-4 px-2k" : "p-4"}`}
        >
          {!isCollapsed ? (
            <div className="flex items-center justify-center">
              <img
                src={Logo}
                alt="Z&S"
                className="h-8 w-auto max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-sm">
                Z&S
              </span>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isNavActive(location, item.url, true)}
                >
                  <NavLink to={item.url} end className={navItemCls}>
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3">{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* CMS (Home, About, Category, Contact, Services, Settings & Common) */}
        <GetLayout
          Icon={LayoutTemplate}
          title="CMS"
          isCollapsed={isCollapsed}
          open={cmsOpen}
          onOpenChange={(isOpen) => {
            setCmsOpen(isOpen);
            if (isOpen) setOpenSection(null);
          }}
          location={location}
          Section={[]}
        >
            <GetLayout
              nested
              Icon={Home}
              title="Home"
              isCollapsed={isCollapsed}
              open={openSection === "home"}
              onOpenChange={(isOpen) => setOpenSection(isOpen ? "home" : null)}
              location={location}
              Section={homeSection}
            />
            <GetLayout
              nested
              Icon={Info}
              title="About"
              isCollapsed={isCollapsed}
              open={openSection === "about"}
              onOpenChange={(isOpen) => setOpenSection(isOpen ? "about" : null)}
              location={location}
              Section={aboutSection}
            />
            <GetLayout
              nested
              Icon={Boxes}
              title="Category"
              isCollapsed={isCollapsed}
              open={openSection === "category"}
              onOpenChange={(isOpen) => setOpenSection(isOpen ? "category" : null)}
              location={location}
              Section={categorySection}
            />
            <GetLayout
              nested
              Icon={FileText}
              title="Blog Page"
              isCollapsed={isCollapsed}
              open={openSection === "blog-page"}
              onOpenChange={(isOpen) => setOpenSection(isOpen ? "blog-page" : null)}
              location={location}
              Section={blogPageSection}
            />
            <GetLayout
              nested
              Icon={Phone}
              title="Contact"
              isCollapsed={isCollapsed}
              open={openSection === "contact"}
              onOpenChange={(isOpen) => setOpenSection(isOpen ? "contact" : null)}
              location={location}
              Section={contactSection}
            />
            <GetLayout
              nested
              Icon={Wrench}
              title="Services"
              isCollapsed={isCollapsed}
              open={openSection === "services"}
              onOpenChange={(isOpen) => setOpenSection(isOpen ? "services" : null)}
              location={location}
              Section={servicesSection}
            />
            <GetLayout
              nested
              Icon={Settings}
              title="Settings & Common"
              isCollapsed={isCollapsed}
              open={openSection === "common"}
              onOpenChange={(isOpen) => setOpenSection(isOpen ? "common" : null)}
              location={location}
              Section={commonSection}
            />
        </GetLayout>

        {/* Common Items */}
        <GetLayout
          Icon={Layers}
          title="Common Items"
          isCollapsed={isCollapsed}
          open={openSection === "common-items"}
          onOpenChange={(isOpen) => setOpenSection(isOpen ? "common-items" : null)}
          location={location}
          Section={commonItemsSection}
        />

        <GetLayout
          Icon={Compass}
          title="Projects"
          isCollapsed={isCollapsed}
          open={openSection === "projects"}
          onOpenChange={(isOpen) => setOpenSection(isOpen ? "projects" : null)}
          location={location}
          Section={projectsSection}
        />

        <GetLayout
          Icon={FileText}
          title="Blogs"
          isCollapsed={isCollapsed}
          open={openSection === "blogs"}
          onOpenChange={(isOpen) => setOpenSection(isOpen ? "blogs" : null)}
          location={location}
          Section={blogsSection}
        />

        <GetLayout
          Icon={Package}
          title="Products"
          isCollapsed={isCollapsed}
          open={openSection === "products"}
          onOpenChange={(isOpen) => setOpenSection(isOpen ? "products" : null)}
          location={location}
          Section={productsSection}
        />

        {/* Bulk Upload */}
        <GetLayout
          Icon={UploadCloud}
          title="Bulk Upload"
          isCollapsed={isCollapsed}
          open={openSection === "bulk-upload"}
          onOpenChange={(isOpen) => setOpenSection(isOpen ? "bulk-upload" : null)}
          location={location}
          Section={bulkUploadSection}
        />

        {/* Contact Enquiries */}
        <GetLayout
          Icon={Mail}
          title="Enquiries"
          isCollapsed={isCollapsed}
          open={openSection === "enquiries"}
          onOpenChange={(isOpen) => setOpenSection(isOpen ? "enquiries" : null)}
          location={location}
          Section={enquiriesSection}
        />

        {/* Masters */}
        <GetLayout
          Icon={Compass}
          title="Masters"
          isCollapsed={isCollapsed}
          open={openSection === "masters"}
          onOpenChange={(isOpen) => setOpenSection(isOpen ? "masters" : null)}
          location={location}
          Section={mastersSection}
        />

        {/* Policies */}
        <GetLayout
          Icon={ShieldCheck}
          title="Policies"
          isCollapsed={isCollapsed}
          open={openSection === "policies"}
          onOpenChange={(isOpen) => setOpenSection(isOpen ? "policies" : null)}
          location={location}
          Section={policiesSection}
        />

        {role === ROLES.ADMIN && (
          <GetLayout
            Icon={Users}
            title="Admin"
            isCollapsed={isCollapsed}
            open={openSection === "admin"}
            onOpenChange={(isOpen) => setOpenSection(isOpen ? "admin" : null)}
            location={location}
            Section={adminSection}
          />
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function GetLayout({
  open,
  onOpenChange,
  location,
  Section,
  isCollapsed,
  title,
  Icon,
  nested = false,
  children = null,
}) {
  const Wrapper = nested ? "div" : SidebarGroup;
  return (
    <Wrapper className={nested ? "mt-1" : undefined}>
      <Collapsible open={!isCollapsed && open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger
          className={`flex items-center w-full p-2 text-sm font-medium rounded-md transition-colors ${
            open
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          }`}
        >
          <Icon className="h-4 w-4" />
          {!isCollapsed && (
            <>
              <span className="ml-2">{title}</span>
              <ChevronRight
                className={`h-4 w-4 ml-auto transition-transform ${
                  open ? "rotate-90" : ""
                }`}
              />
            </>
          )}
        </CollapsibleTrigger>
        {!isCollapsed && (
          <CollapsibleContent
            className={`ml-6 mt-1 space-y-1 border-l pl-2 transition-colors ${
              open ? "border-sidebar-primary/40" : "border-sidebar-border"
            }`}
          >
            {children}
            <SidebarMenu>
              {Section.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    isActive={isNavActive(location, item.url)}
                  >
                    <NavLink to={item.url} className={navItemCls}>
                      <item.icon className="h-4 w-4" />
                      <span className="ml-2">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Wrapper>
  );
}
