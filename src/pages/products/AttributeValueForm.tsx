import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import PageLoader from "@/components/layout/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormTextField, FormFileUploadField } from "@/components/forms/FormFieldComponents";
import { Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchAttributeValueById, createAttributeValue, updateAttributeValue, ApiError } from "@/services/products/attributeValuesApi";
import { fetchActiveAttributes, AttributeOption, AttributeType } from "@/services/products/attributesApi";
import { attributeValueSchema, AttributeValueFormData } from "@/schemas/attributeValueSchema";

// How a color-type value is represented: a hex color bar, or an uploaded photo.
type ColorMode = "color" | "image";
const DEFAULT_HEX = "#000000";

export default function AttributeValueForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  // The attribute is fixed when editing an existing value, or when the add
  // form was opened from a specific attribute (carried in the URL); it's only
  // editable when a new value is added from the "All attributes" filter.
  const lockedAttributeId = searchParams.get("attribute_id");
  const isAttributeLocked = isEditing || Boolean(lockedAttributeId);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [attributes, setAttributes] = useState<AttributeOption[]>([]);
  const [selectedType, setSelectedType] = useState<AttributeType | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>("color");

  const form = useForm<AttributeValueFormData>({
    resolver: zodResolver(attributeValueSchema),
    defaultValues: {
      attribute_id: searchParams.get("attribute_id") || "",
      type: undefined,
      color_mode: "color",
      value: "",
      value_ar: "",
      media_path: "",
      media_alt: "",
      media_alt_ar: "",
      color_code: "",
      sort_order: "1",
      is_active: true,
    },
  });

  const watchedAttributeId = form.watch("attribute_id");

  const selectedAttribute = useMemo(() => attributes.find((a) => String(a.id) === watchedAttributeId) || null, [attributes, watchedAttributeId]);

  // When the attribute changes, surface its type so the right fields show.
  useEffect(() => {
    if (selectedAttribute?.type) setSelectedType(selectedAttribute.type);
  }, [selectedAttribute]);

  // Mirror the UI branch state into the form so the schema validates the fields
  // the selected attribute type needs. Only re-validate once the user has tried
  // to submit, so errors don't appear before the first attempt.
  useEffect(() => {
    form.setValue("type", selectedType ?? undefined, {
      shouldValidate: form.formState.isSubmitted,
    });
  }, [selectedType, form]);

  useEffect(() => {
    form.setValue("color_mode", colorMode, {
      shouldValidate: form.formState.isSubmitted,
    });
  }, [colorMode, form]);

  useEffect(() => {
    fetchActiveAttributes()
      .then((res) => setAttributes(res.data))
      .catch(() => setAttributes([]));
  }, []);

  useEffect(() => {
    if (isEditing && id) loadValueData(parseInt(id));
  }, [id, isEditing]);

  // Default a color's hex once a color attribute is selected (Name is left alone).
  useEffect(() => {
    if (selectedType !== "color" || colorMode !== "color") return;
    if (!form.getValues("color_code")) form.setValue("color_code", DEFAULT_HEX);
  }, [selectedType, colorMode, form]);

  const loadValueData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const { data } = await fetchAttributeValueById(itemId);
      form.reset({
        attribute_id: String(data.attribute_id || ""),
        value: data.value || "",
        value_ar: data.value_ar || "",
        media_path: data.media_path || "",
        media_alt: data.media_alt || "",
        media_alt_ar: data.media_alt_ar || "",
        color_code: data.color_code || "",
        sort_order: (data.sort_order ?? 1).toString(),
        is_active: data.is_active ?? true,
      });
      // Image-only color values reopen on the photo tab; everything else
      // (including hex colors) opens on the color bar.
      setColorMode(data.color_code || !data.media_path ? "color" : "image");
      // Fall back to the value's embedded attribute if it isn't in the active list.
      if (data.attribute?.type) setSelectedType(data.attribute.type);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load Attribute value data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleColorChange = (hex: string) => {
    form.setValue("color_code", hex, { shouldDirty: true, shouldValidate: true });
  };

  // Switching modes never touches the Name fields.
  const handleModeChange = (mode: ColorMode) => {
    setColorMode(mode);
    if (mode === "color" && !form.getValues("color_code")) {
      form.setValue("color_code", DEFAULT_HEX, { shouldValidate: form.formState.isSubmitted });
    }
  };

  const onSubmit = async (data: AttributeValueFormData) => {
    const isColorBar = selectedType === "color" && colorMode === "color";
    const isColorImage = selectedType === "color" && colorMode === "image";
    const wantsMedia = selectedType === "icon" || isColorImage;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("attribute_id", data.attribute_id);
      formData.append("value", data.value || "");
      formData.append("value_ar", data.value_ar || "");
      formData.append("media_alt", data.media_alt || "");
      formData.append("media_alt_ar", data.media_alt_ar || "");
      formData.append("sort_order", (data.sort_order || "1").toString());
      formData.append("is_active", (data.is_active ?? true).toString());

      // A color value carries either a hex or a photo — never both.
      formData.append("color_code", isColorBar ? data.color_code || "" : "");

      if (wantsMedia) {
        if (data.media_path instanceof File) {
          formData.append("media_path", data.media_path);
        } else if (typeof data.media_path === "string" && data.media_path) {
          formData.append("media_path", data.media_path);
        }
      } else {
        formData.append("media_path", "");
      }

      if (isEditing && id) {
        await updateAttributeValue(parseInt(id), formData);
        toast({ title: "Success", description: "Attribute value updated successfully" });
      } else {
        await createAttributeValue(formData);
        toast({ title: "Success", description: "Attribute value created successfully" });
      }

      const attributeParam = data.attribute_id ? `?attribute_id=${data.attribute_id}` : "";
      navigate(`/attribute-values${attributeParam}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : `Failed to ${isEditing ? "update" : "create"} Attribute value`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const showValues = selectedType === "text";
  const showColorFields = selectedType === "color";
  const showIconMedia = selectedType === "icon";
  const showColorImage = selectedType === "color" && colorMode === "image";
  const showMedia = showIconMedia || showColorImage;

  if (initialLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/attribute-values${watchedAttributeId ? `?attribute_id=${watchedAttributeId}` : ""}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? "Edit" : "Add"} Attribute Value</h1>
          <p className="text-muted-foreground">Options grouped under an attribute, such as "Red" under Color</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Value Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="attribute_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attribute</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      disabled={isAttributeLocked}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an attribute" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {attributes.map((attribute) => (
                          <SelectItem key={attribute.id} value={String(attribute.id)}>
                            {attribute.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {isAttributeLocked && (
                      <p className="text-xs text-muted-foreground">
                        Locked to this attribute.
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {selectedType && (
                <p className="text-sm text-muted-foreground">
                  This attribute uses values of type <span className="font-medium capitalize">{selectedType}</span>.
                </p>
              )}

              {showValues && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormTextField form={form} name="value" label="Value" placeholder="e.g., Red" />
                  <FormTextField form={form} name="value_ar" label="Value (Arabic)" placeholder="مثال: أحمر" />
                </div>
              )}

              {showColorFields && (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormTextField form={form} name="value" label="Name" placeholder="e.g., #FF0000" />
                    <FormTextField form={form} name="value_ar" label="Name (Arabic)" placeholder="مثال: أحمر" />
                  </div>

                  <div className="space-y-2">
                    <FormLabel>Value Type</FormLabel>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={colorMode}
                      onValueChange={(value) => {
                        if (value) handleModeChange(value as ColorMode);
                      }}
                    >
                      <ToggleGroupItem value="color">Color bar</ToggleGroupItem>
                      <ToggleGroupItem value="image">Upload photo</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {colorMode === "color" && (
                    <FormField
                      control={form.control}
                      name="color_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={field.value || DEFAULT_HEX}
                              onChange={(e) => handleColorChange(e.target.value)}
                              className="h-10 w-14 cursor-pointer rounded-md border bg-background p-1"
                              aria-label="Pick color"
                            />
                            <FormControl>
                              <Input
                                value={field.value || ""}
                                onChange={(e) => handleColorChange(e.target.value)}
                                placeholder="#FF0000"
                                className="max-w-[180px]"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {showMedia && (
            <Card>
              <CardHeader>
                <CardTitle>{showIconMedia ? "Icon" : "Color Photo"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormFileUploadField
                  form={form}
                  name="media_path"
                  label={showIconMedia ? "Icon Image" : "Color Photo"}
                  placeholder={showIconMedia ? "Upload an icon image" : "Upload a color photo"}
                  accept="image/*"
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormTextField form={form} name="media_alt" label="Image Alt" placeholder="Icon alt text" />
                  <FormTextField form={form} name="media_alt_ar" label="Image Alt (Arabic)" placeholder="نص بديل للصورة" />
                </div>
              </CardContent>
            </Card>
          )}

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
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/attribute-values${watchedAttributeId ? `?attribute_id=${watchedAttributeId}` : ""}`)}
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
