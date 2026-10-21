import { BulkUploadWizard } from "@/components/bulkUpload/BulkUploadWizard";

export default function ProductMainBulkUpload() {
  return (
    <BulkUploadWizard
      entity="product-main"
      title="Bulk Upload: Product Main"
      description="Create products fast — one row creates its category, attributes and attribute values along the way if they don't already exist, then the product and its SEO meta data."
      notes={[
        "A faster alternative to the Categories / Attributes / Attribute Values / Products sheets for ad-hoc product entry — not a replacement for them.",
        "Category is required. Sub-Category 1 and Sub-Category 2 are optional — leave them truly blank if this product doesn't need that many levels (don't type \"if any\" or similar — that's auto-ignored, but a real blank cell is clearer). Any level that doesn't exist yet is created automatically under the one before it. Sub-Category 2 can only be filled in if Sub-Category 1 is also filled in.",
        "Attributes lists each option this product has (e.g. Size, Color), separated by ; . Leave both this and the next column blank if this product has no options. The same attribute can't be listed twice in one row.",
        "Values for Each Attribute lists one value-group per attribute, in the same order as Attributes, separated by ; . If an attribute has more than one value, separate them with , (e.g. 120cm,140cm) — a variant is created automatically for every combination (2 sizes x 2 colors = 4 variants). Example pair: Attributes = Size;Color, Values for Each Attribute = 120cm,140cm;Oak,Black. The same value can't be listed twice for one attribute, and a value can't itself contain a comma.",
        "Filling in attributes always creates matching variants — even a single attribute with a single value creates one variant. There's no separate on/off switch for this.",
        "An attribute's type comes only from whether any of its values carries a hex code (e.g. Oak|#8B5A2B) — never from the attribute's name. No hex anywhere means it's created as type \"text\", even if the attribute is named \"Color\" (e.g. plain product codes as values is fine). A brand-new attribute introduced here is never type \"icon\".",
        "A missing value under an existing color or icon attribute is created from the text alone (used as its name/color name) even without a hex code or photo — upload the actual hex code, photo, or icon image and alt text afterward via the Attribute Values screen.",
        "Over about 100 variant combinations in one row gives a warning (not a hard stop) — you can still proceed, but consider splitting the product's options into a smaller set if it looks like a mistake.",
        "Features, Tags and Specifications are each comma-separated names, e.g. Bestseller,New Arrival for Tags. Leave blank for none. A missing one is created automatically. Ignored when updating an existing product — edit those from the product's screen instead.",
        "meta_title, meta_description and meta_keywords are required (same as the SEO Meta screen).",
        "title_ar, short_description_ar, product_description_ar, meta_title_ar, meta_description_ar and meta_keywords_ar are all optional — leave any of them blank and it defaults to its English counterpart. Fill one in only if the Arabic text should actually differ.",
        "No image, sort order, or active-status columns here — products are created with no image (active by default). Add the product's image afterward via its edit screen.",
        "A row with a title matching an existing product in the resolved category updates it (including its meta data); otherwise a new product and meta record are created. Attributes/Values/Features/Tags/Specifications are all ignored when updating (same as the Products sheet) — use the Product Variants sheet or Manage Variants for an existing product.",
        "The same title appearing more than once under a different category gives a warning (not a hard stop) — just a heads-up in case it's a mistake.",
        "No price column here.",
      ]}
    />
  );
}
