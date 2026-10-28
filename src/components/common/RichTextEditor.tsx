import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BulletList } from "@tiptap/extension-bullet-list";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  RemoveFormatting,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Undo,
  Redo,
  Type,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Smile,
  Link as LinkIcon,
  Palette,
  GalleryHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IconSelector } from "./IconSelector";
import { ImageUploadModal } from "./ImageUploadModal";

// `<ul>` with this class renders with a check-circle marker on the storefront instead of a
// native bullet (see `.icon-bullet-list` in the storefront's globals.css and `.ProseMirror
// ul.icon-bullet-list` below for the editor's own preview). Plain bullet lists keep no class.
const ICON_BULLET_LIST_CLASS = "icon-bullet-list";

const BulletListWithClass = BulletList.extend({
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) =>
          attributes.class ? { class: attributes.class } : {},
      },
    };
  },
});

// Wraps a toolbar control with a hover/focus hint describing what it does.
const Tip = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const ToolbarButton = ({ onClick, isActive, disabled, title, children }: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => {
  const button = (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );

  // a disabled button swallows pointer events, so the tooltip hangs off a wrapper instead
  return (
    <Tip label={title}>
      {disabled ? <span className="inline-flex">{button}</span> : button}
    </Tip>
  );
};

// Uploaded images are saved as relative `/uploads/...` paths (the storefront API resolves them) but
// the editor needs a loadable URL, so the host is added on the way in and removed on the way out.
const IMAGE_BASE_URL = ((import.meta.env.VITE_IMAGE_URL as string | undefined) ?? "").replace(/\/$/, "");

const toEditorHtml = (html: string) =>
  IMAGE_BASE_URL ? html.replace(/(<img\b[^>]*?\bsrc=")\/uploads\//gi, `$1${IMAGE_BASE_URL}/uploads/`) : html;

const toStoredHtml = (html: string) =>
  IMAGE_BASE_URL
    ? html.split(`src="${IMAGE_BASE_URL}/uploads/`).join('src="/uploads/')
    : html;

interface RichTextEditorProps {
  label?: string;
  value?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  maxLength?: number;
  height?: string;
  dir?: "ltr" | "rtl";
  // bullet points show a check-circle icon (the storefront renders them the same way)
  checkList?: boolean;
  // adds a toolbar button that drops a `[gallery]` marker line (the blog page shows its swiper there)
  galleryMarker?: boolean;
  // stores an image chosen in the "Upload Image" tab and returns its URL
  uploadImage?: (file: File) => Promise<string>;
}

export function RichTextEditor({
  label,
  value = "",
  onChange,
  placeholder = "Start typing...",
  className,
  required = false,
  maxLength,
  height,
  dir,
  checkList = false,
  galleryMarker = false,
  uploadImage,
}: RichTextEditorProps) {
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      BulletListWithClass.configure({
        keepMarks: true,
        keepAttributes: false,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 cursor-pointer",
        },
      }),
      TextStyle,
      Color,
    ],
    content: toEditorHtml(value),
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const textContent = editor.getText();
      
      if (maxLength && textContent.length > maxLength) {
        // Truncate content to maxLength
        const truncatedText = textContent.substring(0, maxLength);
        editor.commands.setContent(truncatedText);
        return;
      }
      
      onChange(toStoredHtml(content));
    },
    editorProps: {
      attributes: {
        dir,
        class: cn(
          "prose prose-sm max-w-none focus:outline-none p-3",
          "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-5 [&_ol]:ps-5 [&_blockquote]:border-s-4 [&_blockquote]:ps-4 [&_blockquote]:italic",
          "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground",
          "prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground",
          "prose-blockquote:text-muted-foreground prose-blockquote:border-border",
          "prose-a:text-primary prose-a:underline",
          "prose-img:rounded-md prose-img:border"
          , dir === "rtl" && "text-right",
          checkList && "rte-check-list"
        ),
      },
      handleKeyDown: (view, event) => {
        if (maxLength) {
          const currentLength = editor?.getText().length || 0;
          
          // Allow backspace, delete, and navigation keys
          if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
            return false;
          }
          
          // Allow Ctrl/Cmd shortcuts
          if (event.ctrlKey || event.metaKey) {
            return false;
          }
          
          // Prevent new characters if at max length
          if (currentLength >= maxLength && event.key.length === 1) {
            event.preventDefault();
            return true;
          }
        }
        
        return false;
      },
    },
  });

  React.useEffect(() => {
    if (editor && toEditorHtml(value) !== editor.getHTML()) {
      editor.commands.setContent(toEditorHtml(value));
    }
  }, [value, editor]);

  const handleIconSelect = (iconName: string, iconSvg: string) => {
    if (editor) {
      const iconHtml = `<span class="inline-flex items-center justify-center w-4 h-4 mx-1" data-icon="${iconName}" title="${iconName}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <!-- ${iconName} icon placeholder -->
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </span>`;
      editor.chain().focus().insertContent(iconHtml).run();
    }
  };

  const handleImageInsert = (src: string, alt: string, title?: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src, alt, title }).run();
    }
  };

  const handleIconBulletList = () => {
    if (!editor) return;

    const isIconList =
      editor.isActive("bulletList") &&
      editor.getAttributes("bulletList").class === ICON_BULLET_LIST_CLASS;

    if (isIconList) {
      // already icon-style: drop back to a plain bullet list
      editor.chain().focus().updateAttributes("bulletList", { class: null }).run();
    } else if (editor.isActive("bulletList")) {
      // already a bullet list, just not icon-style yet: switch its marker
      editor.chain().focus().updateAttributes("bulletList", { class: ICON_BULLET_LIST_CLASS }).run();
    } else {
      editor
        .chain()
        .focus()
        .toggleBulletList()
        .updateAttributes("bulletList", { class: ICON_BULLET_LIST_CLASS })
        .run();
    }
  };

  const handleLinkToggle = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="flex flex-col overflow-hidden rounded-md border">
        {/* Toolbar */}
        <div className="shrink-0 border-b bg-muted/50 p-2">
          <div className="flex flex-wrap gap-1">
            {/* Text Formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="Strikethrough (Ctrl+Shift+S)"
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
              title="Clear formatting"
            >
              <RemoveFormatting className="h-4 w-4" />
            </ToolbarButton>

            {/* Text Color */}
            <Popover>
              <Tip label="Text color">
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Text color"
                  className="h-8 w-8 p-0 relative"
                >
                  <Palette className="h-4 w-4" />
                  {editor.getAttributes('textStyle').color && (
                    <div
                      className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white"
                      style={{ backgroundColor: editor.getAttributes('textStyle').color }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              </Tip>
              <PopoverContent className="w-64 p-3">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Color Picker</Label>
                    <input
                      type="color"
                      value={editor.getAttributes('textStyle').color || '#000000'}
                      className="w-full h-10 rounded border border-input bg-background cursor-pointer"
                      onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                      title="Select color"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Hex Color</Label>
                    <input
                      type="text"
                      placeholder="#000000"
                      defaultValue={editor.getAttributes('textStyle').color || ''}
                      className="w-full px-3 py-2 text-sm rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      onChange={(e) => {
                        const color = e.target.value;
                        if (color.match(/^#[0-9A-F]{6}$/i)) {
                          editor.chain().focus().setColor(color).run();
                        }
                      }}
                      onBlur={(e) => {
                        const color = e.target.value;
                        if (color && !color.startsWith('#')) {
                          e.target.value = '#' + color;
                        }
                      }}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().unsetColor().run()}
                    className="w-full"
                  >
                    Reset Color
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2 – large section title"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive("heading", { level: 3 })}
              title="Heading 3 – smaller sub-title"
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().setParagraph().run()}
              isActive={editor.isActive("paragraph")}
              title="Normal paragraph text"
            >
              <Type className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={
                editor.isActive("bulletList") &&
                editor.getAttributes("bulletList").class !== ICON_BULLET_LIST_CLASS
              }
              title="Bullet list (plain dots)"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={handleIconBulletList}
              isActive={
                editor.isActive("bulletList") &&
                editor.getAttributes("bulletList").class === ICON_BULLET_LIST_CLASS
              }
              title="Icon bullet list (check-circle marker)"
            >
              <ListChecks className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Numbered list"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              title="Quote block"
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Media & Links */}
            {/* only where images are stored (uploadImage) and shown on the storefront */}
            {uploadImage && (
              <ToolbarButton
                onClick={() => setShowImageModal(true)}
                title="Insert image (upload or paste a URL)"
              >
                <ImageIcon className="h-4 w-4" />
              </ToolbarButton>
            )}

            <ToolbarButton
              onClick={() => setShowIconSelector(true)}
              title="Insert icon"
            >
              <Smile className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={handleLinkToggle}
              isActive={editor.isActive("link")}
              title="Add or edit link (leave the URL empty to remove it)"
            >
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>

            {galleryMarker && (
              <Tip label="Insert the gallery swiper at the cursor ([gallery] marker)">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().insertContent("<p>[gallery]</p>").run()}
                  className="h-8 gap-1 px-2 text-xs"
                >
                  <GalleryHorizontal className="h-4 w-4" />
                  Gallery
                </Button>
              </Tip>
            )}

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>

        {/* Editor */}
        <EditorContent
          editor={editor}
          className="min-h-0 overflow-y-auto overscroll-contain [&_.ProseMirror]:min-h-full"
          // callers pass small values (120-250px) meant as a minimum; never go below 320px visible
          style={{ height: `max(${height ?? "0px"}, 320px)` }}
          placeholder={placeholder}
        />
        
        {/* Character counter */}
        {maxLength && (
          <div className="shrink-0 px-3 py-2 border-t bg-muted/30 text-sm text-muted-foreground text-right">
            {editor?.getText().length || 0}/{maxLength} characters
          </div>
        )}
      </div>

      {/* Modals */}
      <IconSelector
        isOpen={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelectIcon={handleIconSelect}
      />

      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onInsertImage={handleImageInsert}
        uploadImage={uploadImage}
      />
    </div>
  );
}
