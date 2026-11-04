import { useState, useEffect } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormFileUploadField,
  FormTextField,
} from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchBannerById,
  fetchBannersList,
  createBanner,
  updateBanner,
  ApiError,
} from "@/services/siteSettings/bannerApi";
import { fetchActivePages, PageRecord } from "@/services/masters/pagesApi";
import { BANNER_EXCLUDED_PAGE_SLUGS } from "@/constants/bannerPages";
import { bannerSchema, BannerFormData } from "@/schemas/bannerSchema";

export default function BannersForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  const form = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      page_id: "",
      title: "",
      title_ar: "",
      sub_title: "",
      sub_title_ar: "",
      media_alt: "",
      media_alt_ar: "",
      media_path: "",
    },
  });

  // Pages already assigned to another banner are excluded from the picker
  // (one banner per page, enforced here as well as by the server's unique
  // `page_id` FK) — the currently-edited banner's own page stays selectable
  // since its own row is excluded from the "used" set.
  useEffect(() => {
    loadPageOptions();
  }, [id]);

  const loadPageOptions = async () => {
    try {
      const [activePages, bannersRes] = await Promise.all([
        fetchActivePages(),
        fetchBannersList(1, 100, undefined, ["page_id"]),
      ]);

      const currentId = isEditing && id ? parseInt(id) : null;
      const usedPageIds = new Set(
        bannersRes.data.data
          .filter((banner) => banner.id !== currentId)
          .map((banner) => banner.page_id),
      );

      setPages(activePages.filter((page) => !usedPageIds.has(page.id)));
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error?.message : "Failed to load pages",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isEditing && id) {
      loadBannerData(parseInt(id));
    }
  }, [id, isEditing]);

  const loadBannerData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const response = await fetchBannerById(itemId);
      const data = response.data;

      setCurrentPageId(data.page_id ? String(data.page_id) : null);
      form.reset({
        page_id: data.page_id ? String(data.page_id) : "",
        title: data.title || "",
        title_ar: data.title_ar || "",
        sub_title: data.sub_title || "",
        sub_title_ar: data.sub_title_ar || "",
        media_alt: data.media_alt || "",
        media_alt_ar: data.media_alt_ar || "",
        media_path: data.media_path || "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : "Failed to load banner data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  // Only offer active pages, except the page already assigned to this banner
  // (in edit mode) so an existing, since-deactivated assignment still shows.
  const pageOptions: ComboboxOption[] = pages
    .filter((p) => !BANNER_EXCLUDED_PAGE_SLUGS.includes(p.page_slug))
    .filter((p) => p.is_active || String(p.id) === currentPageId)
    .map((p) => ({ value: String(p.id), label: p.page }));

  const onSubmit = async (data: BannerFormData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("page_id", data.page_id.toString());
      formData.append("title", data.title);
      formData.append("title_ar", data.title_ar);
      formData.append("sub_title", data.sub_title);
      formData.append("sub_title_ar", data.sub_title_ar);
      formData.append("media_alt", data.media_alt);
      formData.append("media_alt_ar", data.media_alt_ar);

      // multerMiddleware only keeps a text media-path value if it's a fresh upload or an
      // absolute `https?://<host>/uploads/...` URL, so an unchanged existing (relative)
      // path must be resent as an absolute URL.
      const appendMediaPath = (key: string, value: File | string) => {
        if (value instanceof File || /^https?:\/\//.test(value)) {
          formData.append(key, value);
        } else {
          formData.append(key, `${import.meta.env.VITE_IMAGE_URL}/${value}`);
        }
      };
      appendMediaPath("media_path", data.media_path);
      if (isEditing && id) {
        await updateBanner(parseInt(id), formData);
        toast({ title: "Success", description: "Banner updated successfully" });
      } else {
        await createBanner(formData);
        toast({ title: "Success", description: "Banner created successfully" });
      }

      navigate("/banners");
    } catch (error) {
      toast({
        title: "Error",
        description: error
          ? error.message
          : `Failed to ${isEditing ? "update" : "create"} banner`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/banners")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit" : "Add"} Banner
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update" : "Create a new"} banner
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Banner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="page_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page</FormLabel>
                    <FormControl>
                      <Combobox
                        options={pageOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select a page"
                        searchPlaceholder="Search pages..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextField
                  form={form}
                  name="title"
                  label="Title"
                  placeholder="Banner title"
                />

                <FormTextField
                  form={form}
                  name="title_ar"
                  label="Title (Arabic)"
                  placeholder="عنوان البانر"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextField
                  form={form}
                  name="sub_title"
                  label="Sub Title"
                  placeholder="Banner sub title"
                />

                <FormTextField
                  form={form}
                  name="sub_title_ar"
                  label="Sub Title (Arabic)"
                  placeholder="العنوان الفرعي للبانر"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextField
                  form={form}
                  name="media_alt"
                  label="Image Alt Text"
                  placeholder="Image alt text"
                />

                <FormTextField
                  form={form}
                  name="media_alt_ar"
                  label="Image Alt Text (Arabic)"
                  placeholder="النص البديل للصورة"
                />
              </div>

              <FormFileUploadField
                form={form}
                name="media_path"
                label="Image"
                placeholder="Upload banner image"
                accept="image/*"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/banners")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
