"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import { formatDate, formatRelativeTime } from "@/lib/utils";

interface StudentDetail {
  student: {
    id: string;
    name: string;
    username: string | null;
    points: number;
    streak: number;
    lastActiveAt: string | null;
    createdAt: string;
    classNames: string[];
  };
  skills: {
    reading: number;
    vocabulary: number;
    speaking: number;
    writing: number;
  };
  recentRecords: Array<{
    id: string;
    type: string;
    score: number | null;
    articleTitle: string | null;
    createdAt: string;
  }>;
  speakingHistory: Array<{
    id: string;
    score: number | null;
    accuracy: number | null;
    fluency: number | null;
    completeness: number | null;
    createdAt: string;
  }>;
  badgeProgress: Array<{
    badge: string;
    title: string;
    earned: boolean;
    earnedAt: string | null;
  }>;
}

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

function getScoreColor(score: number) {
  if (score >= 80) return "text-success-600";
  if (score >= 60) return "text-accent-600";
  return "text-red-500";
}

function getScoreBarColor(score: number) {
  if (score >= 80) return "bg-success-500";
  if (score >= 60) return "bg-accent-500";
  return "bg-red-400";
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  async function fetchStudent() {
    try {
      const res = await fetch(`/api/admin/students/${studentId}`);
      if (res.ok) setData(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <span className="text-2xl animate-spin">⏳</span>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <span className="text-4xl block mb-3">😢</span>
          <p className="text-gray-500">找不到此學生</p>
          <Link href="/admin/students" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
            返回學生列表
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const { student, skills, recentRecords, speakingHistory, badgeProgress } = data;
  const skillItems = [
    { label: "閱讀", value: skills.reading, icon: "📖" },
    { label: "單字", value: skills.vocabulary, icon: "✏️" },
    { label: "口說", value: skills.speaking, icon: "🎤" },
    { label: "寫作", value: skills.writing, icon: "📝" },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link href="/admin/students" className="text-sm text-gray-400 hover:text-primary-600 transition-colors">
            ← 返回學生列表
          </Link>
        </div>

        {/* Student Profile Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-3xl">
              👤
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{student.name}</h1>
              <p className="text-sm text-gray-400">@{student.username || "未設定"}</p>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span>🏫</span>
                  <span>{student.classNames.join("、") || "未加入班級"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span>⭐</span>
                  <span>{student.points} 積分</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <span>🔥</span>
                  <span>連續 {student.streak} 天</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <span>🕐</span>
                  <span>最後登入：{student.lastActiveAt ? formatRelativeTime(student.lastActiveAt) : "未登入"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Overview */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {skillItems.map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{s.icon}</span>
                <span className="text-sm font-medium text-gray-600">{s.label}平均</span>
              </div>
              <p className={`text-3xl font-bold ${getScoreColor(s.value)}`}>{s.value}</p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${getScoreBarColor(s.value)}`} style={{ width: `${s.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Recent 15 Practice Records */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">最近練習紀錄</h2>
            {recentRecords.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentRecords.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-lg">{getTypeIcon(r.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {getTypeLabel(r.type)}練習
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {r.articleTitle || "綜合"} · {formatRelativeTime(r.createdAt)}
                      </p>
                    </div>
                    {r.score !== null && (
                      <span className={`text-sm font-bold ${getScoreColor(r.score)}`}>
                        {r.score}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">尚無練習紀錄</p>
            )}
          </div>

          {/* Speaking History */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🎤 口說練習歷史</h2>
            {speakingHistory.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {speakingHistory.map((s, i) => (
                  <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(s.createdAt)}
                      </span>
                      <span className={`text-sm font-bold ${s.score !== null ? getScoreColor(s.score) : "text-gray-400"}`}>
                        {s.score !== null ? `${s.score} 分` : "-"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center">
                        <p className="text-xs text-gray-400">準確度</p>
                        <p className="text-sm font-medium">{s.accuracy !== null ? `${s.accuracy}%` : "-"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">流暢度</p>
                        <p className="text-sm font-medium">{s.fluency !== null ? `${s.fluency}%` : "-"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">完整度</p>
                        <p className="text-sm font-medium">{s.completeness !== null ? `${s.completeness}%` : "-"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">尚無口說紀錄</p>
            )}
          </div>
        </div>

        {/* Badge Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🏆 徽章收集進度</h2>
          <div className="grid grid-cols-4 gap-3">
            {badgeProgress.map((b) => (
              <div
                key={b.badge}
                className={`p-4 rounded-xl text-center border transition-colors ${
                  b.earned
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-gray-50 border-gray-100 opacity-50"
                }`}
              >
                <span className="text-2xl block mb-1">
                  {b.earned ? "🏅" : "🔒"}
                </span>
                <p className="text-sm font-medium text-gray-700">{b.title}</p>
                {b.earned && b.earnedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(b.earnedAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-3 text-center">
            已獲得 {badgeProgress.filter((b) => b.earned).length} / {badgeProgress.length} 個徽章
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
