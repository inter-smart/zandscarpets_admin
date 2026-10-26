import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Mail,
  FileText,
  Download,
  FlaskConical,
  Package,
  FolderTree,
  Newspaper,
  Briefcase,
  Image,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchContactEnquiryList } from "@/services/enquiries/contactEnquiryApi";
import { fetchQuoteRequestList } from "@/services/enquiries/quoteRequestApi";
import { fetchSampleRequestList } from "@/services/enquiries/sampleRequestApi";
import { fetchDownloadRequestList } from "@/services/enquiries/downloadRequestApi";

interface CountCard {
  key: string;
  title: string;
  href: string;
  icon: LucideIcon;
  // Only the total is needed, so a 1-row page is requested and `totalCount` read.
  fetchTotal: () => Promise<number>;
}

const COUNT_CARDS: CountCard[] = [
  {
    key: "quotes",
    title: "Quote Requests",
    href: "/quote-requests",
    icon: FileText,
    fetchTotal: async () => (await fetchQuoteRequestList(1, 1)).data.pagination.totalCount,
  },
  {
    key: "contact",
    title: "Contact Enquiries",
    href: "/enquiries",
    icon: Mail,
    fetchTotal: async () => (await fetchContactEnquiryList(1, 1)).data.pagination.totalCount,
  },
  {
    key: "samples",
    title: "Sample Requests",
    href: "/sample-requests",
    icon: FlaskConical,
    fetchTotal: async () => (await fetchSampleRequestList(1, 1)).data.pagination.totalCount,
  },
  {
    key: "downloads",
    title: "Download Requests",
    href: "/download-requests",
    icon: Download,
    fetchTotal: async () => (await fetchDownloadRequestList(1, 1)).data.pagination.totalCount,
  },
];

const QUICK_ACTIONS = [
  { title: "Products", href: "/products", icon: Package },
  { title: "Categories", href: "/product-categories", icon: FolderTree },
  { title: "Blogs", href: "/blogs", icon: Newspaper },
  { title: "Projects", href: "/projects", icon: Briefcase },
  { title: "Banners", href: "/home-banner", icon: Image },
  { title: "Bulk Upload", href: "/bulk-upload", icon: Upload },
];

const Index = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);

  // Redirected here by ProtectedRoute when a page isn't permitted for the user's role.
  useEffect(() => {
    if ((location.state as { denied?: boolean } | null)?.denied) {
      toast({
        title: "No access",
        description: "Your role doesn't have permission to open that page.",
        variant: "destructive",
      });
      window.history.replaceState({}, "");
    }
  }, [location.state, toast]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(COUNT_CARDS.map((c) => c.fetchTotal())).then((results) => {
      if (cancelled) return;
      const next: Record<string, number | null> = {};
      results.forEach((r, i) => {
        next[COUNT_CARDS[i].key] = r.status === "fulfilled" ? r.value : null;
      });
      setCounts(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Enquiries received through the website.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COUNT_CARDS.map(({ key, title, href, icon: Icon }) => (
          <Link key={key} to={href} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold text-foreground">{counts[key] ?? "—"}</div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ title, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Icon className="h-5 w-5 text-primary" />
              {title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
