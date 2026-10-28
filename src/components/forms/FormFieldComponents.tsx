import React from "react";
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";
import { X } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/common/FileUpload";
import { RichTextEditor } from "@/components/common/RichTextEditor";

// Base props for all form field components
interface BaseFormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  height?: string;
}

// Text Input Field Component
interface FormTextFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  type?: "text" | "email" | "url" | "password";
}

export function FormTextField<T extends FieldValues>({
  form,
  name,
  label,
  required,
  placeholder,
  type = "text",
}: FormTextFieldProps<T>) {
  const isArabic = name.endsWith("_ar");
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Input {...field} type={type} placeholder={placeholder} dir={isArabic ? "rtl" : undefined} className={isArabic ? "text-right" : undefined} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Number Input Field Component
interface FormNumberFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  min?: number;
  max?: number;
}

export function FormNumberField<T extends FieldValues>({
  form,
  name,
  label,
  required,
  placeholder,
  description,
  min,
  max,
}: FormNumberFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              type="number"
              placeholder={placeholder}
              min={min}
              max={max}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Textarea Field Component
interface FormTextareaFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  rows?: number;
}

export function FormTextareaField<T extends FieldValues>({
  form,
  name,
  label,
  required,
  placeholder,
  rows = 6,
}: FormTextareaFieldProps<T>) {
  const isArabic = name.endsWith("_ar");
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Textarea {...field} placeholder={placeholder} rows={rows} dir={isArabic ? "rtl" : undefined} className={isArabic ? "text-right" : undefined} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Select Field Component
interface FormSelectFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  options: { value: string; label: string }[];
}

export function FormSelectField<T extends FieldValues>({
  form,
  name,
  label,
  required,
  placeholder,
  options,
}: FormSelectFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Switch Field Component
interface FormSwitchFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  description?: string;
}

export function FormSwitchField<T extends FieldValues>({
  form,
  name,
  label,
  description,
}: FormSwitchFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">{label}</FormLabel>
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </div>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// File Upload Field Component
interface FormFileUploadFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  accept?: string;
  maxImageSize?: number;
  maxVideoSize?: number;
  preview?: boolean;
  recommendedDimensions?: string;
  validateImage?: (file: File) => Promise<string | null>;
}

export function FormFileUploadField<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  accept = "image/*",
  maxImageSize,
  maxVideoSize,
  preview = true,
  required,
  description,
  recommendedDimensions,
  validateImage,
}: FormFileUploadFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <FileUpload
              label={label}
              value={field.value}
              onChange={field.onChange}
              accept={accept}
              maxImageSize={maxImageSize}
              maxVideoSize={maxVideoSize}
              placeholder={placeholder}
              preview={preview}
              recommendedDimensions={recommendedDimensions}
              validateImage={validateImage}
            />
          </FormControl>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Rich Text Editor Field Component
interface FormRichTextFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  // height?: string;
  maxLength?: number;
  checkList?: boolean;
  galleryMarker?: boolean;
  uploadImage?: (file: File) => Promise<string>;
}

export function FormRichTextField<T extends FieldValues>({
  form,
  name,
  label,
  required,
  placeholder,
  height,
  maxLength,
  checkList,
  galleryMarker,
  uploadImage,
}: FormRichTextFieldProps<T>) {
  const isArabic = name.endsWith("_ar");
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder={placeholder}
              height={height}
              maxLength={maxLength}
              checkList={checkList}
              galleryMarker={galleryMarker}
              uploadImage={uploadImage}
              dir={isArabic ? "rtl" : undefined}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Date Input Field Component
export function FormDateField<T extends FieldValues>({
  form,
  name,
  label,
  required,
}: BaseFormFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Input {...field} type="datetime-local" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Slug Field Component (with auto-generation)
interface FormSlugFieldProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  sourceField: FieldPath<T>;
  generateSlug: (text: string) => string;
}

export function FormSlugField<T extends FieldValues>({
  form,
  name,
  label,
  required,
  placeholder,
  sourceField,
  generateSlug,
}: FormSlugFieldProps<T>) {
  const handleSlugGeneration = () => {
    const sourceValue = form.getValues(sourceField);
    if (sourceValue && typeof sourceValue === 'string') {
      const generatedSlug = generateSlug(sourceValue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue(name as any, generatedSlug as any);
    }
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <div className="flex gap-2">
              <Input {...field} placeholder={placeholder} />
              <button
                type="button"
                onClick={handleSlugGeneration}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                Generate
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Keywords Field Component (chip-style tag input, backed by a comma-separated
// string field value: type a keyword and press Enter/comma to set it, click
// the X on a chip to delete it)
export function FormKeywordsField<T extends FieldValues>({
  form,
  name,
  label,
  required,
  placeholder,
}: BaseFormFieldProps<T>) {
  const [inputValue, setInputValue] = React.useState("");
  const isArabic = name.endsWith("_ar");

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const keywords: string[] = (field.value ? String(field.value) : "")
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean);

        const setKeyword = (raw: string) => {
          const keyword = raw.trim();
          if (!keyword || keywords.includes(keyword)) return;
          field.onChange([...keywords, keyword].join(", "));
        };

        const deleteKeyword = (keyword: string) => {
          field.onChange(keywords.filter((k) => k !== keyword).join(", "));
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            setKeyword(inputValue);
            setInputValue("");
          } else if (e.key === "Backspace" && !inputValue && keywords.length) {
            deleteKeyword(keywords[keywords.length - 1]);
          }
        };

        return (
          <FormItem>
            <FormLabel>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FormLabel>
            <FormControl>
              <div className="space-y-2">
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => deleteKeyword(keyword)}
                          className="rounded-full p-0.5 hover:bg-secondary-foreground/20"
                          aria-label={`Remove ${keyword}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    setKeyword(inputValue);
                    setInputValue("");
                    field.onBlur();
                  }}
                  placeholder={placeholder}
                  dir={isArabic ? "rtl" : undefined}
                  className={isArabic ? "text-right" : undefined}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
