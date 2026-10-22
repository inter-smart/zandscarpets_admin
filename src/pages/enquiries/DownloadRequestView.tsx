import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import {
  fetchDownloadRequestById,
  deleteDownloadRequest,
  DownloadRequestRecord,
  ApiError,
} from "@/services/enquiries/downloadRequestApi";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default function DownloadRequestView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [item, setItem] = useState<DownloadRequestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadItem(Number(id));
  }, [id]);

  const loadItem = async (itemId: number) => {
    try {
      setLoading(true);
      const response = await fetchDownloadRequestById(itemId);
      setItem(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : "Failed to load download request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!item) return;

    try {
      await deleteDownloadRequest(item.id);
      toast({ title: "Success", description: "Download request deleted successfully" });
      navigate("/download-requests");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof ApiError ? error.message : "Failed to delete download request",
        variant: "destructive",
      });
    } finally {
      setConfirmingDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading download request…</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Download request not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/download-requests")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Download Request</h1>
            <p className="text-muted-foreground">Submitted download request details</p>
          </div>
        </div>
        <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Name">{item.name}</Field>
            <Field label="Email">{item.email}</Field>
            <Field label="Phone">{item.phone}</Field>
            <Field label="Company">{item.company_name || "-"}</Field>
            <Field label="File / Product">
              {item.download_title || item.product_title || "-"}
            </Field>
            <Field label="Submitted At">
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
            </Field>
          </div>
        </CardContent>
      </Card>

      <DeleteDialogue
        deleteItemId={confirmingDelete ? item.id : null}
        setDeleteItemId={(value) => setConfirmingDelete(!!value)}
        confirmDelete={confirmDelete}
        itemLabel="Download Request"
      />
    </div>
  );
}
