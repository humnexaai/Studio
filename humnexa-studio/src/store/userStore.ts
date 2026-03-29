import { create } from "zustand";

type ThemeMode = "dark" | "light" | "system";

type UserState = {
  userId: string | null;
  name: string;
  email: string | null;
  credits: number;
  planCode: "free" | "starter" | "pro" | "business" | "student";
  lastModel: string;
  hindiMode: boolean;
  theme: ThemeMode;
  editorFontSize: number;
  editorTabSize: 2 | 4;
  editorFontFamily: "JetBrains Mono" | "Fira Code";
  setUser: (payload: { userId: string; name: string; email?: string | null }) => void;
  setCredits: (credits: number) => void;
  setPlanCode: (planCode: UserState["planCode"]) => void;
  setLastModel: (model: string) => void;
  setHindiMode: (enabled: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setEditorFontSize: (value: number) => void;
  setEditorTabSize: (value: 2 | 4) => void;
  setEditorFontFamily: (value: "JetBrains Mono" | "Fira Code") => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  name: "Builder",
  email: null,
  credits: 100,
  planCode: "free",
  lastModel: "groq",
  hindiMode: false,
  theme: "dark",
  editorFontSize: 14,
  editorTabSize: 2,
  editorFontFamily: "JetBrains Mono",
  setUser: ({ userId, name, email = null }) => set({ userId, name, email }),
  setCredits: (credits) => set({ credits }),
  setPlanCode: (planCode) => set({ planCode }),
  setLastModel: (lastModel) => set({ lastModel }),
  setHindiMode: (enabled) => set({ hindiMode: enabled }),
  setTheme: (theme) => set({ theme }),
  setEditorFontSize: (editorFontSize) => set({ editorFontSize }),
  setEditorTabSize: (editorTabSize) => set({ editorTabSize }),
  setEditorFontFamily: (editorFontFamily) => set({ editorFontFamily }),
}));
