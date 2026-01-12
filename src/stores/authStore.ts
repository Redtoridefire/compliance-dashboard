import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, Organization, User } from "@/types";
import { getSession, setSession, clearSession } from "@/lib/auth";

interface AuthState {
  session: Session | null;
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initializeSession: () => void;
  login: (session: Session) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setOrganization: (organization: Organization | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      organization: null,
      isLoading: true,
      isAuthenticated: false,

      initializeSession: () => {
        const session = getSession();
        set({
          session,
          isAuthenticated: !!session,
          isLoading: false,
        });
      },

      login: (session: Session) => {
        setSession(session);
        set({
          session,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        clearSession();
        set({
          session: null,
          user: null,
          organization: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (user) => set({ user }),
      setOrganization: (organization) => set({ organization }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
