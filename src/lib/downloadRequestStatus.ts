import { DownloadRequestStatus } from "@/services/enquiries/downloadRequestApi";

export const DOWNLOAD_REQUEST_STATUS_OPTIONS: { value: DownloadRequestStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "shared", label: "Shared" },
];

export const DOWNLOAD_REQUEST_STATUS_LABELS: Record<DownloadRequestStatus, string> = {
  new: "New",
  shared: "Shared",
};

export const DOWNLOAD_REQUEST_STATUS_BADGE_VARIANT: Record<
  DownloadRequestStatus,
  "default" | "secondary" | "outline"
> = {
  new: "default",
  shared: "secondary",
};
