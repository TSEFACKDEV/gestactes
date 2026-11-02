/**
 * API du parcours administrateur.
 * Propriétaire : NZEUTEM DOMOE EUNICE FELIXTINE
 * TODO :
 *  [ ] Tester les protections du dernier admin.
 *  [ ] Ajouter les filtres avancés d'audit.
 */

import { api } from "@/lib/api";
import type {
  AuditEvent,
  FormField,
  Page,
  Role,
  Stats,
  TypeActe,
  User,
} from "@/types";

export async function fetchUsers(params?: {
  role?: Role;
  q?: string;
  page?: number;
  page_size?: number;
}): Promise<Page<User>> {
  const { data } = await api.get<Page<User>>("/admin/utilisateurs", { params });
  return data;
}

export async function createUser(payload: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: Role;
}): Promise<User> {
  const { data } = await api.post<User>("/admin/utilisateurs", payload);
  return data;
}

export async function updateUser(
  id: number,
  payload: {
    first_name?: string;
    last_name?: string;
    role?: Role;
    is_active?: boolean;
  },
): Promise<User> {
  const { data } = await api.patch<User>(`/admin/utilisateurs/${id}`, payload);
  return data;
}

export async function deactivateUser(id: number): Promise<void> {
  await api.delete(`/admin/utilisateurs/${id}`);
}

export async function fetchTypesAdmin(): Promise<TypeActe[]> {
  const { data } = await api.get<TypeActe[]>("/admin/types-actes");
  return data;
}

export async function createType(payload: {
  code: string;
  label: string;
  description: string;
  form_schema: FormField[];
  template_md: string;
}): Promise<TypeActe> {
  const { data } = await api.post<TypeActe>("/admin/types-actes", payload);
  return data;
}

export async function updateType(
  id: number,
  payload: {
    label?: string;
    description?: string;
    form_schema?: FormField[];
    template_md?: string;
    is_active?: boolean;
  },
): Promise<TypeActe> {
  const { data } = await api.patch<TypeActe>(`/admin/types-actes/${id}`, payload);
  return data;
}

export async function deactivateType(id: number): Promise<void> {
  await api.delete(`/admin/types-actes/${id}`);
}

export async function fetchAudit(params?: {
  actor_id?: number;
  action?: string;
  page?: number;
  page_size?: number;
}): Promise<Page<AuditEvent>> {
  const { data } = await api.get<Page<AuditEvent>>("/admin/audit", { params });
  return data;
}

export async function fetchStats(): Promise<Stats> {
  const { data } = await api.get<Stats>("/admin/statistiques");
  return data;
}
