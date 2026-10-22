import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v6";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Core pages that exist
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// lazy

// Common pages that exist
const SiteSettingsForm = React.lazy(
  () => import("./pages/common/SiteSettingsForm"),
);
const SocialMediaList = React.lazy(
  () => import("./pages/common/SocialMediaList"),
);
const SocialMediaForm = React.lazy(
  () => import("./pages/common/SocialMediaForm"),
);
const MetaTagsForm = React.lazy(() => import("./pages/common/MetaTagsForm"));
const FloatingIconList = React.lazy(
  () => import("./pages/siteSettings/FloatingIconList"),
);
const FloatingIconForm = React.lazy(
  () => import("./pages/siteSettings/FloatingIconForm"),
);

const UsersList = React.lazy(() => import("./pages/users/UsersList"));
const UsersForm = React.lazy(() => import("./pages/users/UsersForm"));
import { MetaTagsList } from "./pages/common/MetaTagsList";

// Masters — Pages
const PagesList = React.lazy(() => import("./pages/masters/PagesList"));
const PagesForm = React.lazy(() => import("./pages/masters/PagesForm"));

// Masters — Faqs
const FaqsList = React.lazy(() => import("./pages/masters/FaqsList"));
const FaqsForm = React.lazy(() => import("./pages/masters/FaqsForm"));

// Masters — Industry
const IndustryList = React.lazy(() => import("./pages/masters/IndustryList"));
const IndustryForm = React.lazy(() => import("./pages/masters/IndustryForm"));

// Masters — Materials
const MaterialsList = React.lazy(() => import("./pages/masters/MaterialsList"));
const MaterialsForm = React.lazy(() => import("./pages/masters/MaterialsForm"));

// Masters — Work Plans
const WorkPlanList = React.lazy(() => import("./pages/masters/WorkPlanList"));
const WorkPlanForm = React.lazy(() => import("./pages/masters/WorkPlanForm"));

// Services — Service
const ServiceList = React.lazy(() => import("./pages/services/ServiceList"));
const ServiceForm = React.lazy(() => import("./pages/services/ServiceForm"));

// Services — CMS
const ServiceCmsForm = React.lazy(
  () => import("./pages/services/ServiceCmsForm"),
);

// Services — Process Steps
const ProcessStepList = React.lazy(
  () => import("./pages/services/ProcessStepList"),
);
const ProcessStepForm = React.lazy(
  () => import("./pages/services/ProcessStepForm"),
);

// Masters — Our Features
const OurFeaturesList = React.lazy(
  () => import("./pages/masters/OurFeaturesList"),
);
const OurFeaturesForm = React.lazy(
  () => import("./pages/masters/OurFeaturesForm"),
);

// Masters — Ads Banner
const AdsBannerList = React.lazy(() => import("./pages/masters/AdsBannerList"));
const AdsBannerForm = React.lazy(() => import("./pages/masters/AdsBannerForm"));

// Products
const ProductCategoryList = React.lazy(() => import("./pages/products/ProductCategoryList"));
const ProductCategoryForm = React.lazy(() => import("./pages/products/ProductCategoryForm"));
const ProductHighlightList = React.lazy(() => import("./pages/products/ProductHighlightList"));
const ProductHighlightForm = React.lazy(() => import("./pages/products/ProductHighlightForm"));
const ProductsList = React.lazy(() => import("./pages/products/ProductsList"));
const ProductForm = React.lazy(() => import("./pages/products/ProductForm"));
const ProductMediaList = React.lazy(() => import("./pages/products/ProductMediaList"));
const ProductMediaForm = React.lazy(() => import("./pages/products/ProductMediaForm"));
const AttributesList = React.lazy(() => import("./pages/products/AttributesList"));
const AttributeForm = React.lazy(() => import("./pages/products/AttributeForm"));
const AttributeValuesList = React.lazy(() => import("./pages/products/AttributeValuesList"));
const AttributeValueForm = React.lazy(() => import("./pages/products/AttributeValueForm"));
const ProductLabelsList = React.lazy(() => import("./pages/products/ProductLabelsList"));
const ProductLabelForm = React.lazy(() => import("./pages/products/ProductLabelForm"));
const ProductVariantsList = React.lazy(() => import("./pages/products/ProductVariantsList"));
const ProductVariantForm = React.lazy(() => import("./pages/products/ProductVariantForm"));
const ProductDetailsPage = React.lazy(() => import("./pages/products/ProductDetailsPage"));
const ProductDataSheetsList = React.lazy(() => import("./pages/products/ProductDataSheetsList"));
const VariantDetailsPage = React.lazy(() => import("./pages/products/VariantDetailsPage"));
const DetailFieldsList = React.lazy(() => import("./pages/details/DetailFieldsList"));
const DetailFieldForm = React.lazy(() => import("./pages/details/DetailFieldForm"));
const MediaLibraryList = React.lazy(() => import("./pages/details/MediaLibraryList"));

