import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DeleteDialogue from "@/components/common/DeleteDialogue";
import {
  fetchQuoteRequestById,
  deleteQuoteRequest,
  updateQuoteRequestStatus,
  QuoteRequestRecord,
  QuoteRequestStatus,
  ApiError,
} from "@/services/enquiries/quoteRequestApi";
import { QUOTE_STATUS_OPTIONS, QUOTE_STATUS_BADGE_VARIANT } from "@/lib/quoteRequestStatus";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default function QuoteRequestView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [item, setItem] = useState<QuoteRequestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadItem(Number(id));
  }, [id]);

  const loadItem = async (itemId: number) => {
    try {
      setLoading(true);
      const response = await fetchQuoteRequestById(itemId);
      setItem(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to load quote request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: QuoteRequestStatus) => {
    if (!item || status === item.status) return;

    const previous = item.status;
    setItem({ ...item, status });
    setUpdatingStatus(true);
    try {
      await updateQuoteRequestStatus(item.id, status);
      toast({ title: "Success", description: "Status updated successfully" });
    } catch (error) {
      setItem((current) => (current ? { ...current, status: previous } : current));
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const confirmDelete = async () => {
    if (!item) return;

    try {
      await deleteQuoteRequest(item.id);
      toast({ title: "Success", description: "Quote request deleted successfully" });
      navigate("/quote-requests");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to delete quote request",
        variant: "destructive",
      });
    } finally {
      setConfirmingDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading quote request…</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Quote request not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/quote-requests")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Quote Request</h1>
            <p className="text-muted-foreground">Submitted quote request details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={item.status} onValueChange={(value) => handleStatusChange(value as QuoteRequestStatus)} disabled={updatingStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUOTE_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Reference">{item.reference_code || "-"}</Field>
            <Field label="Status">
              <Badge variant={QUOTE_STATUS_BADGE_VARIANT[item.status]}>
                {QUOTE_STATUS_OPTIONS.find((option) => option.value === item.status)?.label}
              </Badge>
            </Field>
            <Field label="Name">{item.name}</Field>
            <Field label="Email">{item.email}</Field>
            <Field label="Phone">{item.phone}</Field>
            <Field label="Company">{item.company_name || "-"}</Field>
            <Field label="reCAPTCHA Score">{item.recaptcha_score ?? "-"}</Field>
            <Field label="Submitted At">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</Field>
            <Field label="Message">{item.message || "-"}</Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(item.items ?? []).map((lineItem) => (
                <TableRow key={lineItem.id}>
                  <TableCell>
                    {lineItem.media_path ? (
                      <img src={lineItem.media_path} alt={lineItem.product_title} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{lineItem.product_title}</TableCell>
                  <TableCell>{lineItem.variant_label || "-"}</TableCell>
                  {/* <TableCell>{lineItem.variant_sku || "-"}</TableCell> */}
                  <TableCell>{lineItem.quantity}</TableCell>
                  {/* <TableCell>{lineItem.unit_price_snapshot ?? "-"}</TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DeleteDialogue
        deleteItemId={confirmingDelete ? item.id : null}
        setDeleteItemId={(value) => setConfirmingDelete(!!value)}
        confirmDelete={confirmDelete}
        itemLabel="Quote Request"
      />
    </div>
  );
}
