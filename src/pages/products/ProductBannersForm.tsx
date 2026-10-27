import { useState, useEffect } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  FormSwitchField,
  FormTextField,
} from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchProductBannerById,
  fetchProductBannersList,
  createProductBanner,
  updateProductBanner,
  ApiError,
} from "@/services/products/productBannerApi";
import { fetchActiveProducts } from "@/services/products/productsApi";
import {
  productBannerSchema,
  ProductBannerFormData,
} from "@/schemas/productBannerSchema";

export default function ProductBannersForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [products, setProducts] = useState<ComboboxOption[]>([]);

  const form = useForm<ProductBannerFormData>({
    resolver: zodResolver(productBannerSchema),
    defaultValues: {
      // deep link from a product context pre-selects that product
      product_id: searchParams.get("product_id") || "",
      title: "",
      title_ar: "",
      sub_title: "",
      sub_title_ar: "",
      media_alt: "",
      media_alt_ar: "",
      media_path: "",
      is_active: true,
    },
  });

  // One banner per product (unique `product_id` on the server): products that
  // already have a banner are left out of the picker, except the one being edited.
  useEffect(() => {
    const loadProductOptions = async () => {
      try {
        const [activeProducts, bannersRes] = await Promise.all([
          fetchActiveProducts(),
          fetchProductBannersList(1, 1000, undefined, ["id", "product_id"]),
        ]);

        const currentId = isEditing && id ? parseInt(id) : null;
        const usedProductIds = new Set(
          bannersRes.data.data
            .filter((banner) => banner.id !== currentId)
            .map((banner) => banner.product_id),
        );

        setProducts(
          activeProducts.data
            .filter((p) => !usedProductIds.has(p.id))
            .map((p) => ({ value: String(p.id), label: p.title })),
        );
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof ApiError
              ? error.message
              : "Failed to load products",
          variant: "destructive",
        });
      }
    };
    loadProductOptions();
  }, [id, isEditing, toast]);

  useEffect(() => {
    if (isEditing && id) {
      loadBannerData(parseInt(id));
    }
  }, [id, isEditing]);

  const loadBannerData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const response = await fetchProductBannerById(itemId);
      const data = response.data;

      form.reset({
        product_id: data.product_id ? String(data.product_id) : "",
        title: data.title || "",
        title_ar: data.title_ar || "",
        sub_title: data.sub_title || "",
        sub_title_ar: data.sub_title_ar || "",
        media_alt: data.media_alt || "",
        media_alt_ar: data.media_alt_ar || "",
        media_path: data.media_path || "",
        is_active: data.is_active,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : "Failed to load product banner",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: ProductBannerFormData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("product_id", data.product_id);
      formData.append("title", data.title);
      formData.append("title_ar", data.title_ar);
      formData.append("sub_title", data.sub_title);
      formData.append("sub_title_ar", data.sub_title_ar);
      formData.append("media_alt", data.media_alt);
      formData.append("media_alt_ar", data.media_alt_ar);
      formData.append("is_active", String(data.is_active));

      // multerMiddleware only keeps a text media-path value if it's a fresh upload or an
      // absolute `https?://<host>/uploads/...` URL, so an unchanged existing (relative)
      // path must be resent as an absolute URL.
      const value = data.media_path as File | string;
      if (value instanceof File || /^https?:\/\//.test(value)) {
        formData.append("media_path", value);
      } else {
        formData.append(
          "media_path",
          `${import.meta.env.VITE_IMAGE_URL}/${value}`,
        );
      }

      if (isEditing && id) {
        await updateProductBanner(parseInt(id), formData);
        toast({
          title: "Success",
          description: "Product banner updated successfully",
        });
      } else {
        await createProductBanner(formData);
        toast({
          title: "Success",
          description: "Product banner created successfully",
        });
      }

      navigate("/product-banners");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditing ? "update" : "create"} product banner`,
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
          onClick={() => navigate("/product-banners")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit" : "Add"} Product Banner
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update" : "Create"} the banner shown at the top of a
            product's detail page
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
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <FormControl>
                      <Combobox
                        options={products}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select a product"
                        searchPlaceholder="Search products..."
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

              <FormSwitchField
                form={form}
                name="is_active"
                label="Active"
                description="When off, the product page shows the default banner"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/product-banners")}
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
