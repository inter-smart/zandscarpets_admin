import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useCanManage } from "@/hooks/useCanManage";

interface SortOrderCellProps {
  sortOrder: number;
  onIncrement: () => void;
  onDecrement: () => void;
  minValue?: number;
}

// Renders the up/down sort-order stepper used in list table columns. Callers
// own the actual value/state changes (including any debounced commit) —
// this component is presentational only.
export default function SortOrderCell({
  sortOrder,
  onIncrement,
  onDecrement,
  minValue = 1,
}: SortOrderCellProps) {
  const canManage = useCanManage();
  return (
    <div className="flex items-center justify-start gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-6 w-6"
        disabled={!canManage || sortOrder <= minValue}
        onClick={onDecrement}
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
      <span className="w-6 text-center text-sm">{sortOrder}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-6 w-6"
        disabled={!canManage}
        onClick={onIncrement}
      >
        <ChevronUp className="h-3 w-3" />
      </Button>
    </div>
  );
}
