import PageLoader from "@/components/layout/PageLoader";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSharedContentForm } from "@/hooks/useSharedContentForm";
import SharedContentSections from "@/components/common/SharedContentSections";
import SharedBlockNotice from "@/components/common/SharedBlockNotice";

// Fallback screen (not linked in the menu): the same fields are edited inside the Home and About CMS pages.
export default function CommonContentForm() {
  const { toast } = useToast();
  const shared = useSharedContentForm();

  const onSave = async () => {
    if (!(await shared.validate())) return;
    try {
      await shared.save();
      toast({ title: "Success", description: "Content saved successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save content",
        variant: "destructive",
      });
    }
  };

  if (shared.initialLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <SharedBlockNotice />
      <div>
        <h1 className="text-2xl font-bold">Common Content</h1>
        <p className="text-muted-foreground">Manage the shared Why Choose Us / How It Works content</p>
      </div>

      <SharedContentSections shared={shared} />

      <div className="flex justify-end">
        <Button type="button" onClick={onSave} disabled={shared.loading}>
          <Save className="h-4 w-4 mr-2" />
          {shared.loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
