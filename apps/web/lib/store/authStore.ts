import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: { id: string; name: string; email: string; role: string } | null;
  token: string | null;
  setAuth: (user: { id: string; name: string; email: string; role: string }, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user: { id: string; name: string; email: string; role: string }, token: string) => {
        localStorage.setItem('cbt_token', token);
        // Set cookie for middleware
        document.cookie = `cbt_token=${token}; path=/; max-age=28800`;
        set({ user, token });
      },
      clearAuth: () => {
        localStorage.removeItem('cbt_token');
        document.cookie = 'cbt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        set({ user: null, token: null });
      },
    }),
    {
      name: 'cbt-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
