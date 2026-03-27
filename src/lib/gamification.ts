/**
 * 遊戲化系統 — 徽章定義、積分規則、等級系統
 */

export interface AchievementDef {
  badge: string;
  title: string;
  icon: string;
  description: string;
  points: number;
}

// 所有徽章定義
export const ACHIEVEMENTS: AchievementDef[] = [
  { badge: "first_speaking", title: "初學者", icon: "🌟", description: "完成第一次口說練習", points: 10 },
  { badge: "reader_5", title: "書蟲", icon: "📖", description: "閱讀 5 篇文章", points: 20 },
  { badge: "vocab_80", title: "單字達人", icon: "🎯", description: "單字練習正確率超過 80%", points: 30 },
  { badge: "speaker_80", title: "小小演說家", icon: "🎤", description: "口說練習得分超過 80 分", points: 30 },
  { badge: "streak_3", title: "連續 3 天", icon: "🔥", description: "連續學習 3 天", points: 20 },
  { badge: "streak_7", title: "連續 7 天", icon: "🔥", description: "連續學習 7 天", points: 50 },
  { badge: "writer_3", title: "小作家", icon: "✍️", description: "完成 3 次寫作練習", points: 25 },
  { badge: "perfect_95", title: "滿分王", icon: "💯", description: "口說練習得到 95 分以上", points: 50 },
  { badge: "all_rounder", title: "全能學霸", icon: "📚", description: "每種練習各完成 10 次", points: 100 },
  { badge: "point_500", title: "英文小達人", icon: "👑", description: "累積 500 積分", points: 100 },
];

// 根據積分計算等級（1-10）
export function getLevel(points: number): { level: number; title: string; nextLevelPoints: number; progress: number } {
  const levels = [
    { min: 0, title: "新手村民" },
    { min: 50, title: "學習新星" },
    { min: 150, title: "英文勇者" },
    { min: 300, title: "知識探險家" },
    { min: 500, title: "單字騎士" },
    { min: 750, title: "文法法師" },
    { min: 1000, title: "閱讀大師" },
    { min: 1500, title: "口說達人" },
    { min: 2000, title: "英文學者" },
    { min: 3000, title: "英文大王" },
  ];

  let currentLevel = 1;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].min) {
      currentLevel = i + 1;
      break;
    }
  }

  const currentMin = levels[currentLevel - 1].min;
  const nextMin = currentLevel < levels.length ? levels[currentLevel].min : levels[levels.length - 1].min + 1000;
  const progress = Math.min(100, Math.round(((points - currentMin) / (nextMin - currentMin)) * 100));

  return {
    level: currentLevel,
    title: levels[currentLevel - 1].title,
    nextLevelPoints: nextMin,
    progress,
  };
}

// 每日任務類型
export interface MissionTemplate {
  missionType: string;
  description: string;
  points: number;
}

export const DAILY_MISSION_POOL: MissionTemplate[] = [
  { missionType: "read_article", description: "閱讀 1 篇文章", points: 5 },
  { missionType: "vocabulary_10", description: "完成 1 組單字練習", points: 5 },
  { missionType: "speaking_1", description: "完成 1 次口說練習", points: 5 },
  { missionType: "writing_1", description: "完成 1 次寫作練習", points: 5 },
];

// 為用戶生成今日任務（隨機 3-4 個）
export function generateDailyMissions(): MissionTemplate[] {
  const shuffled = [...DAILY_MISSION_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3 + Math.floor(Math.random() * 2)); // 3 or 4 missions
}
