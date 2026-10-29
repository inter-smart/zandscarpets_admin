import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { captureVideoThumbnail } from "@/utils/videoThumbnail";
import { useToast } from "@/hooks/use-toast";
import { commonContentSchema, CommonContentFormData } from "@/schemas/commonContentSchema";
import { fetchCommonContent, saveCommonContent } from "@/services/common/commonContentApi";

const defaultValues: CommonContentFormData = {
  why_choose_title: "",
  why_choose_title_ar: "",
  side_section_title: "",
  side_section_title_ar: "",
  side_section_description: "",
  side_section_description_ar: "",
  button_text: "",
  button_text_ar: "",
  button_link: "",
  how_section_title: "",
  how_section_title_ar: "",
  how_section_bg_title: "",
  how_section_bg_title_ar: "",
  how_section_media_type: "image",
  how_section_media_path: "",
  how_section_thumbnail: "",
};

// Form state for the shared `common_content` singleton, used by the Home CMS, About CMS and the
// standalone Common Content screen. Callers own the submit button: validate() then save().
export function useSharedContentForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recordId, setRecordId] = useState<number | undefined>(undefined);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);

  const form = useForm<CommonContentFormData>({
    resolver: zodResolver(commonContentSchema),
    defaultValues,
  });

  const mediaType = form.watch("how_section_media_type");
  const mediaValue = form.watch("how_section_media_path");

  // Auto-generate a thumbnail whenever a new video file is picked; the user
  // can still replace it through the thumbnail upload.
  useEffect(() => {
    if (mediaType !== "video" || !(mediaValue instanceof File)) return;
    let cancelled = false;
    setGeneratingThumbnail(true);
    captureVideoThumbnail(mediaValue)
      .then((thumb) => {
        if (!cancelled) form.setValue("how_section_thumbnail", thumb, { shouldValidate: true });
      })
      .catch(() => {
        toast({
          title: "Thumbnail",
          description: "Couldn't auto-generate a thumbnail. Please upload one.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) setGeneratingThumbnail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mediaType, mediaValue, form, toast]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchCommonContent();
        const data = response.data;
        if (data) {
          setRecordId(data.id);
          form.reset({
            why_choose_title: data.why_choose_title || "",
            why_choose_title_ar: data.why_choose_title_ar || "",
            side_section_title: data.side_section_title || "",
            side_section_title_ar: data.side_section_title_ar || "",
            side_section_description: data.side_section_description || "",
            side_section_description_ar: data.side_section_description_ar || "",
            button_text: data.button_text || "",
            button_text_ar: data.button_text_ar || "",
            button_link: data.button_link || "",
            how_section_title: data.how_section_title || "",
            how_section_title_ar: data.how_section_title_ar || "",
            how_section_bg_title: data.how_section_bg_title || "",
            how_section_bg_title_ar: data.how_section_bg_title_ar || "",
            how_section_media_type: data.how_section_media_type || "image",
            how_section_media_path: data.how_section_media_path || "",
            how_section_thumbnail: data.how_section_thumbnail || "",
          });
        }
      } catch {
        // No existing row yet — start with an empty form.
      } finally {
        setInitialLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => form.trigger();

  // Throws on API failure; callers decide how to report it.
  const save = async () => {
    const data = form.getValues();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "how_section_media_path" || key === "how_section_thumbnail") return;
        formData.append(key, value as string);
      });
      if (data.how_section_media_path instanceof File) {
        formData.append("how_section_media_path", data.how_section_media_path);
      } else if (data.how_section_media_path) {
        formData.append("how_section_media_path", data.how_section_media_path);
      }
      if (data.how_section_media_type === "video") {
        if (data.how_section_thumbnail instanceof File) {
          formData.append("how_section_thumbnail", data.how_section_thumbnail);
        } else if (data.how_section_thumbnail) {
          formData.append("how_section_thumbnail", data.how_section_thumbnail);
        }
      }
      const response = await saveCommonContent(formData, recordId ?? 1);
      if (response.data?.id) setRecordId(response.data.id);
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, initialLoading, generatingThumbnail, mediaType, validate, save };
}

export type SharedContentForm = ReturnType<typeof useSharedContentForm>;
