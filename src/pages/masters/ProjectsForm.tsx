import { useState, useEffect } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { MultiSelect, Option as MultiSelectOption } from "@/components/ui/multi-select";
import { FormFileUploadField, FormRichTextField } from "@/components/forms/FormFieldComponents";
import ProjectGalleryField, { GalleryItem, appendGalleryToFormData, projectMediaToGalleryItems } from "@/components/projects/ProjectGalleryField";
import { Save, ArrowLeft, Tags } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchProjectById, createProject, updateProject, fetchActiveProjects, ApiError } from "@/services/masters/projectsApi";
import { fetchActiveIndustries } from "@/services/masters/industryApi";
import { fetchActiveProductCategories } from "@/services/products/productCategoryApi";
import { projectsSchema, ProjectsFormData } from "@/schemas/projectsSchema";

export default function ProjectsForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [industryOptions, setIndustryOptions] = useState<ComboboxOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<ComboboxOption[]>([]);
  const [relatedOptions, setRelatedOptions] = useState<MultiSelectOption[]>([]);
  const [relatedProjectIds, setRelatedProjectIds] = useState<(number | string)[]>([]);

  // Project gallery items (existing rows kept from the server, plus newly
  // staged files) — kept outside react-hook-form since it mixes server
  // records and in-memory Files; serialized into FormData at submit time.
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  const form = useForm<ProjectsFormData>({
    resolver: zodResolver(projectsSchema),
    defaultValues: {
      industry_id: "",
      category_id: "",
      title: "",
      title_ar: "",
      location: "",
      location_ar: "",
      date_of_completion: "",
      material_type: "",
      material_type_ar: "",
      thumbnail: "",
      media_path: "",
      description: "",
      description_ar: "",
      sort_order: "1",
      is_active: true,
      is_show_in_home: false,
    },
  });

  const industryId = form.watch("industry_id");

  useEffect(() => {
    loadIndustryOptions();
    loadRelatedOptions(id);
  }, [id]);

  // Called from the Industry Combobox's onChange — a genuine user-driven
  // change, so the previously picked Category (which may not belong to the
  // new Industry) is cleared. Loading an existing project's Category
  // options on edit goes through loadCategoryOptions directly instead (see
  // loadProjectData), so it never clears the value it just set.
  const handleIndustryChange = (value: string) => {
    form.setValue("industry_id", value);
    form.setValue("category_id", "");
    if (value) {
      loadCategoryOptions(value);
    } else {
      setCategoryOptions([]);
    }
  };

  const loadIndustryOptions = async () => {
    try {
      const response = await fetchActiveIndustries();
      setIndustryOptions(
        response.data.map((industry) => ({
          value: industry.id.toString(),
          label: industry.title,
        })),
      );
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load industries",
        variant: "destructive",
      });
    }
  };

  const loadCategoryOptions = async (forIndustryId: string) => {
    try {
      const response = await fetchActiveProductCategories(undefined, parseInt(forIndustryId, 10));
      setCategoryOptions(
        response.data.map((category) => ({
          value: category.id.toString(),
          label: category.title,
        })),
      );
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const loadRelatedOptions = async (currentId?: string) => {
    try {
      const response = await fetchActiveProjects(currentId ? parseInt(currentId) : undefined);
      setRelatedOptions(
        response.data.map((project) => ({
          id: project.id,
          name: project.title,
        })),
      );
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load related projects",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isEditing && id) {
      loadProjectData(parseInt(id));
    }
  }, [id, isEditing]);

  const loadProjectData = async (itemId: number) => {
    try {
      setInitialLoading(true);
      const response = await fetchProjectById(itemId);
      const data = response.data;

      form.reset({
        industry_id: data.industry_id.toString(),
        category_id: data.category_id ? data.category_id.toString() : "",
        title: data.title || "",
        title_ar: data.title_ar || "",
        location: data.location || "",
        location_ar: data.location_ar || "",
        date_of_completion: data.date_of_completion ? data.date_of_completion.slice(0, 10) : "",
        material_type: data.material_type || "",
        material_type_ar: data.material_type_ar || "",
        thumbnail: data.thumbnail || "",
        media_path: data.media_path || "",
        description: data.description || "",
        description_ar: data.description_ar || "",
        sort_order: (data.sort_order ?? 0).toString(),
        is_active: data.is_active ?? true,
        is_show_in_home: data.is_show_in_home ?? false,
      });

      await loadCategoryOptions(data.industry_id.toString());
      setGalleryItems(projectMediaToGalleryItems(data.project_media || []));
      setRelatedProjectIds((data.relatedProjects || []).map((p) => p.id));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load project data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: ProjectsFormData) => {
    // Category is required whenever the selected industry has categories
    // mapped to it; an industry with none can't force a pick, so it stays
    // optional there (the API accepts a null category).
    if (!data.category_id && categoryOptions.length > 0) {
      form.setError("category_id", { type: "required", message: "Category is required" });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("industry_id", data.industry_id);
      formData.append("category_id", data.category_id || "");
      formData.append("title", data.title);
      formData.append("title_ar", data.title_ar);
      formData.append("location", data.location || "");
      formData.append("location_ar", data.location_ar || "");
      formData.append("date_of_completion", data.date_of_completion || "");
      formData.append("material_type", data.material_type || "");
      formData.append("material_type_ar", data.material_type_ar || "");
      formData.append("description", data.description || "");
      formData.append("description_ar", data.description_ar || "");
      formData.append("sort_order", (data.sort_order || "0").toString());
      formData.append("is_active", (data.is_active ?? true).toString());
      formData.append("is_show_in_home", (data.is_show_in_home ?? false).toString());

      if (data.thumbnail instanceof File) {
        formData.append("thumbnail", data.thumbnail);
      } else if (typeof data.thumbnail === "string" && data.thumbnail) {
        formData.append("thumbnail", data.thumbnail);
      }

      if (data.media_path instanceof File) {
        formData.append("media_path", data.media_path);
      } else if (typeof data.media_path === "string" && data.media_path) {
        formData.append("media_path", data.media_path);
      }

      appendGalleryToFormData(formData, galleryItems);

      formData.append("related_project_ids", JSON.stringify(relatedProjectIds));

      if (isEditing && id) {
        await updateProject(parseInt(id), formData);
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } else {
        await createProject(formData);
        toast({
          title: "Success",
          description: "Project created successfully",
        });
      }

      navigate("/projects");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : `Failed to ${isEditing ? "update" : "create"} project`,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEditing ? "Edit" : "Add"} Project</h1>
            <p className="text-muted-foreground">{isEditing ? "Update" : "Create a new"} project</p>
          </div>
        </div>
        {isEditing && id && (
          <Button type="button" variant="outline" onClick={() => navigate(`/meta-tags?type=project&project_id=${id}`)}>
            <Tags className="mr-2 h-4 w-4" />
            SEO Meta
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industry_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Combobox
                          options={industryOptions}
                          value={field.value}
                          onChange={handleIndustryChange}
                          placeholder="Select industry"
                          searchPlaceholder="Search industry..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Combobox
                          options={categoryOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder={
                            industryId
                              ? categoryOptions.length
                                ? "Select category"
                                : "No categories mapped to this industry"
                              : "Select an industry first"
                          }
                          searchPlaceholder="Search category..."
                          disabled={!industryId || categoryOptions.length === 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Project title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Arabic)</FormLabel>
                      <FormControl>
                        <Input placeholder="عنوان المشروع" dir="rtl" className="text-right" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dubai, UAE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Arabic)</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: دبي، الإمارات العربية المتحدة" dir="rtl" className="text-right" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date_of_completion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Completion</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormField
                  control={form.control}
                  name="material_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Marble, Wool" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="material_type_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Type (Arabic)</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: رخام، صوف" dir="rtl" className="text-right" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormRichTextField form={form} name="description" label="Description" placeholder="Enter project description" />
              <FormRichTextField form={form} name="description_ar" label="Description (Arabic)" placeholder="صف هذا المشروع" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:col-span-2">
                <FormFileUploadField form={form} name="thumbnail" label="Listing Image" placeholder="Upload listing thumbnail" accept="image/*" />

                <FormFileUploadField form={form} name="media_path" label="Detail Image" placeholder="Upload detail/banner image" accept="image/*" />
              </div>

              <ProjectGalleryField items={galleryItems} onChange={setGalleryItems} />

              <div className="space-y-2">
                <Label>Related Projects</Label>
                <MultiSelect
                  options={relatedOptions}
                  selected={relatedProjectIds}
                  onChange={setRelatedProjectIds}
                  placeholder="Select related projects"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <FormField
                  control={form.control}
                  name="is_show_in_home"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show on Home</FormLabel>
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
            <Button type="button" variant="outline" onClick={() => navigate("/projects")}>
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
