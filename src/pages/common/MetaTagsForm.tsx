import { useState, useEffect, useMemo } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormTextField, FormTextareaField, FormKeywordsField } from "@/components/forms/FormFieldComponents";
import { useToast } from "@/hooks/use-toast";
import { fetchMetaTagById, fetchMetaTagsList, createMetaTag, updateMetaTag, MetaTag } from "@/services/common/metaTagsApi";
import { fetchActiveProducts } from "@/services/products/productsApi";
import { fetchActiveProductVariants } from "@/services/products/productVariantsApi";
import { fetchActiveBlogs } from "@/services/common/blogsApi";
import { fetchActiveProjects } from "@/services/masters/projectsApi";
import { PAGE_NAMES, pageLabel } from "@/constants/pagenames";

const METATAG_TYPES = [
  { value: "page", label: "Page" },
  { value: "product", label: "Product" },
  { value: "product-variant", label: "Product Variant" },
  { value: "blog", label: "Blog" },
  { value: "project", label: "Project" },
];

const metaTagSchema = z
  .object({
    type: z.string().min(1, "Type is required"),

    page_name: z.string().optional().nullable(),
    product_id: z.string().optional().nullable(),
    variant_id: z.string().optional().nullable(),
    blog_id: z.string().optional().nullable(),
    project_id: z.string().optional().nullable(),

    meta_title: z.string().min(1, "Meta title is required").max(60, "Meta title should be under 60 characters"),

    meta_title_ar: z.string().min(1, "Arabic meta title is required").max(60, "Arabic meta title should be under 60 characters"),

    meta_description: z.string().min(1, "Meta description is required").max(160, "Meta description should be under 160 characters"),

    meta_description_ar: z.string().min(1, "Arabic meta description is required").max(160, "Arabic meta description should be under 160 characters"),

    meta_keywords: z.string().min(1, "Meta keywords is required").max(255, "Meta keywords should be under 255 characters"),

    meta_keywords_ar: z.string().min(1, "Arabic meta keywords is required").max(255, "Arabic meta keywords should be under 255 characters"),

    other_meta: z.string().optional().nullable(),
    other_meta_ar: z.string().optional().nullable(),
  })
  .superRefine((values, ctx) => {
    // Exactly one target must be set, matching the chosen type.
    if (values.type === "page" && !values.page_name) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["page_name"], message: "Please select a page" });
    }
    if (values.type === "product" && !values.product_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["product_id"], message: "Please select a product" });
    }
    if (values.type === "product-variant" && !values.variant_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["variant_id"], message: "Please select a product variant" });
    }
    if (values.type === "blog" && !values.blog_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blog_id"], message: "Please enter a blog slug" });
    }
    if (values.type === "project" && !values.project_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["project_id"], message: "Please select a project" });
    }
  });

type MetaTagFormData = z.infer<typeof metaTagSchema>;

