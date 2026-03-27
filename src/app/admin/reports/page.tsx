"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

interface StudentReport {
  id: string;
  name: string;
  className: string;
  totalPractices: number;
  avgScore: number;
  streak: number;
  lastActive: string | null;
  speakingAvg: number;
  spellingAccuracy: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchReports();
    fetchClasses();
  }, []);

  async function fetchReports() {
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) setReports(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function fetchClasses() {
    try { const res = await fetch("/api/classes"); if (res.ok) setClasses(await res.json()); } catch {}
  }

  const filtered = selectedClass === "ALL"
    ? reports
    : reports.filter((r) => r.className === selectedClass);

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📈 學生報告</h1>
          <div className="flex items-center gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-admin w-48"
            >
              <option value="ALL">全部班級</option>
              {classes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <button
              onClick={() => {
                const classId = selectedClass === "ALL"
                  ? "all"
                  : classes.find((c) => c.name === selectedClass)?.id || "all";
                window.open(`/api/admin/export/class/${classId}`, "_blank");
              }}
              className="btn-admin-primary flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>📥</span> 匯出成績 CSV
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-primary-600">{filtered.length}</p>
            <p className="text-sm text-gray-500">學生人數</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-success-600">
              {filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.avgScore, 0) / filtered.length) : 0}
            </p>
            <p className="text-sm text-gray-500">平均分數</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-accent-600">
              {filtered.reduce((s, r) => s + r.totalPractices, 0)}
            </p>
            <p className="text-sm text-gray-500">總練習次數</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-kid-purple">
              {filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.spellingAccuracy, 0) / filtered.length) : 0}%
            </p>
            <p className="text-sm text-gray-500">拼字正確率</p>
          </div>
        </div>

        {/* Report table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">學生</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">班級</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">練習次數</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">平均分數</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">口說平均</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">拼字正確率</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">連續天數</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">載入中...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">無資料</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.className}</td>
                    <td className="px-4 py-3 text-center">{r.totalPractices}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${r.avgScore >= 80 ? "text-success-600" : r.avgScore >= 60 ? "text-accent-600" : "text-red-500"}`}>
                        {r.avgScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{r.speakingAvg}</td>
                    <td className="px-4 py-3 text-center">{r.spellingAccuracy}%</td>
                    <td className="px-4 py-3 text-center">🔥 {r.streak}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
