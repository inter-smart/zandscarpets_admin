import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import { ArrowUp, ArrowDown, Plus, Trash2, ImagePlus } from "lucide-react";
import MediaThumbnail from "@/components/common/MediaThumbnail";
import { renderHtml } from "@/lib/renderHtml";
import { useToast } from "@/hooks/use-toast";
import DetailFieldPicker from "./DetailFieldPicker";
import MediaLibraryPicker from "./MediaLibraryPicker";
import {
  fetchProductDetailMappings,
  addFieldToProduct,
  removeMapping,
  addDetailItem,
  editDetailItem,
  removeDetailItem,
  reorderDetailItems,
  DetailMappingRecord,
  DetailItemRecord,
  ApiError,
} from "@/services/details/mappingsApi";
import { MediaRecord, mediaThumbnailPath } from "@/services/details/mediaApi";
import { DetailFieldOption } from "@/services/details/detailFieldsApi";

const TYPE_LABELS: Record<string, string> = {
  rich_text: "Rich Text",
  image: "Image",
  video: "Video",
};

interface ProductDetailsEditorProps {
  productId: number;
}

// Product-level content-block editor: each mapped field is a card. Content
// set here is "for all variants" by default — variants override/hide it
// from their own screen (VariantDetailsEditor).
export default function ProductDetailsEditor({ productId }: ProductDetailsEditorProps) {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<DetailMappingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [textEditor, setTextEditor] = useState<{ mapping: DetailMappingRecord; item: DetailItemRecord | null } | null>(null);
  const [textValue, setTextValue] = useState("");
  const [textValueAr, setTextValueAr] = useState("");
  const [mediaPickerMapping, setMediaPickerMapping] = useState<DetailMappingRecord | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await fetchProductDetailMappings(productId);
      setMappings(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load detail fields",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reportError = (error: unknown, fallback: string) =>
    toast({
      title: "Error",
      description: error instanceof ApiError ? error.message : fallback,
      variant: "destructive",
    });

  const handlePickField = async (field: DetailFieldOption) => {
    setPickerOpen(false);
    try {
      await addFieldToProduct(productId, { field_id: field.id });
      toast({ title: "Success", description: `${field.name} added` });
      load();
    } catch (error) {
      reportError(error, "Failed to add field");
    }
  };

  const handleRemoveField = async (mapping: DetailMappingRecord) => {
    try {
      await removeMapping(mapping.id);
      toast({ title: "Success", description: "Field removed" });
      load();
    } catch (error) {
      reportError(error, "Failed to remove field");
    }
  };

  const moveItem = async (mapping: DetailMappingRecord, index: number, delta: number) => {
    const items = [...mapping.items];
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    setMappings((prev) => prev.map((m) => (m.id === mapping.id ? { ...m, items } : m)));
    try {
      await reorderDetailItems(mapping.id, items.map((i) => i.id));
    } catch (error) {
      reportError(error, "Failed to reorder items");
      load();
    }
  };

  const openTextEditor = (mapping: DetailMappingRecord, item: DetailItemRecord | null) => {
    setTextEditor({ mapping, item });
    setTextValue(item?.text_content || "");
    setTextValueAr(item?.text_content_ar || "");
  };

  const saveTextItem = async () => {
    if (!textEditor) return;
    try {
      if (textEditor.item) {
        await editDetailItem(textEditor.mapping.id, textEditor.item.id, { text_content: textValue, text_content_ar: textValueAr });
      } else {
        await addDetailItem(textEditor.mapping.id, { text_content: textValue, text_content_ar: textValueAr });
      }
      toast({ title: "Success", description: "Saved" });
      setTextEditor(null);
      load();
    } catch (error) {
      reportError(error, "Failed to save item");
    }
  };

  const handleMediaSelect = async (mapping: DetailMappingRecord, media: MediaRecord) => {
    setMediaPickerMapping(null);
    try {
      await addDetailItem(mapping.id, { media_id: media.id });
      toast({ title: "Success", description: "Media added" });
      load();
    } catch (error) {
      reportError(error, "Failed to add media");
    }
  };

  const handleMediaSelectMultiple = async (mapping: DetailMappingRecord, mediaList: MediaRecord[]) => {
    setMediaPickerMapping(null);
    try {
      for (const media of mediaList) {
        await addDetailItem(mapping.id, { media_id: media.id });
      }
      toast({ title: "Success", description: `${mediaList.length} item(s) added` });
      load();
    } catch (error) {
      reportError(error, "Failed to add media");
      load();
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeDetailItem(itemId);
      toast({ title: "Success", description: "Item removed" });
      load();
    } catch (error) {
      reportError(error, "Failed to remove item");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      {mappings.map((mapping) => (
        <Card key={mapping.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{mapping.field.name}</CardTitle>
              <Badge variant="secondary">{TYPE_LABELS[mapping.field.type]}</Badge>
              {mapping.field.allows_multiple && <Badge variant="outline">Multiple</Badge>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleRemoveField(mapping)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mapping.field.type === "rich_text" ? (
              mapping.items.length > 0 ? (
                <div className="flex items-start justify-between gap-2 rounded-md border p-3">
                  <div className="text-sm flex-1 prose prose-sm max-w-none">
                    {renderHtml(mapping.items[0].text_content)}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openTextEditor(mapping, mapping.items[0])}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRemoveItem(mapping.items[0].id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => openTextEditor(mapping, null)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Text
                </Button>
              )
            ) : (
              <div className="flex flex-wrap gap-3">
                {mapping.items.map((item, itemIndex) => (
                  <div key={item.id} className="relative group">
                    <MediaThumbnail path={mediaThumbnailPath(item.media)} alt={item.media?.alt_text} />
                    <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-0.5 bg-background rounded-md border shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveItem(mapping, itemIndex, -1)}
                        disabled={itemIndex === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveItem(mapping, itemIndex, 1)}
                        disabled={itemIndex === mapping.items.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(mapping.field.allows_multiple || mapping.items.length === 0) && (
                  <button
                    type="button"
                    onClick={() => setMediaPickerMapping(mapping)}
                    className="w-10 h-10 rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={() => setPickerOpen(true)}>
        <Plus className="h-4 w-4 mr-2" /> Add Field
      </Button>

      <DetailFieldPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={handlePickField}
        excludeFieldIds={mappings.map((m) => m.field_id)}
        scopeDescription="This field is set for all variants by default — a variant can override or hide it from its own Details screen."
      />

      {mediaPickerMapping && (
        <MediaLibraryPicker
          open={Boolean(mediaPickerMapping)}
          onOpenChange={(open) => !open && setMediaPickerMapping(null)}
          kind={mediaPickerMapping.field.type === "video" ? "video" : "image"}
          multiple={mediaPickerMapping.field.allows_multiple}
          onSelect={(media) => handleMediaSelect(mediaPickerMapping, media)}
          onSelectMultiple={(mediaList) => handleMediaSelectMultiple(mediaPickerMapping, mediaList)}
        />
      )}

      <Dialog open={Boolean(textEditor)} onOpenChange={(open) => !open && setTextEditor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{textEditor?.item ? "Edit" : "Add"} {textEditor?.mapping.field.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>English</Label>
            <RichTextEditor value={textValue} onChange={setTextValue} height="250px" />
          </div>
          <div className="space-y-2">
            <Label>Arabic</Label>
            <RichTextEditor value={textValueAr} onChange={setTextValueAr} height="250px" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextEditor(null)}>
              Cancel
            </Button>
            <Button onClick={saveTextItem} disabled={!textValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