export default function MetaTagsForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  // Deep-links (the "SEO Meta" buttons and filtered list rows) pre-select and
  // lock the target so a single click lands on the exact record.
  const urlType = searchParams.get("type") || undefined;
  const urlPageName = searchParams.get("page_name") || undefined;
  const urlProductId = searchParams.get("product_id") || undefined;
  const urlVariantId = searchParams.get("variant_id") || undefined;
  const urlBlogId = searchParams.get("blog_id") || undefined;
  const urlProjectId = searchParams.get("project_id") || undefined;

  const lockType = isEditing || Boolean(urlType);
  const lockPage = isEditing || (urlType === "page" && Boolean(urlPageName));
  const lockProduct = isEditing || (urlType === "product" && Boolean(urlProductId));
  const lockVariant = isEditing || (urlType === "product-variant" && Boolean(urlVariantId));
  const lockBlog = isEditing || (urlType === "blog" && Boolean(urlBlogId));
  const lockProject = isEditing || (urlType === "project" && Boolean(urlProjectId));

  const [loading, setLoading] = useState(false);
  const hasDeepLinkTarget = Boolean(
    urlType && (urlPageName || urlProductId || urlVariantId || urlBlogId || urlProjectId),
  );
  const [initialLoading, setInitialLoading] = useState(isEditing || hasDeepLinkTarget);
  const [metaTag, setMetaTag] = useState<MetaTag | null>(null);
  const [productOptions, setProductOptions] = useState<{ value: string; label: string }[]>([]);
  const [variantOptions, setVariantOptions] = useState<{ value: string; label: string }[]>([]);
  const [blogOptions, setBlogOptions] = useState<{ value: string; label: string }[]>([]);
  const [projectOptions, setProjectOptions] = useState<{ value: string; label: string }[]>([]);

  const form = useForm<MetaTagFormData>({
    resolver: zodResolver(metaTagSchema),
    defaultValues: {
      type: urlType || "page",
      page_name: urlPageName || "",
      product_id: urlProductId || "",
      variant_id: urlVariantId || "",
      blog_id: urlBlogId || "",
      project_id: urlProjectId || "",
      meta_title: "",
      meta_title_ar: "",
      meta_description: "",
      meta_description_ar: "",
      meta_keywords: "",
      meta_keywords_ar: "",
      other_meta: "",
      other_meta_ar: "",
    },
  });

  const pageOptions = useMemo(() => PAGE_NAMES.map((page) => ({ value: page.slug, label: page.label })), []);

  useEffect(() => {
    fetchActiveProducts()
      .then((res) => setProductOptions(res.data.map((product) => ({ value: String(product.id), label: product.title }))))
      .catch(() => setProductOptions([]));
    fetchActiveProductVariants()
      .then((res) =>
        setVariantOptions(
          res.data.map((variant) => ({
            value: String(variant.id),
            // Labels repeat across products, so show the parent product too.
            label: variant.product?.title ? `${variant.label} — ${variant.product.title}` : variant.label,
          })),
        ),
      )
      .catch(() => setVariantOptions([]));
    fetchActiveBlogs()
      .then((res) => setBlogOptions(res.data.map((blog) => ({ value: blog.id, label: blog.id }))))
      .catch(() => setBlogOptions([]));
    fetchActiveProjects()
      .then((res) => setProjectOptions(res.data.map((project) => ({ value: String(project.id), label: project.title }))))
      .catch(() => setProjectOptions([]));
  }, []);

  // Deep-linked "add" with a target that already has meta data: jump to its
  // edit screen so the saved values prefill instead of creating a duplicate.
  useEffect(() => {
    if (isEditing || !hasDeepLinkTarget) return;
    let cancelled = false;
    fetchMetaTagsList(1, 1, undefined, {
      type: urlType,
      page_name: urlPageName,
      product_id: urlProductId ? Number(urlProductId) : undefined,
      variant_id: urlVariantId ? Number(urlVariantId) : undefined,
      blog_id: urlBlogId,
      project_id: urlProjectId ? Number(urlProjectId) : undefined,
    })
      .then((res) => {
        if (cancelled) return;
        const existing = res.data?.data?.[0];
        if (existing) {
          navigate(`/meta-tags/${existing.id}/edit${entryQuery}`, { replace: true });
        } else {
          setInitialLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (id) loadMetaTag(parseInt(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMetaTag = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const response = await fetchMetaTagById(itemId);
      const data = response.data;

      if (data) {
        setMetaTag(data);
        form.reset({
          type: data.type || "page",
          page_name: data.page_name || "",
          product_id: data.product_id ? String(data.product_id) : "",
          variant_id: data.variant_id ? String(data.variant_id) : "",
          blog_id: data.blog_id || "",
          project_id: data.project_id ? String(data.project_id) : "",
          meta_title: data.meta_title || "",
          meta_title_ar: data.meta_title_ar || "",
          meta_description: data.meta_description || "",
          meta_description_ar: data.meta_description_ar || "",
          meta_keywords: data.meta_keywords || "",
          meta_keywords_ar: data.meta_keywords_ar || "",
          other_meta: data.other_meta || "",
          other_meta_ar: data.other_meta_ar || "",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load meta tag data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const watchedType = form.watch("type");
  const watchedPageName = form.watch("page_name");
  const watchedProductId = form.watch("product_id");
  const watchedVariantId = form.watch("variant_id");
  const watchedBlogId = form.watch("blog_id");
  const watchedProjectId = form.watch("project_id");

  const targetCaption = useMemo(() => {
    if (watchedType === "page") {
      return watchedPageName ? pageLabel(watchedPageName) || watchedPageName : "";
    }
    if (watchedType === "product") {
      return metaTag?.product?.title || watchedProductId || "";
    }
    if (watchedType === "product-variant") {
      return metaTag?.variant?.label || watchedVariantId || "";
    }
    if (watchedType === "blog") {
      return blogOptions.find((option) => option.value === watchedBlogId)?.label || watchedBlogId || "";
    }
    if (watchedType === "project") {
      return metaTag?.project?.title || watchedProjectId || "";
    }
    return "";
  }, [watchedType, watchedPageName, watchedProductId, watchedVariantId, watchedBlogId, watchedProjectId, blogOptions, metaTag]);

  // Return URL = the query params this form was opened with (deep-links from
  // product/variant screens, or the list's own filter) — NOT the current
  // selection, so picking a target then leaving doesn't glue its id/slug onto
  // the list URL.
  const entryQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (urlType) params.set("type", urlType);
    if (urlPageName) params.set("page_name", urlPageName);
    if (urlProductId) params.set("product_id", urlProductId);
    if (urlVariantId) params.set("variant_id", urlVariantId);
    if (urlBlogId) params.set("blog_id", urlBlogId);
    if (urlProjectId) params.set("project_id", urlProjectId);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [urlType, urlPageName, urlProductId, urlVariantId, urlBlogId, urlProjectId]);

  const onSubmit = async (data: MetaTagFormData) => {
    const payload = {
      type: data.type as "page" | "product" | "product-variant" | "blog" | "project",
      page_name: data.type === "page" && data.page_name ? data.page_name : null,
      product_id: data.type === "product" && data.product_id ? Number(data.product_id) : null,
      variant_id: data.type === "product-variant" && data.variant_id ? Number(data.variant_id) : null,
      blog_id: data.type === "blog" && data.blog_id ? data.blog_id.trim() : null,
      project_id: data.type === "project" && data.project_id ? Number(data.project_id) : null,
      meta_title: data.meta_title,
      meta_title_ar: data.meta_title_ar,
      meta_description: data.meta_description,
      meta_description_ar: data.meta_description_ar,
      meta_keywords: data.meta_keywords,
      meta_keywords_ar: data.meta_keywords_ar,
      other_meta: data.other_meta || "",
      other_meta_ar: data.other_meta_ar || "",
    };

    try {
      setLoading(true);
      if (isEditing && id) {
        await updateMetaTag(parseInt(id), payload);
        toast({ title: "Success", description: "Meta tag updated successfully" });
      } else {
        await createMetaTag(payload);
        toast({ title: "Success", description: "Meta tag created successfully" });
      }
      navigate(`/meta-tags${entryQuery}`);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditing ? "update" : "create"} meta tag`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const targetLabel = targetCaption || "—";

  if (initialLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/meta-tags${entryQuery}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? "Edit" : "Add"} Meta Tags</h1>
          <p className="text-muted-foreground">
            Target: <span className="font-medium">{targetLabel}</span>
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Target</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Combobox
                        maxVisibleItems={4}
                        autoWidth
                        options={METATAG_TYPES}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          // Clear the target fields not applicable to the type.
                          form.setValue("page_name", "");
                          form.setValue("product_id", "");
                          form.setValue("variant_id", "");
                          form.setValue("blog_id", "");
                          form.setValue("project_id", "");
                        }}
                        placeholder="Select a type"
                        disabled={lockType}
                      />
                    </FormControl>
                    <FormMessage />
                    {lockType && <p className="text-xs text-muted-foreground">Locked to this type.</p>}
                  </FormItem>
                )}
              />

              {watchedType === "page" && (
                <FormField
                  control={form.control}
                  name="page_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page</FormLabel>
                      <FormControl>
                        <Combobox
                          maxVisibleItems={7}
                          autoWidth
                          options={pageOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Select a page"
                          searchPlaceholder="Search pages..."
                          disabled={lockPage}
                        />
                      </FormControl>
                      <FormMessage />
                      {lockPage && <p className="text-xs text-muted-foreground">Locked to this page.</p>}
                    </FormItem>
                  )}
                />
              )}

              {watchedType === "blog" && (
                <FormField
                  control={form.control}
                  name="blog_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blog Post</FormLabel>
                      <FormControl>
                        <Combobox
                          maxVisibleItems={6}
                          autoWidth
                          options={blogOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Select a blog post"
                          searchPlaceholder="Search blog posts..."
                          disabled={lockBlog}
                        />
                      </FormControl>
                      <FormMessage />
                      {lockBlog && <p className="text-xs text-muted-foreground">Locked to this blog post.</p>}
                    </FormItem>
                  )}
                />
              )}

              {watchedType === "product" && (
                <FormField
                  control={form.control}
                  name="product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <FormControl>
                        <Combobox
                          maxVisibleItems={8}
                          autoWidth
                          options={productOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Select a product"
                          searchPlaceholder="Search products..."
                          disabled={lockProduct}
                        />
                      </FormControl>
                      <FormMessage />
                      {lockProduct && <p className="text-xs text-muted-foreground">Locked to this product.</p>}
                    </FormItem>
                  )}
                />
              )}

              {watchedType === "product-variant" && (
                <FormField
                  control={form.control}
                  name="variant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Variant</FormLabel>
                      <FormControl>
                        <Combobox
                          maxVisibleItems={8}
                          autoWidth
                          options={variantOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Select a variant"
                          searchPlaceholder="Search variants..."
                          disabled={lockVariant}
                        />
                      </FormControl>
                      <FormMessage />
                      {lockVariant && <p className="text-xs text-muted-foreground">Locked to this variant.</p>}
                    </FormItem>
                  )}
                />
              )}

              {watchedType === "project" && (
                <FormField
                  control={form.control}
                  name="project_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <FormControl>
                        <Combobox
                          maxVisibleItems={8}
                          autoWidth
                          options={projectOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Select a project"
                          searchPlaceholder="Search projects..."
                          disabled={lockProject}
                        />
                      </FormControl>
                      <FormMessage />
                      {lockProject && <p className="text-xs text-muted-foreground">Locked to this project.</p>}
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta Title</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextField form={form} name="meta_title" label="Meta Title" placeholder="Enter meta title (recommended: 50-60 characters)" />

                <FormTextField form={form} name="meta_title_ar" label="Meta Title (Arabic)" placeholder="أدخل عنوان الميتا (يفضل 50-60 حرفًا)" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextareaField
                  form={form}
                  name="meta_description"
                  label="Meta Description"
                  placeholder="Enter meta description (recommended: 150-160 characters)"
                  rows={3}
                />

                <FormTextareaField
                  form={form}
                  name="meta_description_ar"
                  label="Meta Description (Arabic)"
                  placeholder="أدخل وصف الميتا (يفضل 150-160 حرفًا)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormKeywordsField form={form} name="meta_keywords" label="Meta Keywords" placeholder="Type a keyword and press Enter" />

                <FormKeywordsField form={form} name="meta_keywords_ar" label="Meta Keywords (Arabic)" placeholder="اكتب كلمة مفتاحية واضغط" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Other Meta Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextareaField
                  form={form}
                  name="other_meta"
                  label="Other Meta (e.g. OG / Twitter tags)"
                  placeholder="Full <meta> tags or raw HTML — inserted as-is, one per line"
                />

                <FormTextareaField form={form} name="other_meta_ar" label="Other Meta (Arabic)" placeholder="وسوم إضافية (اختياري)" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(`/meta-tags${entryQuery}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
