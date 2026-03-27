"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import StudentLayout from "@/components/student/StudentLayout";
import { getGreeting } from "@/lib/utils";

interface DashboardData {
  todayTasks: Array<{
    id: string;
    title: string;
    type: string;
    dueDate: string;
    completed: boolean;
  }>;
  weeklyProgress: {
    practiceDays: number;
    totalPractices: number;
    avgScore: number;
  };
  recentArticles: Array<{
    id: string;
    title: string;
    level: string;
  }>;
}

interface StatsData {
  points: number;
  streak: number;
  level: number;
  levelTitle: string;
  nextLevelPoints: number;
  levelProgress: number;
  recentAchievements: Array<{
    badge: string;
    title: string;
    icon: string;
  }>;
}

interface DailyMission {
  id: string;
  missionType: string;
  description: string;
  completed: boolean;
  points: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [missions, setMissions] = useState<DailyMission[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [dashRes, statsRes, missionRes] = await Promise.all([
        fetch("/api/progress/dashboard"),
        fetch("/api/gamification/stats"),
        fetch("/api/gamification/daily-missions"),
      ]);

      if (dashRes.ok) setData(await dashRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (missionRes.ok) {
        const m = await missionRes.json();
        setMissions(m.missions || []);
      }

      // 背景檢查徽章
      fetch("/api/gamification/check", { method: "POST" });
    } catch {
      // fallback
    }
  }

  const missionIcon = (type: string) => {
    switch (type) {
      case "read_article": return "📖";
      case "vocabulary_10": return "✏️";
      case "speaking_1": return "🎤";
      case "writing_1": return "✍️";
      default: return "📝";
    }
  };

