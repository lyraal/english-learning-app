import { create } from "zustand";

interface AppState {
  // 學生端全域狀態
  points: number;
  streak: number;
  todayPracticeCount: number;

  // Actions
  addPoints: (amount: number) => void;
  incrementStreak: () => void;
  incrementPractice: () => void;
  setUserData: (data: { points: number; streak: number }) => void;
}

export const useAppStore = create<AppState>((set) => ({
  points: 0,
  streak: 0,
  todayPracticeCount: 0,

  addPoints: (amount) =>
    set((state) => ({ points: state.points + amount })),

  incrementStreak: () =>
    set((state) => ({ streak: state.streak + 1 })),

  incrementPractice: () =>
    set((state) => ({ todayPracticeCount: state.todayPracticeCount + 1 })),

  setUserData: (data) =>
    set({ points: data.points, streak: data.streak }),
}));
