/**
 * 共用工具函式
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "早安";
  if (hour < 18) return "午安";
  return "晚安";
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "剛剛";
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 7) return `${days} 天前`;
  return formatDate(date);
}

export function getLevelLabel(level: string): string {
  switch (level) {
    case "LEVEL1": return "Level 1";
    case "LEVEL2": return "Level 2";
    case "LEVEL3": return "Level 3";
    default: return level;
  }
}

export function getLevelColor(level: string): string {
  switch (level) {
    case "LEVEL1": return "bg-success-100 text-success-700";
    case "LEVEL2": return "bg-primary-100 text-primary-700";
    case "LEVEL3": return "bg-accent-100 text-accent-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-success-500";
  if (score >= 60) return "text-accent-500";
  return "text-red-500";
}

export function getScoreEmoji(score: number): string {
  if (score >= 90) return "🌟";
  if (score >= 80) return "😊";
  if (score >= 60) return "👍";
  if (score >= 40) return "💪";
  return "🔄";
}
