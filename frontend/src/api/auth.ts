import { api, USE_MOCK } from "./client";
import { mockAuth } from "./mock";
import type { User } from "@/lib/roles";
import { tokenStore } from "@/lib/tokenStore";

export interface TokenPair { access_token: string; refresh_token: string; token_type: string }
export interface RegisterPayload { nom: string; prenom: string; email: string; password: string }

/**
 * Contrat avec le service Authentification (Regina) :
 *  POST /auth/register, /auth/login, /auth/refresh, GET /auth/me   (cahier des charges §6.7)
 *  POST /auth/forgot-password, /auth/reset-password                 (à ajouter : EF-04)
 */
export const authApi = {
  async login(email: string, password: string): Promise<TokenPair> {
    if (USE_MOCK) return mockAuth.login(email, password);
    return (await api.post<TokenPair>("/auth/login", { email, password })).data;
  },
  async register(p: RegisterPayload): Promise<void> {
    if (USE_MOCK) return mockAuth.register(p);
    await api.post("/auth/register", p);
  },
  async me(): Promise<User> {
    if (USE_MOCK) {
      const { tokenStore } = await import("@/lib/tokenStore");
      return mockAuth.me(tokenStore.getAccess() ?? "");
    }
    return (await api.get<User>("/auth/me")).data;
  },
  /** PATCH /auth/me {nom, prenom} → User  (à ajouter côté service Authentification) */
  async updateProfile(d: { nom: string; prenom: string }): Promise<User> {
    if (USE_MOCK) return mockAuth.updateProfile(tokenStore.getAccess() ?? "", d);
    return (await api.patch<User>("/auth/me", d)).data;
  },
  /** POST /auth/change-password {current_password, new_password}  (à ajouter côté service Authentification) */
  async changePassword(current: string, next: string): Promise<void> {
    if (USE_MOCK) return mockAuth.changePassword(tokenStore.getAccess() ?? "", current, next);
    await api.post("/auth/change-password", { current_password: current, new_password: next });
  },
  async refreshMock(refresh: string) { return mockAuth.refresh(refresh); },
  async forgotPassword(email: string): Promise<void> {
    if (USE_MOCK) return mockAuth.forgot();
    await api.post("/auth/forgot-password", { email });
  },
  async resetPassword(token: string, password: string): Promise<void> {
    if (USE_MOCK) return mockAuth.reset();
    await api.post("/auth/reset-password", { token, password });
  },
};
