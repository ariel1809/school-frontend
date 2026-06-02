import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export type AuthUser = {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  mfaRequired: boolean;
  pendingEmail: string | null;
  pendingPassword: string | null;

  login: (email: string, password: string, mfaCode?: string) => Promise<{ mfaRequired: boolean }>;
  refresh: () => Promise<string | null>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
  hasPermission: (perm: string) => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      mfaRequired: false,
      pendingEmail: null,
      pendingPassword: null,

      async login(email, password, mfaCode) {
        const res = await axios.post(`${baseURL}/v1/auth/login`, { email, password, mfaCode });
        const data = res.data.data;
        if (data.mfaRequired) {
          set({ mfaRequired: true, pendingEmail: email, pendingPassword: password });
          return { mfaRequired: true };
        }
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: {
            userId: data.userId,
            email: data.email,
            fullName: data.fullName,
            roles: data.roles ?? [],
            permissions: data.permissions ?? [],
          },
          mfaRequired: false,
          pendingEmail: null,
          pendingPassword: null,
        });
        return { mfaRequired: false };
      },

      async refresh() {
        const rt = get().refreshToken;
        if (!rt) return null;
        try {
          const res = await axios.post(`${baseURL}/v1/auth/refresh`, { refreshToken: rt });
          const data = res.data.data;
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: {
              userId: data.userId,
              email: data.email,
              fullName: data.fullName,
              roles: data.roles ?? [],
              permissions: data.permissions ?? [],
            },
          });
          return data.accessToken as string;
        } catch {
          get().logout();
          return null;
        }
      },

      logout() {
        const rt = get().refreshToken;
        if (rt) {
          axios.post(`${baseURL}/v1/auth/logout`, { refreshToken: rt }).catch(() => undefined);
        }
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          mfaRequired: false,
          pendingEmail: null,
          pendingPassword: null,
        });
      },

      hasRole(role) {
        return get().user?.roles.includes(role) ?? false;
      },
      hasAnyRole(...roles) {
        const userRoles = get().user?.roles ?? [];
        return roles.some((r) => userRoles.includes(r));
      },
      hasPermission(perm) {
        return get().user?.permissions.includes(perm) ?? false;
      },
    }),
    {
      name: 'school-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
