import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, Copy, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MAX_IMAGE_UPLOAD_BYTES, formatFileSize } from "@/utils/imageUtils";
import {
  uploadBulkMedia,
  listBulkMedia,
  BulkMediaFileResult,
  BulkMediaItem,
  BulkMediaType,
  BULK_MEDIA_PAGE_SIZE,
} from "@/services/bulkUpload/bulkMediaApi";

// Bulk image upload for the spreadsheet steps: many files at once, each
// returned with the stored path to paste into main_image / list_image /
// media_path columns. Mirrors BulkMediaUploadDialog's staged-file approach
// (src/components/details/BulkMediaUploadDialog.tsx) at page scope instead
// of a modal, since this is its own wizard step rather than a picker
// launched from another screen.

const TYPE_OPTIONS: { value: BulkMediaType; label: string }[] = [
  { value: "products", label: "Products (main_image / list_image)" },
  { value: "products-variants", label: "Product Variants (media_path)" },
];

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export default function MediaBulkUpload() {
  const { toast } = useToast();
  const [type, setType] = useState<BulkMediaType>("products");
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<BulkMediaFileResult[]>([]);
  const [existing, setExisting] = useState<BulkMediaItem[]>([]);
  const [existingTotal, setExistingTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // First page (or a refresh) for the current type — replaces the list.
  const loadFirstPage = useCallback(
    async (silent = false) => {
      setLoadingExisting(true);
      try {
        const page = await listBulkMedia(type, { limit: BULK_MEDIA_PAGE_SIZE, offset: 0 });
        setExisting(page.files);
        setExistingTotal(page.total);
        setHasMore(page.hasMore);
      } catch (error) {
        if (!silent) {
          toast({ title: "Could not load existing files", description: (error as Error).message, variant: "destructive" });
        }
      } finally {
        setLoadingExisting(false);
      }
    },
    [type, toast],
  );

  // Next 25, appended to whatever is already shown.
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await listBulkMedia(type, { limit: BULK_MEDIA_PAGE_SIZE, offset: existing.length });
      setExisting((prev) => [...prev, ...page.files]);
      setExistingTotal(page.total);
      setHasMore(page.hasMore);
    } catch (error) {
      toast({ title: "Could not load more files", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoadingMore(false);
    }
  };

  // Load the first page for the selected type on mount and every time the
  // type changes — the page used to only ever show files uploaded in the
  // current session.
  useEffect(() => {
    setResults([]);
    loadFirstPage(true);
  }, [loadFirstPage]);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const valid = accepted.filter((f) => f.size <= MAX_IMAGE_UPLOAD_BYTES);
      if (valid.length !== accepted.length) {
        toast({
          title: "Some images skipped",
          description: `${accepted.length - valid.length} file(s) exceed the ${formatFileSize(MAX_IMAGE_UPLOAD_BYTES)} limit.`,
          variant: "destructive",
        });
      }
      if (!valid.length) return;
      setUploading(true);
      try {
        const files = await uploadBulkMedia(type, valid);
        setResults((prev) => [...files, ...prev]);
        const failedCount = files.filter((f) => f.status === "failed").length;
        toast({
          title: "Upload processed",
          description: `${files.length - failedCount} succeeded, ${failedCount} failed.`,
        });
        // Reflect the freshly stored files in the persistent listing too.
        loadFirstPage(true);
      } catch (error) {
        toast({ title: "Upload failed", description: (error as Error).message, variant: "destructive" });
      } finally {
        setUploading(false);
      }
    },
    [type, toast, loadFirstPage],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    maxFiles: 50,
    disabled: uploading,
  });

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    toast({ title: "Copied", description: path });
  };

  const copyAll = () => {
    const paths = results.filter((r) => r.status === "success" && r.storedPath).map((r) => r.storedPath);
    navigator.clipboard.writeText(paths.join("\n"));
    toast({ title: "Copied", description: `${paths.length} path(s) copied` });
  };

  const copyAllExisting = () => {
    const paths = existing.map((f) => f.storedPath);
    navigator.clipboard.writeText(paths.join("\n"));
    toast({ title: "Copied", description: `${paths.length} path(s) copied` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bulk Upload: Media</h1>
        <p className="text-muted-foreground mt-1">
          Upload product and variant images here first, then paste the stored paths into the Products / Product
          Variants spreadsheets.
        </p>
      </div>

      <Alert>
        <AlertTitle>Important notes</AlertTitle>
        <AlertDescription>
          Only jpg, png and webp up to 300KB are accepted. One bad file won't fail the rest of the batch — failed files are
          listed with a reason below.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload type</CardTitle>
          <CardDescription>Pick which sheet these images are for — it decides the storage folder.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={type === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setType(opt.value)}
              disabled={uploading}
            >
              {opt.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              <span>{uploading ? "Uploading…" : "Drag and drop images here, or click to browse (up to 50)"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Uploaded files</CardTitle>
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="h-4 w-4 mr-2" /> Copy all paths
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stored path</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.originalName ?? "—"}</TableCell>
                    <TableCell>
                      {r.status === "success" ? (
                        <Badge variant="secondary">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> success
                        </Badge>
                      ) : (
                        <Badge variant="destructive" title={r.error}>
                          <XCircle className="h-3 w-3 mr-1" /> failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.storedPath ?? r.error}</TableCell>
                    <TableCell>
                      {r.storedPath && (
                        <Button variant="ghost" size="icon" onClick={() => copyPath(r.storedPath!)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Existing files ({existingTotal})</CardTitle>
            <CardDescription>
              Already stored in{" "}
              <span className="font-mono">
                uploads/{type === "products" ? "products" : "product-variants"}
              </span>{" "}
              — copy any path into the sheet.
            </CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => loadFirstPage()} disabled={loadingExisting}>
              {loadingExisting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={copyAllExisting} disabled={!existing.length}>
              <Copy className="h-4 w-4 mr-2" /> Copy all paths
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingExisting && existing.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading…
            </div>
          ) : existing.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No files stored for this type yet. Upload some above.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Preview</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Stored path</TableHead>
                    <TableHead className="w-20">Size</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existing.map((f) => (
                    <TableRow key={f.storedPath}>
                      <TableCell>
                        <a href={f.previewUrl} target="_blank" rel="noreferrer">
                          <img
                            src={f.previewUrl}
                            alt={f.name}
                            loading="lazy"
                            className="h-12 w-12 rounded object-cover border bg-muted"
                            onError={(e) => {
                              const img = e.currentTarget;
                              img.style.visibility = "hidden";
                            }}
                          />
                        </a>
                      </TableCell>
                      <TableCell className="text-xs break-all">{f.name}</TableCell>
                      <TableCell className="font-mono text-xs">{f.storedPath}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatBytes(f.sizeBytes)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => copyPath(f.storedPath)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">
                  Showing {existing.length} of {existingTotal}
                </span>
                {hasMore && (
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
                      </>
                    ) : (
                      `Load more (${Math.min(BULK_MEDIA_PAGE_SIZE, existingTotal - existing.length)})`
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
