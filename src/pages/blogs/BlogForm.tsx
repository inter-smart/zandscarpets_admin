import { useState, useEffect } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiSelect, Option as MultiSelectOption } from "@/components/ui/multi-select";
import {
  FormTextField,
  FormTextareaField,
  FormRichTextField,
  FormFileUploadField,
} from "@/components/forms/FormFieldComponents";
import BlogGalleryField, {
  BlogGalleryItem,
  appendGalleryToFormData,
  blogImagesToGalleryItems,
} from "@/components/blogs/BlogGalleryField";
import { Save, ArrowLeft, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchBlogById,
  fetchBlogList,
  createBlog,
  updateBlog,
  uploadBlogContentImage,
  ApiError,
} from "@/services/blogs/blogApi";
import { fetchActiveBlogTags } from "@/services/blogs/blogTagApi";
import { fetchActiveProductCategories } from "@/services/products/productCategoryApi";
import { buildCategoryPathOptions } from "@/utils/productCategoryTree";
import { blogSchema, BlogFormData } from "@/schemas/blogSchema";

// ISO date <-> the value of an <input type="datetime-local"> (local time, no seconds)
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function BlogForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [savedSlug, setSavedSlug] = useState("");

  const [categoryOptions, setCategoryOptions] = useState<MultiSelectOption[]>([]);
  const [categoryIds, setCategoryIds] = useState<(number | string)[]>([]);
  const [tagOptions, setTagOptions] = useState<MultiSelectOption[]>([]);
  const [tagIds, setTagIds] = useState<(number | string)[]>([]);
  const [relatedOptions, setRelatedOptions] = useState<MultiSelectOption[]>([]);
  const [relatedIds, setRelatedIds] = useState<(number | string)[]>([]);
  const [gallery, setGallery] = useState<BlogGalleryItem[]>([]);

  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      title_ar: "",
      slug: "",
      excerpt: "",
      excerpt_ar: "",
      content: "",
      content_ar: "",
      author_name: "",
      author_name_ar: "",
      media_path: "",
      media_alt: "",
      media_alt_ar: "",
      published_at: toLocalInput(new Date().toISOString()),
      is_active: true,
    },
  });

  const errorToast = (error: unknown, fallback: string) =>
    toast({
      title: "Error",
      description: error instanceof ApiError ? error.message : fallback,
      variant: "destructive",
    });

  useEffect(() => {
    fetchActiveProductCategories()
      .then((res) =>
        setCategoryOptions(
          buildCategoryPathOptions(res.data).map((option) => ({ id: Number(option.value), name: option.label })),
        ),
      )
      .catch((e) => errorToast(e, "Failed to load categories"));

    fetchActiveBlogTags()
      .then((res) => setTagOptions(res.data.map((tag) => ({ id: tag.id, name: tag.title }))))
      .catch((e) => errorToast(e, "Failed to load tags"));

    fetchBlogList(1, 500)
      .then((res) =>
        setRelatedOptions(
          res.data.data.map((post) => ({ id: post.id, name: post.title })),
        ),
      )
      .catch((e) => errorToast(e, "Failed to load blogs"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isEditing || !id) return;

    const load = async () => {
      try {
        setInitialLoading(true);
        const { data } = await fetchBlogById(parseInt(id));

        form.reset({
          title: data.title || "",
          title_ar: data.title_ar || "",
          slug: data.slug || "",
          excerpt: data.excerpt || "",
          excerpt_ar: data.excerpt_ar || "",
          content: data.content || "",
          content_ar: data.content_ar || "",
          author_name: data.author_name || "",
          author_name_ar: data.author_name_ar || "",
          media_path: data.media_path || "",
          media_alt: data.media_alt || "",
          media_alt_ar: data.media_alt_ar || "",
          published_at: toLocalInput(data.published_at),
          is_active: data.is_active ?? true,
        });
        setSavedSlug(data.slug || "");
        setCategoryIds((data.categories || []).map((item) => item.id));
        setTagIds((data.tags || []).map((item) => item.id));
        setRelatedIds((data.related_links || []).map((item) => item.related_blog_id));
        setGallery(blogImagesToGalleryItems(data.images));
      } catch (error) {
        errorToast(error, "Failed to load blog data");
      } finally {
        setInitialLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const onSubmit = async (data: BlogFormData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("title_ar", data.title_ar);
      formData.append("slug", data.slug || "");
      formData.append("excerpt", data.excerpt);
      formData.append("excerpt_ar", data.excerpt_ar || "");
      formData.append("content", data.content);
      formData.append("content_ar", data.content_ar || "");
      formData.append("author_name", data.author_name || "");
      formData.append("author_name_ar", data.author_name_ar || "");
      formData.append("media_alt", data.media_alt);
      formData.append("media_alt_ar", data.media_alt_ar || "");
      if (data.published_at) {
        formData.append("published_at", new Date(data.published_at).toISOString());
      }
      formData.append("is_active", (data.is_active ?? true).toString());

      if (data.media_path instanceof File) {
        formData.append("media_path", data.media_path);
      } else if (typeof data.media_path === "string" && data.media_path) {
        formData.append("media_path", data.media_path);
      }

      formData.append("category_ids", JSON.stringify(categoryIds));
      formData.append("tag_ids", JSON.stringify(tagIds));
      formData.append("related_ids", JSON.stringify(relatedIds));
      appendGalleryToFormData(formData, gallery);

      if (isEditing && id) {
        await updateBlog(parseInt(id), formData);
        toast({ title: "Success", description: "Blog updated successfully" });
      } else {
        await createBlog(formData);
        toast({ title: "Success", description: "Blog created successfully" });
      }

      navigate("/blogs");
    } catch (error) {
      errorToast(error, `Failed to ${isEditing ? "update" : "create"} blog`);
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
        <Button variant="outline" size="icon" onClick={() => navigate("/blogs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEditing ? "Edit" : "Add"} Blog</h1>
          <p className="text-muted-foreground">{isEditing ? "Update" : "Create a new"} blog post</p>
        </div>
        {isEditing && savedSlug && (
          <Button variant="outline" asChild>
            <Link to={`/meta-tags/new?type=blog&blog_id=${encodeURIComponent(savedSlug)}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              SEO meta data
            </Link>
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField form={form} name="title" label="Title" placeholder="Post title" />
                <FormTextField form={form} name="title_ar" label="Title (Arabic)" placeholder="عنوان المقال" />
              </div>

              <FormTextField
                form={form}
                name="slug"
                label="Slug (URL)"
                placeholder="Leave empty to generate it from the title"
              />
              <p className="-mt-2 text-xs text-muted-foreground">
                The post address is /blogs/&lt;slug&gt;. Changing the slug of a published post changes its link.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextareaField
                  form={form}
                  name="excerpt"
                  label="Excerpt"
                  rows={4}
                  placeholder="Short text shown on the blog cards"
                />
                <FormTextareaField
                  form={form}
                  name="excerpt_ar"
                  label="Excerpt (Arabic)"
                  rows={4}
                  placeholder="نص قصير يظهر في بطاقات المقالات"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField form={form} name="author_name" label="Author" placeholder="e.g. Romine" />
                <FormTextField form={form} name="author_name_ar" label="Author (Arabic)" placeholder="مثال: رومين" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormRichTextField
                form={form}
                name="content"
                label="Content"
                placeholder="Write the article"
                checkList
                galleryMarker
                uploadImage={uploadBlogContentImage}
              />
              <FormRichTextField
                form={form}
                name="content_ar"
                label="Content (Arabic)"
                placeholder="اكتب المقال"
                checkList
                galleryMarker
                uploadImage={uploadBlogContentImage}
              />
              <p className="text-xs text-muted-foreground">
                Bullet lists show with check icons. The Arabic content is optional: when it is empty the Arabic page
                shows the English content.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormFileUploadField
                form={form}
                name="media_path"
                label="Hero image"
                placeholder="Upload the hero image"
                accept="image/*"
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormTextField form={form} name="media_alt" label="Hero alt text" placeholder="Describe the image" />
                <FormTextField form={form} name="media_alt_ar" label="Hero alt text (Arabic)" placeholder="وصف الصورة" />
              </div>

              <BlogGalleryField items={gallery} onChange={setGallery} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories, Tags & Related Blogs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categories</Label>
                <MultiSelect
                  options={categoryOptions}
                  selected={categoryIds}
                  onChange={setCategoryIds}
                  placeholder="Select product categories"
                />
                <p className="text-xs text-muted-foreground">
                  Product categories this post is about (used by the blog filter and related posts).
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <MultiSelect options={tagOptions} selected={tagIds} onChange={setTagIds} placeholder="Select tags" />
                <p className="text-xs text-muted-foreground">Only active tags are listed. Manage them under Blogs &gt; Blog Tags.</p>
              </div>
              <div className="space-y-2">
                <Label>Related Blogs</Label>
                <MultiSelect
                  options={relatedOptions.filter((option) => String(option.id) !== (id ?? ""))}
                  selected={relatedIds}
                  onChange={setRelatedIds}
                  placeholder="Select related blogs"
                />
                <p className="text-xs text-muted-foreground">
                  Shown first in the "Related Blogs" carousel on this post. Leave empty, or pick fewer than 6, and the
                  rest is filled automatically with posts that share categories or tags.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="published_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publish date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Shown on the post and used for the Latest / Oldest order. A future date keeps the post hidden
                        until then.
                      </p>
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
                        <FormLabel className="text-base">Published</FormLabel>
                        <p className="text-sm text-muted-foreground">Switch off to keep this post as a draft.</p>
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/blogs")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
