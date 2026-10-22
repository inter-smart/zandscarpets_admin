import { QuoteRequestStatus } from "@/services/enquiries/quoteRequestApi";

export const QUOTE_STATUS_OPTIONS: { value: QuoteRequestStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "followed_up", label: "Followed Up" },
];

export const QUOTE_STATUS_LABELS: Record<QuoteRequestStatus, string> = {
  new: "New",
  contacted: "Contacted",
  followed_up: "Followed Up",
};

export const QUOTE_STATUS_BADGE_VARIANT: Record<
  QuoteRequestStatus,
  "default" | "secondary" | "outline"
> = {
  new: "default",
  contacted: "secondary",
  followed_up: "outline",
};
