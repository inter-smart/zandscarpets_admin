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
import { Plus, Trash2, ImagePlus, EyeOff, Eye, RotateCcw } from "lucide-react";
import MediaThumbnail from "@/components/common/MediaThumbnail";
import { renderHtml } from "@/lib/renderHtml";
import { useToast } from "@/hooks/use-toast";
import MediaLibraryPicker from "./MediaLibraryPicker";
import {
  addDetailItem,
  editDetailItem,
  removeDetailItem,
  addFieldToProduct,
  DetailItemRecord,
  ApiError,
} from "@/services/details/mappingsApi";
import {
  fetchResolvedVariantDetails,
  customizeField,
  hideFieldForVariant,
  showFieldAgain,
  revertFieldToProductDefault,
  excludeItemForVariant,
  includeItemForVariant,
  ResolvedFieldEntry,
} from "@/services/details/variantDetailsApi";
import { MediaRecord, mediaThumbnailPath } from "@/services/details/mediaApi";

const TYPE_LABELS: Record<string, string> = { rich_text: "Rich Text", image: "Image", video: "Video" };

const STATE_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  inherited: { label: "Inherited", variant: "secondary" },
  custom: { label: "Custom", variant: "default" },
  hidden: { label: "Hidden", variant: "outline" },
  none: { label: "Not configured", variant: "outline" },
};

interface VariantDetailsEditorProps {
  productId: number;
  variantId: number;
}

