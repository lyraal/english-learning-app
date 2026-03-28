"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ChildProgress {
  child: {
    name: string;
    avatar: string | null;
    points: number;
    streak: number;
  };
  weeklySummary: {
    practiceCount: number;
    averageScore: number;
    assignmentsCompleted: number;
  };
  skillScores: {
    reading: number;
    vocabulary: number;
    speaking: number;
    writing: number;
  };
  recentRecords: {
    id: string;
    type: string;
    score: number | null;
    createdAt: string;
    articleTitle: string | null;
  }[];
  badges: {
    total: number;
    unlocked: number;
    list: { badge: string; title: string; icon: string | null; earnedAt: string }[];
    all?: { badge: string; title: string; icon: string; description: string; earned: boolean; earnedAt: string | null }[];
  };
}

const typeLabels: Record<string, string> = {
  reading: "閱讀",
  vocabulary: "單字",
  speaking: "口說",
  writing: "寫作",
};

const typeColors: Record<string, string> = {
  reading: "bg-blue-100 text-blue-700",
  vocabulary: "bg-purple-100 text-purple-700",
  speaking: "bg-emerald-100 text-emerald-700",
  writing: "bg-amber-100 text-amber-700",
};

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.id as string;
  const [data, setData] = useState<ChildProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/parent/child/${childId}/progress`)
      .then((r) => {
        if (!r.ok) throw new Error("無法取得資料");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-32 mb-3" />
            <div className="h-4 bg-slate-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-slate-500">{error || "找不到資料"}</p>
        <button
          onClick={() => router.push("/parent")}
          className="mt-4 text-emerald-600 font-medium text-sm"
        >
          返回首頁
        </button>
      </div>
    );
  }

  const { child, weeklySummary, skillScores, recentRecords, badges } = data;

  function scoreColor(score: number) {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  }

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => router.push("/parent")}
        className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1"
      >
        ← 返回
      </button>

      {/* Child header */}
      <div className="bg-white rounded-xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-3xl">
          {child.avatar || "😊"}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">{child.name}</h2>
          <div className="flex gap-4 mt-1 text-sm text-slate-500">
            <span>⭐ {child.points} 積分</span>
            <span>🔥 連續 {child.streak} 天</span>
          </div>
        </div>
      </div>

      {/* Weekly summary */}
      <div className="bg-white rounded-xl p-5">
        <h3 className="font-semibold text-slate-700 mb-3">本週摘要</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{weeklySummary.practiceCount}</div>
            <div className="text-xs text-slate-500 mt-1">練習次數</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-emerald-600">
              {weeklySummary.averageScore > 0 ? weeklySummary.averageScore.toFixed(0) : "-"}
            </div>
            <div className="text-xs text-slate-500 mt-1">平均分數</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-600">{weeklySummary.assignmentsCompleted}</div>
            <div className="text-xs text-slate-500 mt-1">完成作業</div>
          </div>
        </div>
      </div>

      {/* Skill scores */}
      <div className="bg-white rounded-xl p-5">
        <h3 className="font-semibold text-slate-700 mb-3">技能分數</h3>
        <div className="grid grid-cols-2 gap-3">
          {(["reading", "vocabulary", "speaking", "writing"] as const).map((skill) => (
            <div key={skill} className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">{typeLabels[skill]}</div>
              <div className={`text-2xl font-bold ${scoreColor(skillScores[skill])}`}>
                {skillScores[skill] > 0 ? skillScores[skill].toFixed(0) : "-"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent records */}
      <div className="bg-white rounded-xl p-5">
        <h3 className="font-semibold text-slate-700 mb-3">最近練習紀錄</h3>
        {recentRecords.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">尚無練習紀錄</p>
        ) : (
          <div className="space-y-2">
            {recentRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[record.type] || "bg-slate-100 text-slate-600"}`}>
                    {typeLabels[record.type] || record.type}
                  </span>
                  <span className="text-sm text-slate-600 truncate max-w-[140px]">
                    {record.articleTitle || "一般練習"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${record.score ? scoreColor(record.score) : "text-slate-300"}`}>
                    {record.score != null ? record.score.toFixed(0) : "-"}
                  </span>
                  <span className="text-xs text-slate-300">
                    {new Date(record.createdAt).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="bg-white rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700">徽章收集</h3>
          <span className="text-sm text-slate-400">
            {badges.unlocked} / {badges.total}
          </span>
        </div>
        {badges.all && badges.all.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {badges.all.map((b) => (
              <div
                key={b.badge}
                className={`flex flex-col items-center rounded-lg p-3 min-w-[70px] ${
                  b.earned
                    ? "bg-amber-50 border border-amber-200"
                    : "bg-slate-50 border border-slate-100 opacity-50"
                }`}
              >
                <span className={`text-2xl ${b.earned ? "" : "grayscale"}`}>
                  {b.icon || (b.earned ? "🏅" : "🔒")}
                </span>
                <span className={`text-xs mt-1 text-center font-medium ${b.earned ? "text-slate-700" : "text-slate-400"}`}>
                  {b.title}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 text-center">{b.description}</span>
              </div>
            ))}
          </div>
        ) : badges.list.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {badges.list.map((b) => (
              <div key={b.badge} className="flex flex-col items-center bg-amber-50 rounded-lg p-3 min-w-[70px]">
                <span className="text-2xl">{b.icon || "🏅"}</span>
                <span className="text-xs text-slate-600 mt-1 text-center">{b.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">尚未獲得徽章</p>
        )}
      </div>
    </div>
  );
}
