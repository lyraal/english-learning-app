"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

interface AdminDashboard {
  totalStudents: number;
  activeToday: number;
  totalClasses: number;
  totalArticles: number;
  avgScore: number;
  pendingAssignments: number;
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
    { label: "今日活躍", value: data?.activeToday ?? 0, icon: "🟢", color: "text-success-600" },
    { label: "平均分數", value: data?.avgScore ?? 0, icon: "📊", color: "text-accent-600" },
    { label: "待批作業", value: data?.pendingAssignments ?? 0, icon: "📋", color: "text-red-500" },
  ];

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

        <div className="grid grid-cols-2 gap-6">
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

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">近期動態</h2>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <span className="text-lg mt-0.5">
                      {a.action.includes("口說") ? "🎤" : a.action.includes("閱讀") ? "📖" : "✏️"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{a.studentName}</span>{" "}
                        {a.action}
                      </p>
                      <p className="text-xs text-gray-400">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                暫無學生活動
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
