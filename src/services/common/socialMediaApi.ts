import { updateCmsStatus, updateCmsSortOrder } from "@/services/common/cmsOrderStatusApi";
import { apiFetch } from "@/lib/apiClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const baseUrl = `${API_BASE_URL}/site-settings/social-media`;

export interface SocialMedia {
  id?: number;
  media_path: string | null;
  media_alt: string;
  media_alt_ar?: string;
  link: string;
  sort_order?: number;
  is_active?: boolean;
  deleted_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SocialMediaResponse {
  success: boolean;
  message: string;
  timestamp: string;
  statusCode: number;
  data: {
    data: SocialMedia[];
    pagination: {
      totalCount: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      isSearchApplied: boolean;
    };
  };
}

export interface SocialMediaItemResponse {
  success: boolean;
  message: string;
  timestamp: string;
  statusCode: number;
  data: SocialMedia;
}

export interface CreateSocialMediaData {
  media_path?: File | string;
  media_alt: string;
  link: string;
  sort_order?: number;
  is_active?: boolean;
}

// Fetch all social media items
export const fetchSocialMediaList = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
): Promise<SocialMediaResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  const response = await apiFetch(`${baseUrl}?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch social media data");
  }

  return response.json();
};

// Fetch single social media item
export const fetchSocialMediaById = async (
  id: number,
): Promise<SocialMediaItemResponse> => {
  const response = await apiFetch(`${baseUrl}/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch social media item");
  }

  return response.json();
};

// Create social media item
export const createSocialMedia = async (
  formData: FormData,
): Promise<SocialMediaItemResponse> => {
  const response = await apiFetch(`${baseUrl}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to create social media item");
  }

  return response.json();
};

// Update social media item
export const updateSocialMedia = async (
  id: number,
  formData: FormData,
): Promise<SocialMediaItemResponse> => {
  const response = await apiFetch(`${baseUrl}/${id}`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to update social media item");
  }

  return response.json();
};

// Delete social media item
export const deleteSocialMedia = async (id: number): Promise<void> => {
  const response = await apiFetch(`${baseUrl}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete social media item");
  }
};

// Quick status toggle / sort-order change via the shared single-field CMS endpoints.
export const toggleSocialMediaStatus = (item: { id?: number | string }, isActive: boolean) =>
  updateCmsStatus("social-media", item.id!, isActive);

export const updateSocialMediaSortOrder = (item: { id?: number | string }, sortOrder: number) =>
  updateCmsSortOrder("social-media", item.id!, sortOrder);
