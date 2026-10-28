import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PageLoader from "@/components/layout/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import {
  FormTextField,
  FormFileUploadField,
} from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft, Tags } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchProductVariantById,
  createProductVariant,
  updateProductVariant,
  ApiError,
} from "@/services/products/productVariantsApi";
import { fetchProductById } from "@/services/products/productsApi";
import { fetchActiveAttributeValues } from "@/services/products/attributeValuesApi";
import { productVariantSchema, ProductVariantFormData } from "@/schemas/productVariantSchema";
import type { ProductAttributeOption } from "@/services/products/productsApi";
import type { AttributeValueOption } from "@/services/products/attributeValuesApi";
import BlogGalleryField, {
  BlogGalleryItem,
  appendGalleryToFormData,
  blogImagesToGalleryItems,
} from "@/components/blogs/BlogGalleryField";

const toComboboxOptions = (values: AttributeValueOption[]): ComboboxOption[] =>
  values.map((v) => ({
    value: String(v.id),
    label: v.value || v.value_ar || v.slug || `Value ${v.id}`,
  }));

export default function ProductVariantForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { productId: productIdParam, id } = useParams();
  const isEditing = Boolean(id);
  const productId = Number(productIdParam);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [productTitle, setProductTitle] = useState("");
  const [galleryItems, setGalleryItems] = useState<BlogGalleryItem[]>([]);
  const [attributes, setAttributes] = useState<ProductAttributeOption[]>([]);
  const [valuesByAttribute, setValuesByAttribute] = useState<
    Record<number, AttributeValueOption[]>
  >({});

  const nextSortOrder = (location.state as { nextSortOrder?: number } | null)?.nextSortOrder;

  const form = useForm<ProductVariantFormData>({
    resolver: zodResolver(productVariantSchema),
    defaultValues: {
      attribute_value_ids: [],
      label: "",
      label_ar: "",
      sku: "",
      media_path: "",
      media_alt: "",
      media_alt_ar: "",
      sort_order: nextSortOrder ? String(nextSortOrder) : "1",
      is_active: true,
    },
  });

  const errorToast = useCallback(
    (error: unknown, fallback: string) =>
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : fallback,
        variant: "destructive",
      }),
    [toast],
  );

  const applyFieldErrors = (error: unknown) => {
    if (!(error instanceof ApiError)) return;
    const fieldNames = Object.keys(form.getValues());
    error.fieldErrors.forEach(({ path, msg }) => {
      if (path && msg && fieldNames.includes(path)) {
        form.setError(path as keyof ProductVariantFormData, {
          type: "server",
          message: msg,
        });
      }
    });
  };

  useEffect(() => {
    if (!Number.isInteger(productId) || productId <= 0) {
      navigate("/products", { replace: true });
      return;
    }
    setInitialLoading(true);
    Promise.all([fetchProductById(productId), fetchActiveAttributeValues()])
      .then(([productRes, valuesRes]) => {
        setProductTitle(productRes.data.title || "");
        const attrs = productRes.data.attributes || [];
        const grouped: Record<number, AttributeValueOption[]> = {};
        attrs.forEach((attr) => {
          grouped[attr.id] = valuesRes.data.filter((v) => v.attribute_id === attr.id);
        });
        setAttributes(attrs);
        setValuesByAttribute(grouped);
      })
      .catch((error) => {
        errorToast(error, "Failed to load product attributes");
        navigate(`/products/${productId}/variants`, { replace: true });
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [productId, navigate, errorToast]);

  useEffect(() => {
    if (!isEditing || !id) return;
    setInitialLoading(true);
    fetchProductVariantById(Number(id))
      .then(({ data }) => {
        const values = (data.valueLinks || []).map((l) => String(l.attribute_value_id));
        setGalleryItems(blogImagesToGalleryItems(data.images));
        form.reset({
          attribute_value_ids: values,
          sku: data.sku || "",
          media_path: data.media_path || "",
          media_alt: data.media_alt || "",
          media_alt_ar: data.media_alt_ar || "",
          sort_order: (data.sort_order ?? 1).toString(),
          is_active: data.is_active ?? true,
        });
      })
      .catch((error) => {
        errorToast(error, "Failed to load variant");
        navigate(`/products/${productId}/variants`, { replace: true });
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [id, isEditing, productId, navigate, form, errorToast]);

  const onSubmit = async (data: ProductVariantFormData) => {
    // Require one value for every attribute before saving.
    if (attributes.length && (data.attribute_value_ids || []).length < attributes.length) {
      form.setError("attribute_value_ids", {
        type: "server",
        message: "Select a value for each attribute",
      });
      return;
    }
    try {
      setLoading(true);
      const { media_path, sort_order, is_active, ...rest } = data;
      const formData = new FormData();
      Object.entries(rest).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      formData.append("product_id", String(productId));
      formData.append("sort_order", (sort_order || "1").toString());
      formData.append("is_active", (is_active ?? true).toString());
      appendGalleryToFormData(formData, galleryItems);

      if (media_path instanceof File) {
        formData.append("media_path", media_path);
      } else if (typeof media_path === "string") {
        formData.append("media_path", media_path);
      }

      if (isEditing && id) {
        await updateProductVariant(Number(id), formData);
        toast({ title: "Success", description: "Variant updated successfully" });
      } else {
        await createProductVariant(formData);
        toast({ title: "Success", description: "Variant created successfully" });
      }
      navigate(`/products/${productId}/variants`);
    } catch (error) {
      applyFieldErrors(error);
      errorToast(error, `Failed to ${isEditing ? "update" : "create"} variant`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/products/${productId}/variants`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edit" : "Add"} Variant {productTitle ? `— ${productTitle}` : ""}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Update variant configuration" : "Create an option combination"}
            </p>
          </div>
        </div>
        {isEditing && id && (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/meta-tags?type=product-variant&variant_id=${id}`)}
          >
            <Tags className="mr-2 h-4 w-4" />
            SEO Meta
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Combination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="attribute_value_ids"
                render={() => (
                  <FormItem className="space-y-4">
                    {attributes.length ? (
                      attributes.map((attr) => {
                        const values = valuesByAttribute[attr.id] || [];
                        const currentSelections = (form.watch("attribute_value_ids") || []) as (string | number)[];
                        const selectedForThisAttr = currentSelections
                          .filter((v) => values.some((val) => String(val.id) === String(v)))
                          .map((v) => String(v));

                        const handleChange = (selectedVal: string) => {
                          const current = (form.getValues("attribute_value_ids") || []) as (string | number)[];
                          const otherAttrValues = current.filter(
                            (x) => !values.some((val) => String(val.id) === String(x)),
                          );
                          const next = selectedVal
                            ? [...otherAttrValues, String(selectedVal)]
                            : otherAttrValues;
                          form.setValue("attribute_value_ids", next, {
                            shouldValidate: true,
                          });
                        };

                        return (
                          <div key={attr.id} className="space-y-2">
                            <Label>{attr.title}</Label>
                            {values.length ? (
                              <Combobox
                                options={toComboboxOptions(values)}
                                value={selectedForThisAttr[0] || ""}
                                onChange={handleChange}
                                disabled={isEditing}
                                placeholder={`Select ${attr.title.toLowerCase()}`}
                                searchPlaceholder="Search values..."
                              />
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No values available for {attr.title}. Add values under Attribute Values first.
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        This product has no attributes assigned. Add attributes in the product form first.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormTextField
                  form={form}
                  name="label"
                  label="Label (optional)"
                  placeholder="Auto-generated from attributes (e.g. 120cm / Oak)"
                />
                <FormTextField
                  form={form}
                  name="label_ar"
                  label="Label (Arabic, optional)"
                  placeholder="مثال: 120 سم / بلوط"
                />
              </div>

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-generated from product and attributes if left blank" disabled={isEditing} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormFileUploadField
                  form={form}
                  name="media_path"
                  label="Variant Image (optional, shown first)"
                  placeholder="Upload image"
                  accept="image/*"
                />
                <FormField
                  control={form.control}
                  name="media_alt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Alt</FormLabel>
                      <FormControl>
                        <Input placeholder="Describe the image" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="media_alt_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Alt (Arabic)</FormLabel>
                    <FormControl>
                      <Input placeholder="وصف الصورة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <BlogGalleryField
                items={galleryItems}
                onChange={setGalleryItems}
                label="More Images"
                description="Shown after the variant image in the product page slider. Leave the variant image and this list empty to use the product's images."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable this variant.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/products/${productId}/variants`)}
            >
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