  return (
    <StudentLayout>
      {/* 問候語 */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-5xl animate-wiggle">🐱</span>
          <div>
            <h1 className="text-kid-xl font-black text-gray-800">
              {getGreeting()}，{user?.name || "同學"}！
            </h1>
            <p className="text-kid-sm text-gray-500">今天也要加油練習喔！</p>
          </div>
        </div>
      </div>

      {/* 等級 & 積分卡 */}
      <div className="card-kid bg-gradient-to-r from-accent-400 to-accent-500 text-white mb-4 !border-accent-400">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs opacity-90">
              Lv.{stats?.level || 1} {stats?.levelTitle || "新手村民"}
            </p>
            <p className="text-3xl font-black">⭐ {stats?.points ?? user?.points ?? 0}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-90">連續練習</p>
            <p className="text-3xl font-black">{stats?.streak ?? user?.streak ?? 0} 天 🔥</p>
          </div>
        </div>
        {stats && (
          <div>
            <div className="flex justify-between text-xs opacity-80 mb-1">
              <span>升級進度</span>
              <span>{stats.nextLevelPoints} 分升級</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-white transition-all duration-1000"
                style={{ width: `${stats.levelProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 最近獲得的徽章 */}
      {stats?.recentAchievements && stats.recentAchievements.length > 0 && (
        <Link href="/achievements" className="card-kid mb-4 block hover:border-kid-purple">
          <p className="text-xs text-gray-500 font-bold mb-2">🎖️ 最近獲得</p>
          <div className="flex gap-3">
            {stats.recentAchievements.slice(0, 4).map((a) => (
              <div key={a.badge} className="text-center">
                <span className="text-2xl block">{a.icon}</span>
                <p className="text-xs text-gray-500 mt-0.5">{a.title}</p>
              </div>
            ))}
            <div className="flex items-center text-xs text-primary-500 font-bold ml-auto">
              查看全部 →
            </div>
          </div>
        </Link>
      )}

      {/* 每日任務 */}
      <div className="mb-6">
        <h2 className="text-kid-lg font-black text-gray-700 mb-3">🎯 每日任務</h2>
        <div className="space-y-2">
          {missions.length > 0 ? (
            missions.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "card-kid flex items-center gap-3 !py-3",
                  m.completed && "opacity-60"
                )}
              >
                <span className="text-2xl">{m.completed ? "✅" : missionIcon(m.missionType)}</span>
                <div className="flex-1">
                  <p className="font-bold text-kid-sm">{m.description}</p>
                </div>
                {m.completed ? (
                  <span className="text-success-500 font-bold text-xs">已完成</span>
                ) : (
                  <span className="text-xs bg-accent-100 text-accent-600 px-2 py-1 rounded-full font-bold">
                    +{m.points} ⭐
                  </span>
                )}
              </div>
            ))
          ) : (
            // fallback: 用舊的 todayTasks
            data?.todayTasks && data.todayTasks.length > 0 ? (
              data.todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "card-kid flex items-center gap-3 !py-3",
                    task.completed && "opacity-60"
                  )}
                >
                  <span className="text-2xl">
                    {task.completed
                      ? "✅"
                      : task.type === "READING"
                      ? "📖"
                      : task.type === "SPEAKING"
                      ? "🎤"
                      : "✏️"}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-kid-sm">{task.title}</p>
                    <p className="text-xs text-gray-400">截止：{task.dueDate}</p>
                  </div>
                  {task.completed ? (
                    <span className="text-success-500 font-bold text-sm">已完成</span>
                  ) : (
                    <span className="text-accent-500 font-bold text-sm">待完成</span>
                  )}
                </div>
              ))
            ) : (
              <div className="card-kid text-center py-4">
                <span className="text-3xl mb-2 block">🎉</span>
                <p className="text-kid-sm text-gray-500">任務載入中...</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* 快速開始 */}
      <div className="mb-6">
        <h2 className="text-kid-lg font-black text-gray-700 mb-3">🚀 快速開始</h2>
        <div className="grid grid-cols-4 gap-2">
          <Link
            href="/articles"
            className="card-kid text-center py-4 hover:border-primary-300 !p-2"
          >
            <span className="text-3xl block mb-1">📖</span>
            <span className="text-xs font-bold text-primary-600">閱讀</span>
          </Link>
          <Link
            href="/vocabulary"
            className="card-kid text-center py-4 hover:border-success-300 !p-2"
          >
            <span className="text-3xl block mb-1">✏️</span>
            <span className="text-xs font-bold text-success-600">單字</span>
          </Link>
          <Link
            href="/speaking"
            className="card-kid text-center py-4 hover:border-accent-300 !p-2"
          >
            <span className="text-3xl block mb-1">🎤</span>
            <span className="text-xs font-bold text-accent-600">口說</span>
          </Link>
          <Link
            href="/writing"
            className="card-kid text-center py-4 hover:border-kid-purple !p-2"
          >
            <span className="text-3xl block mb-1">✍️</span>
            <span className="text-xs font-bold text-purple-600">寫作</span>
          </Link>
        </div>
      </div>

      {/* 本週進度 */}
      <div className="mb-6">
        <h2 className="text-kid-lg font-black text-gray-700 mb-3">📊 本週進度</h2>
        <div className="card-kid">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-black text-primary-500">
                {data?.weeklyProgress?.practiceDays ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">練習天數</p>
            </div>
            <div>
              <p className="text-3xl font-black text-success-500">
                {data?.weeklyProgress?.totalPractices ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">練習次數</p>
            </div>
            <div>
              <p className="text-3xl font-black text-accent-500">
                {data?.weeklyProgress?.avgScore ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">平均分數</p>
            </div>
          </div>
        </div>
      </div>

      {/* 推薦文章 */}
      <div>
        <h2 className="text-kid-lg font-black text-gray-700 mb-3">📚 推薦文章</h2>
        <div className="space-y-2">
          {(data?.recentArticles || defaultArticles).map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.id}`}
              className="card-kid flex items-center gap-3 !py-3"
            >
              <span className="text-2xl">📖</span>
              <div className="flex-1">
                <p className="font-bold text-kid-sm">{article.title}</p>
              </div>
              <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full font-bold">
                {article.level.replace("LEVEL", "Lv.")}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

const defaultArticles = [
  { id: "1", title: "My Pet Cat", level: "LEVEL1" },
  { id: "2", title: "My Family", level: "LEVEL1" },
  { id: "3", title: "At the Park", level: "LEVEL2" },
];
