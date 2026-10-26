import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactNode } from "react";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { useCanManage } from "@/hooks/useCanManage";

interface RowActionsMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  // Extra menu items rendered before Edit (e.g. "Add sub-category").
  extraItems?: ReactNode;
}

// Shared "⋮" row-actions dropdown (View/Edit/Delete) used across list table
// "actions" columns. Callers own what each action actually does (navigate,
// open a dialog, etc.) — this component is presentational only.
export default function RowActionsMenu({
  onView,
  viewLabel = "View",
  editLabel = "Edit",
  deleteLabel = "Delete",
  extraItems: extraItemsProp,
  onEdit: onEditProp,
  onDelete: onDeleteProp,
}: RowActionsMenuProps) {
  // Read-only roles only keep "View".
  const canManage = useCanManage();
  const extraItems = canManage ? extraItemsProp : undefined;
  const onEdit = canManage ? onEditProp : undefined;
  const onDelete = canManage ? onDeleteProp : undefined;

  if (!onView && !onEdit && !onDelete && !extraItems) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            {viewLabel}
          </DropdownMenuItem>
        )}
        {extraItems}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            {editLabel}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteLabel}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