// Masters — Projects
const ProjectsList = React.lazy(() => import("./pages/masters/ProjectsList"));
const ProjectsForm = React.lazy(() => import("./pages/masters/ProjectsForm"));

// Site Settings — Banners
const BannersList = React.lazy(
  () => import("./pages/siteSettings/BannersList"),
);
const BannersForm = React.lazy(
  () => import("./pages/siteSettings/BannersForm"),
);

// Site Settings — Footer Media
const FooterMediaList = React.lazy(
  () => import("./pages/siteSettings/FooterMediaList"),
);
const FooterMediaForm = React.lazy(
  () => import("./pages/siteSettings/FooterMediaForm"),
);

// Home pages that exist
// convert all imports to lazy loading using React.lazy and Suspense

const HomeCmsForm = React.lazy(() => import("./pages/home/HomeCmsForm"));

// Home - Testimonials
const HomeTestimonialsList = React.lazy(() => import("./pages/home/HomeTestimonialsList"));
const HomeTestimonialsForm = React.lazy(() => import("./pages/home/HomeTestimonialsForm"));

// Home - Side Images
const HomeSideImagesList = React.lazy(() => import("./pages/home/HomeSideImagesList"));
const HomeSideImagesForm = React.lazy(() => import("./pages/home/HomeSideImagesForm"));

// Home — Banner
const HomeBannerList = React.lazy(() => import("./pages/home/HomeBannerList"));
const HomeBannerForm = React.lazy(() => import("./pages/home/HomeBannerForm"));

// Home - Brands
const HomeBrandsList = React.lazy(() => import("./pages/home/HomeBrandsList"));
const HomeBrandsForm = React.lazy(() => import("./pages/home/HomeBrandsForm"));

// About — CMS
const AboutCmsForm = React.lazy(() => import("./pages/about/AboutCmsForm"));

// About — Core Values
const CoreValuesList = React.lazy(() => import("./pages/about/CoreValuesList"));
const CoreValuesForm = React.lazy(() => import("./pages/about/CoreValuesForm"));

// About — History
const HistoryList = React.lazy(() => import("./pages/about/HistoryList"));
const HistoryForm = React.lazy(() => import("./pages/about/HistoryForm"));

// About — Industries
const AboutIndustriesList = React.lazy(() => import("./pages/about/AboutIndustriesList"));
const AboutIndustriesForm = React.lazy(() => import("./pages/about/AboutIndustriesForm"));

// About — Messages
const MessagesList = React.lazy(() => import("./pages/about/MessagesList"));
const MessagesForm = React.lazy(() => import("./pages/about/MessagesForm"));

// Common Items — Content, Our Features, How It Works
const CommonContentForm = React.lazy(() => import("./pages/common/CommonContentForm"));
const CommonFeaturesList = React.lazy(() => import("./pages/common/CommonFeaturesList"));
const CommonFeaturesForm = React.lazy(() => import("./pages/common/CommonFeaturesForm"));
const CommonHowItWorksList = React.lazy(() => import("./pages/common/CommonHowItWorksList"));
const CommonHowItWorksForm = React.lazy(() => import("./pages/common/CommonHowItWorksForm"));

// Common Items — Milestones
const CommonMilestonesList = React.lazy(
  () => import("./pages/common/CommonMilestonesList"),
);
const CommonMilestonesForm = React.lazy(
  () => import("./pages/common/CommonMilestonesForm"),
);

