"use client";

import { useState, useEffect } from "react";
import StudentLayout from "@/components/student/StudentLayout";

interface Achievement {
  badge: string;
  title: string;
  icon: string;
  description: string;
  points: number;
  earned: boolean;
  earnedAt: string | null;
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  points: number;
  streak: number;
  level: number;
  isMe: boolean;
}

interface Stats {
  points: number;
  streak: number;
  level: number;
  levelTitle: string;
  nextLevelPoints: number;
  levelProgress: number;
  totalPractices: number;
}

export default function AchievementsPage() {
  const [tab, setTab] = useState<"badges" | "leaderboard">("badges");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [className, setClassName] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [achieveRes, statsRes, lbRes] = await Promise.all([
        fetch("/api/gamification/achievements"),
        fetch("/api/gamification/stats"),
        fetch("/api/gamification/leaderboard"),
      ]);

      if (achieveRes.ok) {
        const data = await achieveRes.json();
        setAchievements(data.achievements);
        setEarnedCount(data.earnedCount);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (lbRes.ok) {
        const data = await lbRes.json();
        setLeaderboard(data.leaderboard);
        setClassName(data.className);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}`;
  };

  return (
    <StudentLayout>
      {/* 頂部統計 */}
      <div className="mb-4">
        <h1 className="text-kid-xl font-black text-gray-800 mb-1">🏆 成就中心</h1>
      </div>

      {stats && (
        <div className="card-kid bg-gradient-to-r from-kid-purple to-primary-500 text-white mb-4 !border-kid-purple">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-black">Lv.{stats.level}</p>
              <p className="text-xs opacity-90">{stats.levelTitle}</p>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs opacity-80 mb-1">
                <span>⭐ {stats.points} 積分</span>
                <span>下一級 {stats.nextLevelPoints}</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-white transition-all duration-1000"
                  style={{ width: `${stats.levelProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs opacity-80 mt-2">
                <span>🔥 連續 {stats.streak} 天</span>
                <span>💪 練習 {stats.totalPractices} 次</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 切換 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("badges")}
          className={`flex-1 py-3 rounded-xl font-black text-kid-sm transition-all ${
            tab === "badges"
              ? "bg-primary-500 text-white shadow-md"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          🎖️ 徽章 ({earnedCount}/{achievements.length})
        </button>
        <button
          onClick={() => setTab("leaderboard")}
          className={`flex-1 py-3 rounded-xl font-black text-kid-sm transition-all ${
            tab === "leaderboard"
              ? "bg-primary-500 text-white shadow-md"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          📊 排行榜
        </button>
      </div>

      {/* 徽章列表 */}
      {tab === "badges" && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <span className="text-4xl animate-bounce-slow">🏆</span>
              <p className="text-sm text-gray-400 mt-2">載入中...</p>
            </div>
          ) : (
            <>
              {/* 已解鎖 */}
              {achievements.filter((a) => a.earned).length > 0 && (
                <div className="mb-2">
                  <h2 className="text-kid-sm font-black text-success-600 mb-2">✅ 已解鎖</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {achievements
                      .filter((a) => a.earned)
                      .map((a) => (
                        <div
                          key={a.badge}
                          className="card-kid bg-success-50 !border-success-200 text-center py-4"
                        >
                          <span className="text-4xl block mb-1">{a.icon}</span>
                          <p className="font-black text-sm text-gray-800">{a.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{a.description}</p>
                          <p className="text-xs text-success-600 font-bold mt-1">+{a.points} 分</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 未解鎖 */}
              {achievements.filter((a) => !a.earned).length > 0 && (
                <div>
                  <h2 className="text-kid-sm font-black text-gray-400 mb-2">🔒 未解鎖</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {achievements
                      .filter((a) => !a.earned)
                      .map((a) => (
                        <div
                          key={a.badge}
                          className="card-kid bg-gray-50 !border-gray-200 text-center py-4 opacity-60"
                        >
                          <span className="text-4xl block mb-1 grayscale">{a.icon}</span>
                          <p className="font-black text-sm text-gray-500">{a.title}</p>
                          <p className="text-xs text-gray-400 mt-1">{a.description}</p>
                          <p className="text-xs text-gray-400 font-bold mt-1">+{a.points} 分</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 排行榜 */}
      {tab === "leaderboard" && (
        <div>
          <div className="card-kid bg-primary-50 !border-primary-200 mb-3 text-center">
            <p className="text-sm text-primary-700 font-bold">📋 {className} 排行榜</p>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <span className="text-4xl animate-bounce-slow">📊</span>
              <p className="text-sm text-gray-400 mt-2">載入中...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={`card-kid flex items-center gap-3 !py-3 ${
                    entry.isMe ? "!border-primary-400 bg-primary-50" : ""
                  } ${entry.rank <= 3 ? "!border-accent-300" : ""}`}
                >
                  <div className="w-10 text-center">
                    <span className={`font-black ${entry.rank <= 3 ? "text-2xl" : "text-lg text-gray-400"}`}>
                      {rankEmoji(entry.rank)}
                    </span>
                  </div>
                  <span className="text-2xl">{entry.avatar}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">
                      {entry.name}
                      {entry.isMe && (
                        <span className="text-xs text-primary-500 ml-1">（我）</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      Lv.{entry.level} · 🔥 {entry.streak} 天
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-accent-500">⭐ {entry.points}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 底部間距 */}
      <div className="h-8" />
    </StudentLayout>
  );
}
