import { z } from "zod";

// Blocks any HTML/script-like markup (e.g. <script>, <img onerror=...>) in plain text inputs.
const HTML_TAG_PATTERN = /<[^>]*>/;

// Shared base for short text inputs (title, name, label, etc.): required,
// trimmed, and rejects HTML/script tags. Chain further rules (e.g. `.max()`)
// on the returned schema for per-form custom constraints.
const safeText = (fieldName: string, min = 1) =>
  z
    .string()
    .trim()
    .min(min, `${fieldName} is required`)
    .refine((val) => !HTML_TAG_PATTERN.test(val), `${fieldName} must not contain HTML or script tags`);

// Same tag rejection, but optional (no min-length requirement).
const optionalSafeText = z
  .string()
  .trim()
  .refine((val) => !HTML_TAG_PATTERN.test(val), "Must not contain HTML or script tags")
  .optional();

// Common validation patterns
export const commonValidations = {
  // String validations
  requiredString: (fieldName: string) => safeText(fieldName),

  optionalString: z.string().optional(),

  optionalSafeText,

  requiredText: (fieldName: string) => safeText(fieldName),
  
  // Number validations
  sortOrder: z
    .string()
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0;
    }, "Sort order must be a positive integer")
    .optional(),
  
  requiredNumber: (fieldName: string) => 
    z.number().min(0, `${fieldName} must be 0 or greater`),
  
  optionalNumber: z.number().optional(),
  
  // Status validations
  booleanStatus: z.boolean(),
  
  statusEnum: z.enum(["active", "inactive"]),
  
  publishStatus: z.enum(["published", "draft"]),
  
  // email validation
  requiredEmail:
    z.string().min(1, "Email is required").email('Invalid Email'),

  optionalEmail: z.string().email().optional(),

  // Username validation — mirrors server's username rule (3-50 chars, alnum+underscore)
  username: z
    .string()
    .min(3, "Username must be between 3 and 50 characters")
    .max(50, "Username must be between 3 and 50 characters"),

  // Password validation — length only (8–128), same as the server's passwordRule
  requiredPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),

  optionalPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .optional()
    .or(z.literal("")),

  // Admin user role
  userRole: z.enum(["admin", "user"]),
  // Media validations
  mediaType: z.enum(["image", "video"]),
  
  fileUpload: z.any().optional(),

  requiredFile: (fieldName: string) =>
    z.custom<File | string>(
      (val) => val instanceof File || (typeof val === "string" && val.trim().length > 0),
      { message: `${fieldName} is required` }
    ),

  // Required upload that must be an SVG: a new File, or an existing saved path ending in .svg.
  requiredSvgFile: (fieldName: string) =>
    z
      .custom<File | string>(
        (val) => val instanceof File || (typeof val === "string" && val.trim().length > 0),
        { message: `${fieldName} is required` }
      )
      .refine(
        (val) =>
          val instanceof File
            ? val.type === "image/svg+xml" || val.name.toLowerCase().endsWith(".svg")
            : typeof val !== "string" || !val.trim() || /\.svg(\?.*)?$/i.test(val.trim()),
        { message: `${fieldName} must be an SVG file` }
      ),

  optionalFile: z
    .custom<File | string>(
      (val) =>
        val == null ||
        val === "" ||
        val instanceof File ||
        (typeof val === "string" && val.trim().length > 0),
      { message: "Invalid file" }
    )
    .optional(),

  // URL validations
  optionalUrl: z.string().regex(/^\/.*/, "Must start with /").optional().or(z.literal("")),
  
  requiredUrl: (fieldName: string) => 
    z.string().regex(/^\/.*/, `${fieldName} must start with /`),
  
  // Date validations
  dateString: z.string().min(1, "Date is required"),
  
  optionalDate: z.string().optional(),
  
  // Array validations
  tagArray: z.array(z.number()).optional(),
  
  categoryArray: z.array(z.number()).min(1, "At least one category is required"),
  
  // Rich text validation — TipTap stores HTML, so the tag-rejecting
  // safeText rule must not be used here. Strip tags/nbsp and require the
  // remaining text content (an empty editor yields "<p></p>").
  richText: (fieldName: string) =>
    z
      .string()
      .refine(
        (val) =>
          val
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .trim().length > 0,
        `${fieldName} is required`,
      ),

  optionalRichText: z.string().optional(),
};

// Form data construction utilities
export const createFormDataWithFiles = (
  data: Record<string, any>, 
  files: Record<string, File | string | null> = {}
): FormData => {
  const formData = new FormData();
  
  // Add regular fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(`${key}[${index}]`, item.toString());
        });
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  
  // Add file fields
  Object.entries(files).forEach(([key, file]) => {
    if (file instanceof File) {
      formData.append(key, file);
    } else if (typeof file === 'string' && file) {
      formData.append(key, file);
    }
  });
  
  return formData;
};

// Check if form data contains files
export const hasFileUploads = (data: Record<string, any>): boolean => {
  return Object.values(data).some(value => value instanceof File);
};

// API submission helper that automatically handles content-type
export const submitFormData = async (
  url: string,
  data: Record<string, any>,
  options: {
    method?: 'POST' | 'PUT' | 'PATCH';
    token?: string;
  } = {}
): Promise<Response> => {
  const { method = 'POST', token } = options;
  
  const hasFiles = hasFileUploads(data);
  const headers: HeadersInit = {};
  
  // Add authorization if token provided
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  let body: BodyInit;
  
  if (hasFiles) {
    // For file uploads, use FormData and let browser set Content-Type
    body = createFormDataWithFiles(data);
    // DON'T set Content-Type - browser will set it automatically with boundary
  } else {
    // For regular JSON data
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(data);
  }
  
  return fetch(url, {
    method,
    headers,
    body,
  });
};

// Slug generation utility
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Default values generators
export const createDefaultFormValues = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>
): Partial<T> => {
  // This is a helper to create default values based on schema
  // You can extend this based on your specific needs
  return {};
};

// Form field error extractors
export const getFieldError = (
  errors: Record<string, any>, 
  fieldName: string
): string | undefined => {
  return errors[fieldName]?.message;
};

// File validation utilities
export const validateFileType = (
  file: File, 
  allowedTypes: string[]
): boolean => {
  return allowedTypes.some(type => file.type.startsWith(type));
};

export const validateFileSize = (
  file: File, 
  maxSizeInBytes: number
): boolean => {
  return file.size <= maxSizeInBytes;
};

// Common field transformation utilities
export const transformSortOrder = (value: string): number => {
  const num = parseInt(value);
  return isNaN(num) ? 0 : num;
};

export const transformBooleanFromString = (value: string): boolean => {
  return value === "true" || value === "1" || value === "active";
};

// Form submission helpers
export const handleFormSubmission = async <T>(
  data: T,
  submitFn: (data: T) => Promise<any>,
  options: {
    onSuccess?: (result: any) => void;
    onError?: (error: Error) => void;
    successMessage?: string;
    errorMessage?: string;
  } = {}
) => {
  try {
    const result = await submitFn(data);
    options.onSuccess?.(result);
    return result;
  } catch (error) {
    options.onError?.(error as Error);
    throw error;
  }
};