// Contact — CMS
const ContactCmsForm = React.lazy(() => import("./pages/contact/ContactCmsForm"));
const CategoryCmsForm = React.lazy(() => import("./pages/products/CategoryCmsForm"));
const BlogList = React.lazy(() => import("./pages/blogs/BlogList"));
const BlogForm = React.lazy(() => import("./pages/blogs/BlogForm"));
const BlogTagList = React.lazy(() => import("./pages/blogs/BlogTagList"));
const BlogTagForm = React.lazy(() => import("./pages/blogs/BlogTagForm"));
const BlogCmsForm = React.lazy(() => import("./pages/blogs/BlogCmsForm"));

// Policies — Privacy Policy CMS
const PrivacyPolicyForm = React.lazy(() => import("./pages/policies/PrivacyPolicyForm"));

// Seasonal Offer popup CMS
const SeasonalOfferForm = React.lazy(() => import("./pages/seasonalOffer/SeasonalOfferForm"));

// Contact — Connections
const ConnectionsList = React.lazy(() => import("./pages/contact/ConnectionsList"));
const ConnectionsForm = React.lazy(() => import("./pages/contact/ConnectionsForm"));

// Contact Enquiries — read-only, no create/edit (submissions come from the public site)
const ContactEnquiryList = React.lazy(() => import("./pages/enquiries/ContactEnquiryList"));
const ContactEnquiryView = React.lazy(() => import("./pages/enquiries/ContactEnquiryView"));
const SampleRequestList = React.lazy(() => import("./pages/enquiries/SampleRequestList"));
const SampleRequestView = React.lazy(() => import("./pages/enquiries/SampleRequestView"));
const DownloadRequestList = React.lazy(() => import("./pages/enquiries/DownloadRequestList"));
const DownloadRequestView = React.lazy(() => import("./pages/enquiries/DownloadRequestView"));
const QuoteRequestList = React.lazy(() => import("./pages/enquiries/QuoteRequestList"));
const QuoteRequestView = React.lazy(() => import("./pages/enquiries/QuoteRequestView"));

// Downloads
const DownloadList = React.lazy(() => import("./pages/downloads/DownloadList"));
const DownloadForm = React.lazy(() => import("./pages/downloads/DownloadForm"));

// Bulk Upload
const BulkUploadHome = React.lazy(() => import("./pages/bulkUpload/BulkUploadHome"));
const CategoriesBulkUpload = React.lazy(() => import("./pages/bulkUpload/CategoriesBulkUpload"));
const AttributesBulkUpload = React.lazy(() => import("./pages/bulkUpload/AttributesBulkUpload"));
const AttributeValuesBulkUpload = React.lazy(() => import("./pages/bulkUpload/AttributeValuesBulkUpload"));
const MediaBulkUpload = React.lazy(() => import("./pages/bulkUpload/MediaBulkUpload"));
const ProductsBulkUpload = React.lazy(() => import("./pages/bulkUpload/ProductsBulkUpload"));
const ProductVariantsBulkUpload = React.lazy(() => import("./pages/bulkUpload/ProductVariantsBulkUpload"));
const ProductMainBulkUpload = React.lazy(() => import("./pages/bulkUpload/ProductMainBulkUpload"));

const queryClient = new QueryClient();
// Protected Route Component

const adminOnlyAccessRoutes = ["/users", "/users/create", "/users/edit/:id"];

