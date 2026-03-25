"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import StudentLayout from "@/components/student/StudentLayout";

interface ProgressData {
  totalPractices: number;
  totalStudyDays: number;
  avgScore: number;
  articlesRead: number;
  wordsLearned: number;
  streak: number;
  points: number;
  recentRecords: Array<{
    id: string;
    type: string;
    score: number | null;
    createdAt: string;
    article?: { title: string } | null;
  }>;
  achievements: Array<{
    id: string;
    badge: string;
    title: string;
    icon: string | null;
    earnedAt: string;
  }>;
  weeklyScores: Array<{
    date: string;
    score: number;
  }>;
}

export default function ProgressPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  async function fetchProgress() {
    try {
      const res = await fetch("/api/progress");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  return (
    <StudentLayout>
      <h1 className="text-kid-xl font-black text-gray-800 mb-4">
        📊 我的進度
      </h1>

      {loading ? (
        <div className="text-center py-12">
          <span className="text-4xl animate-bounce-slow block">📊</span>
          <p className="text-gray-500 mt-2">載入中...</p>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="card-kid text-center !p-4">
              <span className="text-3xl block mb-1">🔥</span>
              <p className="text-2xl font-black text-accent-500">
                {data?.streak ?? (session?.user as any)?.streak ?? 0}
              </p>
              <p className="text-xs text-gray-500">連續天數</p>
            </div>
            <div className="card-kid text-center !p-4">
              <span className="text-3xl block mb-1">⭐</span>
              <p className="text-2xl font-black text-kid-yellow">
                {data?.points ?? (session?.user as any)?.points ?? 0}
              </p>
              <p className="text-xs text-gray-500">累計星星</p>
            </div>
            <div className="card-kid text-center !p-4">
              <span className="text-3xl block mb-1">📖</span>
              <p className="text-2xl font-black text-primary-500">
                {data?.articlesRead ?? 0}
              </p>
              <p className="text-xs text-gray-500">已讀文章</p>
            </div>
            <div className="card-kid text-center !p-4">
              <span className="text-3xl block mb-1">✏️</span>
              <p className="text-2xl font-black text-success-500">
                {data?.wordsLearned ?? 0}
              </p>
              <p className="text-xs text-gray-500">已學單字</p>
            </div>
          </div>

          {/* Average score */}
          <div className="card-kid mb-6">
            <h2 className="text-kid-lg font-black text-gray-700 mb-3">
              🎯 平均分數
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full border-4 border-primary-500 flex items-center justify-center">
                <span className="text-3xl font-black text-primary-600">
                  {data?.avgScore ?? 0}
                </span>
              </div>
              <div className="flex-1">
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span>口說練習</span>
                      <span className="font-bold">{data?.totalPractices ?? 0} 次</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (data?.totalPractices ?? 0) * 5)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span>練習天數</span>
                      <span className="font-bold">{data?.totalStudyDays ?? 0} 天</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-success-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (data?.totalStudyDays ?? 0) * 3.3)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly chart (simplified) */}
          {data?.weeklyScores && data.weeklyScores.length > 0 && (
            <div className="card-kid mb-6">
              <h2 className="text-kid-lg font-black text-gray-700 mb-3">
                📈 本週分數
              </h2>
              <div className="flex items-end justify-around h-32 px-2">
                {data.weeklyScores.map((ws, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-primary-600">
                      {ws.score}
                    </span>
                    <div
                      className="w-8 bg-gradient-to-t from-primary-400 to-primary-200 rounded-t-lg transition-all"
                      style={{ height: `${(ws.score / 100) * 80}px` }}
                    />
                    <span className="text-xs text-gray-400">{ws.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div className="card-kid mb-6">
            <h2 className="text-kid-lg font-black text-gray-700 mb-3">
              🏆 我的徽章
            </h2>
            {data?.achievements && data.achievements.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {data.achievements.map((a) => (
                  <div key={a.id} className="text-center">
                    <span className="text-4xl block mb-1">{a.icon || "🏅"}</span>
                    <p className="text-xs font-bold text-gray-600">{a.title}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="text-4xl block mb-2 opacity-30">🏆</span>
                <p className="text-sm text-gray-400">
                  持續練習就能獲得徽章喔！
                </p>
              </div>
            )}
          </div>

          {/* Recent records */}
          <div className="card-kid">
            <h2 className="text-kid-lg font-black text-gray-700 mb-3">
              📝 最近練習
            </h2>
            {data?.recentRecords && data.recentRecords.length > 0 ? (
              <div className="space-y-2">
                {data.recentRecords.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-xl">
                      {r.type === "speaking"
                        ? "🎤"
                        : r.type === "reading"
                        ? "📖"
                        : "✏️"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold">
                        {r.article?.title || "練習"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString("zh-TW")}
                      </p>
                    </div>
                    {r.score !== null && (
                      <span className="font-black text-primary-500">
                        {r.score}分
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                還沒有練習紀錄，快去練習吧！
              </p>
            )}
          </div>
        </>
      )}
    </StudentLayout>
  );
}
