"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatRelativeTime } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  username: string | null;
  points: number;
  streak: number;
  lastActiveAt: string | null;
  createdAt: string;
  classEnrollments: Array<{ class: { name: string } }>;
  _count: { practiceRecords: number };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", username: "", password: "123456", classId: "" });
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  async function fetchStudents() {
    try {
      const res = await fetch("/api/students");
      if (res.ok) setStudents(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function fetchClasses() {
    try {
      const res = await fetch("/api/classes");
      if (res.ok) setClasses(await res.json());
    } catch {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: "", username: "", password: "123456", classId: "" });
        fetchStudents();
      }
    } catch {}
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">👦 學生管理</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-admin-primary">
            + 新增學生
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">新增學生</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-admin" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳號</label>
                <input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="input-admin" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
                <input value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="input-admin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">班級</label>
                <select value={formData.classId} onChange={(e) => setFormData({...formData, classId: e.target.value})} className="input-admin">
                  <option value="">-- 選擇班級 --</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex gap-2">
                <button type="submit" className="btn-admin-primary">建立學生</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-admin-secondary">取消</button>
              </div>
            </form>
          </div>
        )}

        {/* Student table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">學生</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">班級</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">練習次數</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">星星</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">連續天數</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">最後活躍</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">載入中...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">尚無學生</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.username}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.classEnrollments.map((e) => e.class.name).join(", ") || "-"}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{s._count.practiceRecords}</td>
                    <td className="px-4 py-3 text-center font-medium text-yellow-600">⭐ {s.points}</td>
                    <td className="px-4 py-3 text-center font-medium text-accent-600">🔥 {s.streak}</td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {s.lastActiveAt ? formatRelativeTime(s.lastActiveAt) : "未登入"}
                    </td>
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
