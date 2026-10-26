import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Landing page for the Bulk Upload section: explains the required order.
// Per-entity "N created" status badges (GET /bulk-upload/status) are a
// later polish item, not part of the first vertical slice — this page
// links straight to each step instead.

const STEPS = [
  { order: 1, title: "Categories", url: "/bulk-upload/categories", description: "Create categories at any depth." },
  { order: 2, title: "Attributes", url: "/bulk-upload/attributes", description: "Create attribute dimensions (Size, Color, …)." },
  { order: 3, title: "Attribute Values", url: "/bulk-upload/attribute-values", description: "Create values for existing attributes." },
  { order: 4, title: "Media", url: "/bulk-upload/media", description: "Upload product/variant images and get stored paths." },
  { order: 5, title: "Products", url: "/bulk-upload/products", description: "Create products with category, attributes and images." },
  { order: 6, title: "Product Variants", url: "/bulk-upload/product-variants", description: "Generate variants from attribute-value combinations." },
];

export default function BulkUploadHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bulk Upload</h1>
        <p className="text-muted-foreground mt-1">
          Populate the product catalog in bulk using downloadable spreadsheet templates.
        </p>
      </div>

      <Alert>
        <AlertTitle>How bulk upload works</AlertTitle>
        <AlertDescription>
          Each step is validated first — nothing is saved until you review the result and confirm. Go through the
          steps in order below: each one depends on the data created by the step before it.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((step) => (
          <Link key={step.url} to={step.url}>
            <Card className="hover:border-primary transition-colors h-full">
              <CardHeader>
                <CardTitle className="text-base">
                  {step.order}. {step.title}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Or: add products fast</h2>
        <p className="text-muted-foreground text-sm mt-1">
          A shortcut for ad-hoc product entry — not a replacement for the steps above.
        </p>
      </div>
      <Link to="/bulk-upload/product-main">
        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="text-base">Product Main</CardTitle>
            <CardDescription>
              One row creates its category path, attributes and attribute values along the way if they don't
              already exist, then the product itself — with images and SEO meta data. No separate sheets to
              pre-fill.
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>

      <div>
        <h2 className="text-lg font-semibold">Blogs</h2>
        <p className="text-muted-foreground text-sm mt-1">Separate from the product catalog steps above.</p>
      </div>
      <Link to="/bulk-upload/blogs">
        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle className="text-base">Blogs</CardTitle>
            <CardDescription>
              Import blog posts and their SEO meta data from a spreadsheet. Image files must already be in the
              server's blog images folder.
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </div>
  );
}
