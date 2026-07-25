import { create } from 'zustand';

type SessionUiState = {
  /** True right after successful sign-in / sign-up — show welcome once. */
  welcomePending: boolean;
  requestWelcome: () => void;
  clearWelcome: () => void;
};

export const useSessionUiStore = create<SessionUiState>((set) => ({
  welcomePending: false,
  requestWelcome: () => set({ welcomePending: true }),
  clearWelcome: () => set({ welcomePending: false }),
}));
