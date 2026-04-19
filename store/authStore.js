import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null, // Berisi { name, email, role: 'user' | 'admin' }
  isInitialized: false,

  login: (userData) => {
    sessionStorage.setItem('warhope_user', JSON.stringify(userData));
    set({ user: userData });
  },
  
  logout: () => {
    sessionStorage.removeItem('warhope_user');
    set({ user: null });
  },
  
  checkAuth: () => {
    const stored = sessionStorage.getItem('warhope_user');
    if (stored) {
      set({ user: JSON.parse(stored), isInitialized: true });
    } else {
      set({ isInitialized: true });
    }
  }
}));