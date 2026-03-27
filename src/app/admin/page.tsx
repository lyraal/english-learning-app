"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

interface AdminDashboard {
  totalStudents: number;
  activeToday: number;
  totalClasses: number;
  totalArticles: number;
  avgScore: number;
  pendingAssignments: number;
  // Enhanced fields
  weeklyActiveStudents: number;
  weeklyCompletionRate: number;
  attentionNeeded: Array<{
    id: string;
    name: string;
    reason: string;
    detail: string;
    lastActiveAt: string | null;
  }>;
  recentPractices: Array<{
    id: string;
    studentName: string;
    studentId: string;
    type: string;
    score: number | null;
    articleTitle: string | null;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    studentName: string;
    action: string;
    detail: string;
    time: string;
  }>;
  classStats: Array<{
    id: string;
    name: string;
    studentCount: number;
    avgScore: number;
    activeRate: number;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) setData(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }

  const stats = [
    { label: "學生總數", value: data?.totalStudents ?? 0, icon: "👦", color: "text-primary-600" },
    { label: "本週活躍", value: `${data?.weeklyActiveStudents ?? 0} / ${data?.totalStudents ?? 0}`, icon: "🟢", color: "text-success-600" },
    { label: "本週完成率", value: `${data?.weeklyCompletionRate ?? 0}%`, icon: "📊", color: "text-accent-600" },
    { label: "待批作業", value: data?.pendingAssignments ?? 0, icon: "📋", color: "text-red-500" },
  ];

  function getTypeIcon(type: string) {
    switch (type) {
      case "speaking": return "🎤";
      case "reading": return "📖";
      case "vocabulary": return "✏️";
      case "writing": return "📝";
      default: return "📋";
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case "speaking": return "口說";
      case "reading": return "閱讀";
      case "vocabulary": return "單字";
      case "writing": return "寫作";
      default: return type;
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">儀表板</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{s.icon}</span>
              </div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Attention Needed */}
        {data?.attentionNeeded && data.attentionNeeded.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-red-500">⚠️</span> 需要關注的學生
            </h2>
            <div className="space-y-2">
              {data.attentionNeeded.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/students/${s.id}`}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <span className="text-lg">👤</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-800">{s.name}</p>
                    <p className="text-xs text-red-600">{s.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{s.detail}</p>
                    {s.lastActiveAt && (
                      <p className="text-xs text-gray-400">
                        最後登入：{formatRelativeTime(s.lastActiveAt)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Class Overview */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">班級概覽</h2>
            {data?.classStats && data.classStats.length > 0 ? (
              <div className="space-y-3">
                {data.classStats.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xl">🏫</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cls.name}</p>
                      <p className="text-xs text-gray-400">{cls.studentCount} 位學生</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-600">
                        {cls.avgScore} 分
                      </p>
                      <p className="text-xs text-gray-400">
                        活躍 {cls.activeRate}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                尚未建立班級
              </p>
            )}
          </div>

          {/* Recent Practices (5 records) */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">最近練習紀錄</h2>
            {data?.recentPractices && data.recentPractices.length > 0 ? (
              <div className="space-y-3">
                {data.recentPractices.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/students/${p.studentId}`}
                    className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg transition-colors px-1"
                  >
                    <span className="text-lg mt-0.5">{getTypeIcon(p.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{p.studentName}</span>{" "}
                        完成{getTypeLabel(p.type)}練習
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.articleTitle || "綜合練習"} · {formatRelativeTime(p.createdAt)}
                      </p>
                    </div>
                    {p.score !== null && (
                      <span className={`text-sm font-bold ${
                        p.score >= 80 ? "text-success-600" : p.score >= 60 ? "text-accent-600" : "text-red-500"
                      }`}>
                        {p.score}分
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                暫無學生練習紀錄
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
