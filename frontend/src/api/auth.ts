/**
 * API d'authentification.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO : tester les erreurs 401/403/409 sur le backend réel.
 */

import { api, USE_MOCK } from "./client";
import { mockAuth } from "./mock";
import type { Role, User } from "@/lib/roles";
import { tokenStore } from "@/lib/tokenStore";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterPayload {
  nom: string;
  prenom: string;
  email: string;
  password: string;
}

interface BackendUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

function mapUser(user: BackendUser): User {
  return {
    ...user,
    nom: user.last_name,
    prenom: user.first_name,
    actif: user.is_active,
  };
}

export const authApi = {
  async login(email: string, password: string): Promise<TokenPair> {
    if (USE_MOCK) return mockAuth.login(email, password);
    const { data } = await api.post<{ access_token: string; token_type: string }>(
      "/auth/login",
      { email, password },
    );
    return {
      access_token: data.access_token,
      refresh_token: "",
      token_type: data.token_type ?? "bearer",
    };
  },

  async register(payload: RegisterPayload): Promise<void> {
    if (USE_MOCK) return mockAuth.register(payload);
    await api.post("/auth/register", {
      first_name: payload.prenom,
      last_name: payload.nom,
      email: payload.email,
      password: payload.password,
    });
  },

  async me(): Promise<User> {
    if (USE_MOCK) {
      return mockAuth.me(tokenStore.getAccess() ?? "");
    }
    const { data } = await api.get<BackendUser>("/auth/me");
    return mapUser(data);
  },

  async updateProfile(payload: { nom: string; prenom: string }): Promise<User> {
    if (USE_MOCK) {
      return mockAuth.updateProfile(tokenStore.getAccess() ?? "", payload);
    }
    const { data } = await api.patch<BackendUser>("/auth/me", {
      first_name: payload.prenom,
      last_name: payload.nom,
    });
    return mapUser(data);
  },

  async changePassword(current: string, next: string): Promise<void> {
    if (USE_MOCK) {
      return mockAuth.changePassword(tokenStore.getAccess() ?? "", current, next);
    }
    await api.post("/auth/change-password", {
      current_password: current,
      new_password: next,
    });
  },

  async refreshMock(refresh: string) {
    return mockAuth.refresh(refresh);
  },

  async forgotPassword(email: string): Promise<void> {
    if (USE_MOCK) return mockAuth.forgot();
    await api.post("/auth/forgot-password", { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    if (USE_MOCK) return mockAuth.reset();
    await api.post("/auth/reset-password", {
      token,
      new_password: password,
    });
  },
};
