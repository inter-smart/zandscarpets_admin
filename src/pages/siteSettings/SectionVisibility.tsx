import { useEffect, useState } from "react";
import PageLoader from "@/components/layout/PageLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPageSections,
  updatePageSection,
  type PageSection,
} from "@/services/siteSettings/pageSectionsApi";

// Pages whose sections can be toggled; mirrors database/seeders/pageSections.js on the server.
const PAGES = [
  { slug: "contact", label: "Contact" },
  { slug: "home", label: "Home" },
  { slug: "about", label: "About" },
  { slug: "services", label: "Services" },
  { slug: "products", label: "Products" },
];

const SectionVisibility = () => {
  const { toast } = useToast();
  const [pageSlug, setPageSlug] = useState(PAGES[0].slug);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  // toggle waiting for the admin's confirmation
  const [pending, setPending] = useState<{
    section: PageSection;
    isEnabled: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPageSections(pageSlug)
      .then((res) => {
        if (!cancelled) setSections(res.data);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          toast({
            title: "Failed to load sections",
            description: error.message,
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pageSlug, toast]);

  const setEnabled = (sectionKey: string, isEnabled: boolean) =>
    setSections((prev) =>
      prev.map((s) =>
        s.section_key === sectionKey ? { ...s, is_enabled: isEnabled } : s,
      ),
    );

  const handleToggle = async (section: PageSection, isEnabled: boolean) => {
    setEnabled(section.section_key, isEnabled);
    try {
      await updatePageSection(pageSlug, section.section_key, isEnabled);
      toast({
        title: `${section.label} ${isEnabled ? "shown" : "hidden"}`,
      });
    } catch (error) {
      setEnabled(section.section_key, !isEnabled);
      toast({
        title: "Failed to update section",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Section Visibility</h1>
        <p className="text-sm text-muted-foreground">
          Show or hide sections on a storefront page. Changes apply immediately.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Page sections</CardTitle>
          <Select value={pageSlug} onValueChange={setPageSlug}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGES.map((page) => (
                <SelectItem key={page.slug} value={page.slug}>
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <PageLoader />
          ) : (
            sections.map((section) => (
              <div
                key={section.section_key}
                className="flex flex-row items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-0.5">
                  <p className="text-base font-medium">{section.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {section.is_enabled
                      ? "Visible on the website."
                      : "Hidden from the website."}
                  </p>
                </div>
                <Switch
                  checked={section.is_enabled}
                  onCheckedChange={(checked) =>
                    setPending({ section, isEnabled: checked })
                  }
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.isEnabled ? "Show" : "Hide"} this section?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The "{pending?.section.label}" section will be{" "}
              {pending?.isEnabled ? "shown on" : "hidden from"} the{" "}
              {PAGES.find((p) => p.slug === pageSlug)?.label} page of the
              website right away.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) handleToggle(pending.section, pending.isEnabled);
                setPending(null);
              }}
            >
              {pending?.isEnabled ? "Show section" : "Hide section"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SectionVisibility;
