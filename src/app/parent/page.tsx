"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ChildSummary {
  id: string;
  name: string;
  avatar: string | null;
  points: number;
  streak: number;
  lastActiveAt: string | null;
  todayPracticeCount: number;
  weeklyMinutes: number;
}

export default function ParentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/children")
      .then((r) => r.json())
      .then((data) => {
        if (data.children) setChildren(data.children);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const userName = session?.user?.name || "家長";

  function formatLastActive(dateStr: string | null) {
    if (!dateStr) return "尚未登入";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "剛剛";
    if (diffMin < 60) return `${diffMin} 分鐘前`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} 小時前`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} 天前`;
  }

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          您好，{userName}
        </h2>
        <p className="text-slate-500 mt-1">查看孩子的學習進度</p>
      </div>

      {/* Children cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-slate-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400">
          <div className="text-4xl mb-3">👶</div>
          <p>尚未綁定孩子帳號</p>
          <p className="text-sm mt-1">請聯絡老師設定親子關聯</p>
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => router.push(`/parent/child/${child.id}`)}
              className="w-full bg-white rounded-xl p-5 text-left hover:shadow-md transition-shadow border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-2xl">
                  {child.avatar || "😊"}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{child.name}</h3>
                  <p className="text-xs text-slate-400">
                    最近活躍：{formatLastActive(child.lastActiveAt)}
                  </p>
                </div>
                <span className="text-slate-300 text-lg">›</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-emerald-600">
                    {child.todayPracticeCount}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">今日練習</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-amber-500">
                    {child.streak}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">連續天數</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-500">
                    {child.weeklyMinutes}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">本週分鐘</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
