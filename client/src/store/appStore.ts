import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface AppStore {
  theme: Theme;
  blindMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleBlindMode: () => void;
  setBlindMode: (blindMode: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  theme: (localStorage.getItem('hiremind_theme') as Theme) ?? 'light',
  blindMode: false,
  setTheme: (theme) => {
    localStorage.setItem('hiremind_theme', theme);
    set({ theme });
  },
  toggleBlindMode: () => set((state) => ({ blindMode: !state.blindMode })),
  setBlindMode: (blindMode) => set({ blindMode })
}));
