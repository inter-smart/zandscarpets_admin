import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import PageLoader from "@/components/layout/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormTextField, FormSwitchField } from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchProductLabelById,
  createProductLabel,
  updateProductLabel,
  LABEL_TYPES,
  LabelType,
  ApiError,
} from "@/services/products/productLabelsApi";
import { productLabelSchema, ProductLabelFormData } from "@/schemas/productLabelSchema";

const TYPE_OPTIONS: { value: LabelType; label: string }[] = [
  { value: "feature", label: "Feature" },
  { value: "tag", label: "Tag" },
  { value: "specification", label: "Specification" },
];

const isLabelType = (value: string | null): value is LabelType =>
  !!value && (LABEL_TYPES as readonly string[]).includes(value);

export default function ProductLabelForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const typeParam = searchParams.get("type");
  const defaultType: LabelType = isLabelType(typeParam) ? typeParam : "feature";

  const form = useForm<ProductLabelFormData>({
    resolver: zodResolver(productLabelSchema),
    defaultValues: {
      type: defaultType,
      title: "",
      title_ar: "",
      is_product_badge: false,
      show_in_filter: false,
      sort_order: "1",
      is_active: true,
    },
  });

  const selectedType = form.watch("type");

  useEffect(() => {
    if (isEditing && id) loadProductLabelData(parseInt(id));
  }, [id, isEditing]);

  // A badge must be one of the product's own tags, so the flag is only
  // meaningful for `tag` labels; clear it whenever the type moves elsewhere.
  useEffect(() => {
    if (selectedType !== "tag") {
      if (form.getValues("is_product_badge")) form.setValue("is_product_badge", false);
      if (form.getValues("show_in_filter")) form.setValue("show_in_filter", false);
    }
  }, [selectedType, form]);

  const loadProductLabelData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const { data } = await fetchProductLabelById(itemId);
      form.reset({
        type: data.type,
        title: data.title || "",
        title_ar: data.title_ar || "",
        is_product_badge: data.is_product_badge ?? false,
        show_in_filter: data.show_in_filter ?? false,
        sort_order: (data.sort_order ?? 1).toString(),
        is_active: data.is_active ?? true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load product label data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: ProductLabelFormData) => {
    try {
      setLoading(true);

      const payload = {
        type: data.type,
        title: data.title,
        title_ar: data.title_ar,
        is_product_badge: data.is_product_badge,
        show_in_filter: data.show_in_filter,
        sort_order: parseInt(data.sort_order || "1"),
        is_active: data.is_active,
      };

      if (isEditing && id) {
        await updateProductLabel(parseInt(id), payload);
        toast({ title: "Success", description: "Product label updated successfully" });
      } else {
        await createProductLabel(payload);
        toast({ title: "Success", description: "Product label created successfully" });
      }

      navigate("/product-labels");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : `Failed to ${isEditing ? "update" : "create"} product label`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/product-labels")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? "Edit" : "Add"} Product Label</h1>
          <p className="text-muted-foreground">
            Reusable features, tags and specifications attached to products
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Label Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedType === "tag" && (
                  <>
                    <FormSwitchField
                      form={form}
                      name="is_product_badge"
                      label="Product Badge"
                      description="Only one tag per product can be the badge."
                    />
                    <FormSwitchField
                      form={form}
                      name="show_in_filter"
                      label="Show in Filter"
                      description="Show this tag in the filter section of the listing page."
                    />
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField form={form} name="title" label="Title" placeholder="e.g., Ergonomic" />
                <FormTextField form={form} name="title_ar" label="Title (Arabic)" placeholder="مثال: إرجونوميك" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <p className="text-sm text-muted-foreground">Enable or disable this item.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/product-labels")}>
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