// Layout route: renders once and stays mounted while only the matched child
// route's element swaps inside DashboardLayout's <Outlet /> — this is what
// keeps the sidebar/header from remounting on every navigation.
function ProtectedRoute() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  const isAdminRoute = adminOnlyAccessRoutes.some(
    (route) =>
      location.pathname === route || location.pathname.startsWith(`${route}/`),
  );
  // only admin can access the route
  if (isAdminRoute && role !== "admin") {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <DashboardLayout />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <NuqsAdapter defaultOptions={{ shallow: false }}>
          <AuthProvider>
            <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />

              {/* HOME */}
              <Route path="/home-cms" element={<HomeCmsForm />} />

              {/* Home Banner Routes */}
              <Route path="/home-banner" element={<HomeBannerList />} />
              <Route path="/home-banner/new" element={<HomeBannerForm />} />
              <Route
                path="/home-banner/:id/edit"
                element={<HomeBannerForm />}
              />

              {/* Home Brands */}
              <Route path="/home-brands" element={<HomeBrandsList />} />
              <Route path="/home-brands/new" element={<HomeBrandsForm />} />
              <Route path="/home-brands/:id/edit" element={<HomeBrandsForm />} />

              {/* Home Testimonials */}
              <Route path="/home-testimonials" element={<HomeTestimonialsList />} />
              <Route path="/home-testimonials/new" element={<HomeTestimonialsForm />} />
              <Route path="/home-testimonials/:id/edit" element={<HomeTestimonialsForm />} />

              {/* Home Side Images */}
              <Route path="/home-side-images" element={<HomeSideImagesList />} />
              <Route path="/home-side-images/new" element={<HomeSideImagesForm />} />
              <Route path="/home-side-images/:id/edit" element={<HomeSideImagesForm />} />

              {/* About CMS */}
              <Route path="/about-cms" element={<AboutCmsForm />} />

              {/* About Core Values */}
              <Route path="/about-core-values" element={<CoreValuesList />} />
              <Route path="/about-core-values/new" element={<CoreValuesForm />} />
              <Route
                path="/about-core-values/:id/edit"
                element={<CoreValuesForm />}
              />

              {/* About History */}
              <Route path="/about-history" element={<HistoryList />} />
              <Route path="/about-history/new" element={<HistoryForm />} />
              <Route path="/about-history/:id/edit" element={<HistoryForm />} />

              {/* About Industries */}
              <Route path="/about-industries" element={<AboutIndustriesList />} />
              <Route path="/about-industries/new" element={<AboutIndustriesForm />} />
              <Route path="/about-industries/:id/edit" element={<AboutIndustriesForm />} />

              {/* About Messages */}
              <Route path="/about-messages" element={<MessagesList />} />
              <Route path="/about-messages/new" element={<MessagesForm />} />
              <Route path="/about-messages/:id/edit" element={<MessagesForm />} />

              {/* Common Items — Content */}
              <Route path="/common-content" element={<CommonContentForm />} />

              {/* Common Items — Our Features */}
              <Route path="/common-features" element={<CommonFeaturesList />} />
              <Route path="/common-features/new" element={<CommonFeaturesForm />} />
              <Route path="/common-features/:id/edit" element={<CommonFeaturesForm />} />

              {/* Common Items — How It Works */}
              <Route path="/common-how-it-works" element={<CommonHowItWorksList />} />
              <Route path="/common-how-it-works/new" element={<CommonHowItWorksForm />} />
              <Route path="/common-how-it-works/:id/edit" element={<CommonHowItWorksForm />} />

              {/* Common Items — Milestones */}
              <Route path="/milestones" element={<CommonMilestonesList />} />
              <Route path="/milestones/new" element={<CommonMilestonesForm />} />
              <Route path="/milestones/:id/edit" element={<CommonMilestonesForm />} />

              {/* Blogs */}
              <Route path="/blogs" element={<BlogList />} />
              <Route path="/blogs/new" element={<BlogForm />} />
              <Route path="/blogs/:id/edit" element={<BlogForm />} />
              <Route path="/blog-tags" element={<BlogTagList />} />
              <Route path="/blog-tags/new" element={<BlogTagForm />} />
              <Route path="/blog-tags/:id/edit" element={<BlogTagForm />} />
              <Route path="/blog-cms" element={<BlogCmsForm />} />

              {/* Categories page CMS */}
              <Route path="/category-cms" element={<CategoryCmsForm />} />

              {/* Contact CMS */}
              <Route path="/contact-cms" element={<ContactCmsForm />} />

              {/* Privacy Policy CMS */}
              <Route path="/privacy-policy" element={<PrivacyPolicyForm />} />

              {/* Seasonal Offer popup CMS */}
              <Route path="/seasonal-offer" element={<SeasonalOfferForm />} />

              {/* Contact Connections */}
              <Route path="/contact-connections" element={<ConnectionsList />} />
              <Route path="/contact-connections/new" element={<ConnectionsForm />} />
              <Route
                path="/contact-connections/:id/edit"
                element={<ConnectionsForm />}
              />

              {/* Faqs Routes */}
              <Route path="/faqs" element={<FaqsList />} />
              <Route path="/faqs/new" element={<FaqsForm />} />
              <Route path="/faqs/:id/edit" element={<FaqsForm />} />

              {/* Industry Routes */}
              <Route path="/industry" element={<IndustryList />} />
              <Route path="/industry/new" element={<IndustryForm />} />
              <Route path="/industry/:id/edit" element={<IndustryForm />} />

              {/* Materials Routes */}
              <Route path="/materials" element={<MaterialsList />} />
              <Route path="/materials/new" element={<MaterialsForm />} />
              <Route path="/materials/:id/edit" element={<MaterialsForm />} />

              {/* Work Plan Routes */}
              <Route path="/work-plans" element={<WorkPlanList />} />
              <Route path="/work-plans/new" element={<WorkPlanForm />} />
              <Route path="/work-plans/:id/edit" element={<WorkPlanForm />} />

              {/* Service Routes */}
              <Route path="/services" element={<ServiceList />} />
              <Route path="/services/new" element={<ServiceForm />} />
              <Route path="/services/:id/edit" element={<ServiceForm />} />

              {/* Service CMS */}
              <Route path="/service-cms" element={<ServiceCmsForm />} />

              {/* Process Step Routes */}
              <Route path="/process-steps" element={<ProcessStepList />} />
              <Route path="/process-steps/new" element={<ProcessStepForm />} />
              <Route
                path="/process-steps/:id/edit"
                element={<ProcessStepForm />}
              />

              {/* Our Features Routes */}
              <Route path="/our-features" element={<OurFeaturesList />} />
              <Route path="/our-features/new" element={<OurFeaturesForm />} />
              <Route
                path="/our-features/:id/edit"
                element={<OurFeaturesForm />}
              />

              {/* Ads Banner Routes */}
              <Route path="/ads-banner" element={<AdsBannerList />} />
              <Route path="/ads-banner/new" element={<AdsBannerForm />} />
              <Route
                path="/ads-banner/:id/edit"
                element={<AdsBannerForm />}
              />

              {/* Product Category Routes */}
              <Route path="/product-categories" element={<ProductCategoryList />} />
              <Route path="/product-categories/new" element={<ProductCategoryForm />} />
              <Route path="/product-categories/:id/edit" element={<ProductCategoryForm />} />

              {/* Product Highlight Routes */}
              <Route path="/product-highlights" element={<ProductHighlightList />} />
              <Route path="/product-highlights/new" element={<ProductHighlightForm />} />
              <Route path="/product-highlights/:id/edit" element={<ProductHighlightForm />} />

              {/* Products Routes */}
              <Route path="/products" element={<ProductsList />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/:id/edit" element={<ProductForm />} />
              <Route path="/products/:productId/media" element={<ProductMediaList />} />
              <Route path="/products/:productId/media/new" element={<ProductMediaForm />} />
              <Route path="/products/:productId/media/:id/edit" element={<ProductMediaForm />} />
              <Route path="/products/:productId/variants" element={<ProductVariantsList />} />
              <Route path="/products/:productId/variants/new" element={<ProductVariantForm />} />
              <Route path="/products/:productId/variants/:id/edit" element={<ProductVariantForm />} />
              <Route path="/products/:productId/details" element={<ProductDetailsPage />} />
              <Route path="/products/:productId/variants/:variantId/details" element={<VariantDetailsPage />} />

              {/* Detail Field Routes (dynamic content-block master list) */}
              <Route path="/details/fields" element={<DetailFieldsList />} />
              <Route path="/details/fields/new" element={<DetailFieldForm />} />
              <Route path="/details/fields/:id/edit" element={<DetailFieldForm />} />
              <Route path="/details/media" element={<MediaLibraryList />} />

              {/* Attribute Routes */}
              <Route path="/attributes" element={<AttributesList />} />
              <Route path="/attributes/new" element={<AttributeForm />} />
              <Route path="/attributes/:id/edit" element={<AttributeForm />} />

              {/* Attribute Value Routes */}
              <Route path="/attribute-values" element={<AttributeValuesList />} />
              <Route path="/attribute-values/new" element={<AttributeValueForm />} />
              <Route path="/attribute-values/:id/edit" element={<AttributeValueForm />} />

              {/* Product Label Routes (features / tags / specifications) */}
              <Route path="/data-sheets" element={<ProductDataSheetsList />} />
              <Route path="/product-labels" element={<ProductLabelsList />} />
              <Route path="/product-labels/new" element={<ProductLabelForm />} />
              <Route path="/product-labels/:id/edit" element={<ProductLabelForm />} />

              {/* Projects Routes */}
              <Route path="/projects" element={<ProjectsList />} />
              <Route path="/projects/new" element={<ProjectsForm />} />
              <Route path="/projects/:id/edit" element={<ProjectsForm />} />

              {/* Contact Enquiries Routes — list + view only, no new/edit */}
              <Route path="/enquiries" element={<ContactEnquiryList />} />
              <Route path="/enquiries/:id" element={<ContactEnquiryView />} />
              <Route path="/sample-requests" element={<SampleRequestList />} />
              <Route path="/sample-requests/:id" element={<SampleRequestView />} />
              <Route path="/download-requests" element={<DownloadRequestList />} />
              <Route path="/download-requests/:id" element={<DownloadRequestView />} />
              <Route path="/quote-requests" element={<QuoteRequestList />} />
              <Route path="/quote-requests/:id" element={<QuoteRequestView />} />

              {/* Downloads */}
              <Route path="/downloads" element={<DownloadList />} />
              <Route path="/downloads/new" element={<DownloadForm />} />
              <Route path="/downloads/:id/edit" element={<DownloadForm />} />

              {/* Bulk Upload Routes */}
              <Route path="/bulk-upload" element={<BulkUploadHome />} />
              <Route path="/bulk-upload/categories" element={<CategoriesBulkUpload />} />
              <Route path="/bulk-upload/attributes" element={<AttributesBulkUpload />} />
              <Route path="/bulk-upload/attribute-values" element={<AttributeValuesBulkUpload />} />
              <Route path="/bulk-upload/media" element={<MediaBulkUpload />} />
              <Route path="/bulk-upload/products" element={<ProductsBulkUpload />} />
              <Route path="/bulk-upload/product-variants" element={<ProductVariantsBulkUpload />} />
              <Route path="/bulk-upload/product-main" element={<ProductMainBulkUpload />} />

              {/* Site Settings Route */}
              <Route path="/site-settings" element={<SiteSettingsForm />} />

              {/* Social Media Routes */}
              <Route path="/social-media" element={<SocialMediaList />} />
              <Route path="/social-media/new" element={<SocialMediaForm />} />
              <Route
                path="/social-media/:id/edit"
                element={<SocialMediaForm />}
              />

              {/* Floating Icons Routes */}
              <Route path="/floating-icons" element={<FloatingIconList />} />
              <Route
                path="/floating-icons/new"
                element={<FloatingIconForm />}
              />
              <Route
                path="/floating-icons/:id/edit"
                element={<FloatingIconForm />}
              />

              {/* Pages Routes */}
              <Route path="/pages" element={<PagesList />} />
              <Route path="/pages/new" element={<PagesForm />} />
              <Route path="/pages/:id/edit" element={<PagesForm />} />

              {/* Banners Routes */}
              <Route path="/banners" element={<BannersList />} />
              <Route path="/banners/new" element={<BannersForm />} />
              <Route path="/banners/:id/edit" element={<BannersForm />} />

              {/* Footer Media Routes */}
              <Route path="/footer-media" element={<FooterMediaList />} />
              <Route
                path="/footer-media/new"
                element={<FooterMediaForm />}
              />
              <Route
                path="/footer-media/:id/edit"
                element={<FooterMediaForm />}
              />

              {/* Meta Tags Routes */}
              <Route path="/meta-tags" element={<MetaTagsList />} />
              <Route path="/meta-tags/new" element={<MetaTagsForm />} />
              <Route path="/meta-tags/:id/edit" element={<MetaTagsForm />} />

              {/* Users */}
              <Route path="/users" element={<UsersList />} />
              {/* create user */}
              <Route path="/users/create" element={<UsersForm />} />
              {/* edit user */}
              <Route path="/users/edit/:id" element={<UsersForm />} />
            </Route>

            {/* Catch all route - must be last */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </NuqsAdapter>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
