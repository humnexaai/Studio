import { create } from "zustand";

type ThemeMode = "dark" | "light" | "system";

type UserState = {
  userId: string | null;
  name: string;
  credits: number;
  planCode: "free" | "starter" | "pro" | "business";
  hindiMode: boolean;
  theme: ThemeMode;
  setUser: (payload: { userId: string; name: string }) => void;
  setCredits: (credits: number) => void;
  setPlanCode: (planCode: UserState["planCode"]) => void;
  setHindiMode: (enabled: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  name: "Builder",
  credits: 100,
  planCode: "free",
  hindiMode: false,
  theme: "dark",
  setUser: ({ userId, name }) => set({ userId, name }),
  setCredits: (credits) => set({ credits }),
  setPlanCode: (planCode) => set({ planCode }),
  setHindiMode: (enabled) => set({ hindiMode: enabled }),
  setTheme: (theme) => set({ theme }),
}));
