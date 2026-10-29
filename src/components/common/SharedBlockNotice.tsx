import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SharedBlockNotice() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Shared with the Home and About pages — changes apply to both. To hide a section on one page, use{" "}
        <Link to="/section-visibility" className="font-medium underline underline-offset-4">
          Section Visibility
        </Link>
        .
      </AlertDescription>
    </Alert>
  );
}
