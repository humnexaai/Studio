import { create } from "zustand";

type ThemeMode = "dark" | "light" | "system";

type UserState = {
  userId: string | null;
  name: string;
  credits: number;
  hindiMode: boolean;
  theme: ThemeMode;
  setUser: (payload: { userId: string; name: string }) => void;
  setCredits: (credits: number) => void;
  setHindiMode: (enabled: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  name: "Builder",
  credits: 100,
  hindiMode: false,
  theme: "dark",
  setUser: ({ userId, name }) => set({ userId, name }),
  setCredits: (credits) => set({ credits }),
  setHindiMode: (enabled) => set({ hindiMode: enabled }),
  setTheme: (theme) => set({ theme }),
}));
