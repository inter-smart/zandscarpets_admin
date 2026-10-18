import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
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
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  RemoveFormatting,
  List,
  ListOrdered,
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
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
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
    content: value,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const textContent = editor.getText();
      
      if (maxLength && textContent.length > maxLength) {
        // Truncate content to maxLength
        const truncatedText = textContent.substring(0, maxLength);
        editor.commands.setContent(truncatedText);
        return;
      }
      
      onChange(content);
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
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
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

  const ToolbarButton = ({ onClick, isActive, disabled, children }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="border rounded-md">
        {/* Toolbar */}
        <div className="border-b bg-muted/50 p-2">
          <div className="flex flex-wrap gap-1">
            {/* Text Formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
            >
              <RemoveFormatting className="h-4 w-4" />
            </ToolbarButton>

            {/* Text Color */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
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
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive("heading", { level: 3 })}
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().setParagraph().run()}
              isActive={editor.isActive("paragraph")}
            >
              <Type className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Media & Links */}
            <ToolbarButton
              onClick={() => setShowImageModal(true)}
            >
              <ImageIcon className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => setShowIconSelector(true)}
            >
              <Smile className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={handleLinkToggle}
              isActive={editor.isActive("link")}
            >
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>

            {galleryMarker && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Insert the gallery swiper here"
                onClick={() => editor.chain().focus().insertContent("<p>[gallery]</p>").run()}
                className="h-8 gap-1 px-2 text-xs"
              >
                <GalleryHorizontal className="h-4 w-4" />
                Gallery
              </Button>
            )}

            <Separator orientation="vertical" className="mx-1 h-8" />

            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>

        {/* Editor */}
        <EditorContent
          editor={editor}
          className="p-3"
          style={{ minHeight: height ?? "300px" }}
          placeholder={placeholder}
        />
        
        {/* Character counter */}
        {maxLength && (
          <div className="px-3 py-2 border-t bg-muted/30 text-sm text-muted-foreground text-right">
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
