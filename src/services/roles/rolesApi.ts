import { apiFetch } from "@/lib/apiClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ROLES_URL = `${API_BASE_URL}/roles`;

export type AccessLevel = "view" | "manage";

export interface PermissionModuleInfo {
  key: string;
  label: string;
  group: string;
  description?: string;
  /** Reads are open to every logged-in user (other forms use this data as lookups). */
  readOpen?: boolean;
}

export interface RoleRecord {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  /** module key → access; absent = no access */
  permissions: Record<string, AccessLevel>;
  user_count?: number;
}

export interface RoleOption {
  id: number;
  name: string;
  slug: string;
  is_system: boolean;
}

export interface RolePayload {
  name: string;
  description?: string | null;
  permissions: Record<string, AccessLevel>;
}

export class RoleApiError extends Error {}

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: { message?: string };
}

const parse = async <T>(response: Response): Promise<T> => {
  const body: Envelope<T> = await response.json().catch(() => ({}) as Envelope<T>);
  if (!response.ok || !body.success) {
    throw new RoleApiError(
      body.error?.message || body.message || `Request failed with status ${response.status}`,
    );
  }
  return body.data;
};

const json = (method: string, payload: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

export const fetchRoles = async (): Promise<RoleRecord[]> => parse(await apiFetch(ROLES_URL));

export const fetchRoleOptions = async (): Promise<RoleOption[]> =>
  parse(await apiFetch(`${ROLES_URL}/options`));

export const fetchPermissionModules = async (): Promise<PermissionModuleInfo[]> =>
  parse(await apiFetch(`${ROLES_URL}/modules`));

export const fetchRoleById = async (id: number): Promise<RoleRecord> =>
  parse(await apiFetch(`${ROLES_URL}/${id}`));

export const createRole = async (payload: RolePayload): Promise<RoleRecord> =>
  parse(await apiFetch(ROLES_URL, json("POST", payload)));

export const updateRole = async (id: number, payload: Partial<RolePayload>): Promise<RoleRecord> =>
  parse(await apiFetch(`${ROLES_URL}/${id}`, json("PUT", payload)));

export const deleteRole = async (id: number): Promise<void> => {
  await parse(await apiFetch(`${ROLES_URL}/${id}`, { method: "DELETE" }));
};
