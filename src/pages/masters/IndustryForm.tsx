import { useState, useEffect } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  MultiSelect,
  Option as MultiSelectOption,
} from "@/components/ui/multi-select";
import {
  FormTextField,
  FormRichTextField,
} from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchIndustryById,
  createIndustry,
  updateIndustry,
  ApiError,
} from "@/services/masters/industryApi";
import { fetchActiveProductCategories } from "@/services/products/productCategoryApi";
import { industrySchema, IndustryFormData } from "@/schemas/industrySchema";

export default function IndustryForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [categoryOptions, setCategoryOptions] = useState<MultiSelectOption[]>(
    [],
  );
  const [categoryIds, setCategoryIds] = useState<(number | string)[]>([]);

  const form = useForm<IndustryFormData>({
    resolver: zodResolver(industrySchema),
    defaultValues: {
      title: "",
      title_ar: "",
      description: "",
      description_ar: "",
      sort_order: "1",
      is_active: true,
    },
  });

  useEffect(() => {
    fetchActiveProductCategories()
      .then((res) =>
        setCategoryOptions(
          res.data.map((c) => ({ id: c.id, name: c.title })),
        ),
      )
      .catch(() => setCategoryOptions([]));
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      loadIndustryData(parseInt(id));
    }
  }, [id, isEditing]);

  const loadIndustryData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const response = await fetchIndustryById(itemId);
      const data = response.data;

      form.reset({
        title: data.title || "",
        title_ar: data.title_ar || "",
        description: data.description || "",
        description_ar: data.description_ar || "",
        sort_order: (data.sort_order ?? 1).toString(),
        is_active: data.is_active ?? true,
      });

      setCategoryIds((data.categories || []).map((c) => c.id));
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : "Failed to load industry data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: IndustryFormData) => {
    try {
      setLoading(true);

      const payload = {
        title: data.title,
        title_ar: data.title_ar,
        description: data.description,
        description_ar: data.description_ar,
        sort_order: parseInt(data.sort_order || "1"),
        is_active: data.is_active,
        category_ids: categoryIds.map((c) => Number(c)),
      };

      if (isEditing && id) {
        await updateIndustry(parseInt(id), payload);
        toast({
          title: "Success",
          description: "Industry updated successfully",
        });
      } else {
        await createIndustry(payload);
        toast({
          title: "Success",
          description: "Industry created successfully",
        });
      }

      navigate("/industry");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : `Failed to ${isEditing ? "update" : "create"} industry`,
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
          onClick={() => navigate("/industry")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit" : "Add"} Industry
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update" : "Create a new"} industry
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Industry Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormTextField
                  form={form}
                  name="title"
                  label="Title"
                  placeholder="e.g., Healthcare, Retail"
                />

                <FormTextField
                  form={form}
                  name="title_ar"
                  label="Title (Arabic)"
                  placeholder="e.g., صحة, تجارة"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormRichTextField
                  form={form}
                  name="description"
                  label="Description"
                  placeholder="Describe this industry"
                />

                <FormRichTextField
                  form={form}
                  name="description_ar"
                  label="Description (Arabic)"
                  placeholder="وصف هذا الصناعة"
                />
              </div>

              <div className="space-y-2">
                <Label>Categories</Label>
                <MultiSelect
                  options={categoryOptions}
                  selected={categoryIds}
                  onChange={setCategoryIds}
                  placeholder="Select categories"
                />
                <p className="text-xs text-muted-foreground">
                  Map one or more product categories to this industry.
                </p>
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
                        <Input
                          type="number"
                          min={1}
                          placeholder="1"
                          {...field}
                        />
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
                          Enable or disable this item.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/industry")}
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