// Per-variant content screen: every active field shows its current state
// (inherited/custom/hidden/not configured) and the matching actions.
export default function VariantDetailsEditor({ productId, variantId }: VariantDetailsEditorProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<ResolvedFieldEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [textEditor, setTextEditor] = useState<{ mappingId: number; item: DetailItemRecord | null; fieldName: string } | null>(null);
  const [textValue, setTextValue] = useState("");
  const [textValueAr, setTextValueAr] = useState("");
  const [mediaPickerFor, setMediaPickerFor] = useState<ResolvedFieldEntry | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantId]);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await fetchResolvedVariantDetails(variantId);
      setEntries(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load variant details",
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

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      toast({ title: "Success", description: successMessage });
      load();
    } catch (error) {
      reportError(error, "Action failed");
    }
  };

  const openTextEditor = (mappingId: number, item: DetailItemRecord | null, fieldName: string) => {
    setTextEditor({ mappingId, item, fieldName });
    setTextValue(item?.text_content || "");
    setTextValueAr(item?.text_content_ar || "");
  };

  const saveTextItem = async () => {
    if (!textEditor) return;
    try {
      if (textEditor.item) {
        await editDetailItem(textEditor.mappingId, textEditor.item.id, { text_content: textValue, text_content_ar: textValueAr });
      } else {
        await addDetailItem(textEditor.mappingId, { text_content: textValue, text_content_ar: textValueAr });
      }
      toast({ title: "Success", description: "Saved" });
      setTextEditor(null);
      load();
    } catch (error) {
      reportError(error, "Failed to save item");
    }
  };

  const handleMediaSelect = async (mappingId: number, media: MediaRecord) => {
    setMediaPickerFor(null);
    try {
      await addDetailItem(mappingId, { media_id: media.id });
      toast({ title: "Success", description: "Media added" });
      load();
    } catch (error) {
      reportError(error, "Failed to add media");
    }
  };

  const handleMediaSelectMultiple = async (mappingId: number, mediaList: MediaRecord[]) => {
    setMediaPickerFor(null);
    try {
      for (const media of mediaList) {
        await addDetailItem(mappingId, { media_id: media.id });
      }
      toast({ title: "Success", description: `${mediaList.length} item(s) added` });
      load();
    } catch (error) {
      reportError(error, "Failed to add media");
      load();
    }
  };

  const handleRemoveItem = (itemId: number) =>
    runAction(() => removeDetailItem(itemId), "Item removed");

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const badge = STATE_BADGE[entry.state];
        return (
          <Card key={entry.field.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{entry.field.name}</CardTitle>
                <Badge variant="secondary">{TYPE_LABELS[entry.field.type]}</Badge>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {entry.state === "none" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      runAction(
                        () => addFieldToProduct(productId, { field_id: entry.field.id, variant_id: variantId }),
                        "Field added for this variant",
                      )
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add for this variant
                  </Button>
                )}
                {entry.state === "hidden" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runAction(() => showFieldAgain(variantId, entry.field.id), "Field shown again")}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Show again
                  </Button>
                )}
                {entry.state === "inherited" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runAction(() => hideFieldForVariant(variantId, entry.field.id), "Field hidden for this variant")}
                    >
                      <EyeOff className="h-4 w-4 mr-1" /> Hide
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runAction(() => customizeField(variantId, entry.field.id), "Field customized for this variant")}
                    >
                      Customize
                    </Button>
                  </>
                )}
                {entry.state === "custom" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runAction(() => revertFieldToProductDefault(variantId, entry.field.id), "Reverted to product default")}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" /> Revert to product default
                  </Button>
                )}
              </div>
            </CardHeader>

            {entry.state === "inherited" && (
              <CardContent>
                {entry.field.type === "rich_text" ? (
                  <div className="text-sm rounded-md border bg-muted/40 p-3 prose prose-sm max-w-none">
                    {renderHtml(entry.items[0]?.text_content) || "(no content)"}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {(entry.allItems || entry.items).map((item) => {
                      const excluded = entry.excludedItemIds?.includes(item.id);
                      return (
                        <div key={item.id} className="relative">
                          <div className={excluded ? "opacity-30" : undefined}>
                            <MediaThumbnail path={mediaThumbnailPath(item.media)} alt={item.media?.alt_text} />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 bg-background rounded-md border shadow-sm"
                            title={excluded ? "Show this item again" : "Hide this item for this variant"}
                            onClick={() =>
                              runAction(
                                excluded
                                  ? () => includeItemForVariant(variantId, item.id)
                                  : () => excludeItemForVariant(variantId, item.id),
                                excluded ? "Item shown again" : "Item hidden for this variant",
                              )
                            }
                          >
                            {excluded ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            )}

            {entry.state === "custom" && entry.mapping && (
              <CardContent className="space-y-3">
                {entry.field.type === "rich_text" ? (
                  entry.items.length > 0 ? (
                    <div className="flex items-start justify-between gap-2 rounded-md border p-3">
                      <div className="text-sm flex-1 prose prose-sm max-w-none">
                        {renderHtml(entry.items[0].text_content)}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTextEditor(entry.mapping!.id, entry.items[0], entry.field.name)}
                        >
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleRemoveItem(entry.items[0].id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => openTextEditor(entry.mapping!.id, null, entry.field.name)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Text
                    </Button>
                  )
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {entry.items.map((item) => (
                      <div key={item.id} className="relative group">
                        <MediaThumbnail path={mediaThumbnailPath(item.media)} alt={item.media?.alt_text} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 hidden group-hover:flex bg-background rounded-md border shadow-sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {(entry.field.allows_multiple || entry.items.length === 0) && (
                      <button
                        type="button"
                        onClick={() => setMediaPickerFor(entry)}
                        className="w-10 h-10 rounded-md border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        <ImagePlus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {mediaPickerFor?.mapping && (
        <MediaLibraryPicker
          open={Boolean(mediaPickerFor)}
          onOpenChange={(open) => !open && setMediaPickerFor(null)}
          kind={mediaPickerFor.field.type === "video" ? "video" : "image"}
          multiple={mediaPickerFor.field.allows_multiple}
          onSelect={(media) => handleMediaSelect(mediaPickerFor.mapping!.id, media)}
          onSelectMultiple={(mediaList) => handleMediaSelectMultiple(mediaPickerFor.mapping!.id, mediaList)}
        />
      )}

      <Dialog open={Boolean(textEditor)} onOpenChange={(open) => !open && setTextEditor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{textEditor?.item ? "Edit" : "Add"} {textEditor?.fieldName}</DialogTitle>
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
