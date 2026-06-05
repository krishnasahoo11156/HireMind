import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface AppStore {
  theme: Theme;
  blindMode: boolean;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleBlindMode: () => void;
  setBlindMode: (blindMode: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (sidebarCollapsed: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  theme: (localStorage.getItem('hiremind_theme') as Theme) ?? 'light',
  blindMode: false,
  sidebarCollapsed: false,
  setTheme: (theme) => {
    localStorage.setItem('hiremind_theme', theme);
    set({ theme });
  },
  toggleBlindMode: () => set((state) => ({ blindMode: !state.blindMode })),
  setBlindMode: (blindMode) => set({ blindMode }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed })
}));
