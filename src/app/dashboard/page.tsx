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

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/progress/dashboard");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Use fallback data
    }
  }

  return (
    <StudentLayout>
      {/* 問候語 */}
      <div className="mb-6">
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

      {/* 連續天數 */}
      <div className="card-kid bg-gradient-to-r from-accent-400 to-accent-500 text-white mb-4 !border-accent-400">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">連續練習</p>
            <p className="text-3xl font-black">{user?.streak || 0} 天 🔥</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">累計星星</p>
            <p className="text-3xl font-black">⭐ {user?.points || 0}</p>
          </div>
        </div>
      </div>

      {/* 今日任務 */}
      <div className="mb-6">
        <h2 className="text-kid-lg font-black text-gray-700 mb-3">
          📝 今日任務
        </h2>
        <div className="space-y-3">
          {data?.todayTasks && data.todayTasks.length > 0 ? (
            data.todayTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "card-kid flex items-center gap-3",
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
                  <p className="text-xs text-gray-400">
                    截止：{task.dueDate}
                  </p>
                </div>
                {task.completed ? (
                  <span className="text-success-500 font-bold text-sm">
                    已完成
                  </span>
                ) : (
                  <span className="text-accent-500 font-bold text-sm">
                    待完成
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="card-kid text-center py-6">
              <span className="text-4xl mb-2 block">🎉</span>
              <p className="text-kid-sm text-gray-500">
                今天沒有指派任務，自由練習吧！
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 快速開始 */}
      <div className="mb-6">
        <h2 className="text-kid-lg font-black text-gray-700 mb-3">
          🚀 快速開始
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/articles"
            className="card-kid text-center py-5 hover:border-primary-300 !p-3"
          >
            <span className="text-4xl block mb-2">📖</span>
            <span className="text-kid-sm font-bold text-primary-600">
              閱讀
            </span>
          </Link>
          <Link
            href="/vocabulary"
            className="card-kid text-center py-5 hover:border-success-300 !p-3"
          >
            <span className="text-4xl block mb-2">✏️</span>
            <span className="text-kid-sm font-bold text-success-600">
              單字
            </span>
          </Link>
          <Link
            href="/speaking"
            className="card-kid text-center py-5 hover:border-accent-300 !p-3"
          >
            <span className="text-4xl block mb-2">🎤</span>
            <span className="text-kid-sm font-bold text-accent-600">
              口說
            </span>
          </Link>
        </div>
      </div>

      {/* 本週進度 */}
      <div className="mb-6">
        <h2 className="text-kid-lg font-black text-gray-700 mb-3">
          📊 本週進度
        </h2>
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
        <h2 className="text-kid-lg font-black text-gray-700 mb-3">
          📚 推薦文章
        </h2>
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
