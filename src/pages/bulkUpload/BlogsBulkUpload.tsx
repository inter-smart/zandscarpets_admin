import { BulkUploadWizard } from "@/components/bulkUpload/BulkUploadWizard";

export default function BlogsBulkUpload() {
  return (
    <BulkUploadWizard
      entity="blogs"
      title="Bulk Upload: Blogs"
      description="Import blog posts, with their SEO meta data, from a spreadsheet."
      notes={[
        "The column names match the old blog export, so its columns can be pasted straight into the template.",
        "Images are not uploaded here. Put the image files in the server's uploads/blog_images/ folder first, then enter just the file name (for example image123.jpg) in the Image column. File names are case-sensitive.",
        "If an image file isn't found, the post is still imported but left inactive. Add the file, then upload the sheet again to activate it.",
        "A row updates an existing blog when its cleaned Canonical Name (slug) matches; otherwise a new blog is created. A blank or unusable Canonical Name is generated from the Title.",
        "Text is cleaned automatically: whitespace trimmed, HTML entities such as &nbsp; decoded, and line breaks in the Description turned into paragraphs.",
        "Two rows with the same Title or slug are rejected, so remove the duplicate. Test posts (a Disabled post titled \"testing\") are skipped.",
        "Image Alt Text is imported as the image's alt text. If it is blank or a placeholder such as \"Image\", the Title is used instead.",
        "Meta Title,Meta Keyword and Meta Description default to the Title, Title and Small Description when blank. Other Meta Tags is ignored.",
        "Posted Date must be YYYY-MM-DD. A future date keeps the post hidden on the website until that day. There are no Arabic columns; Arabic fields copy the English text.",
      ]}
    />
  );
}
