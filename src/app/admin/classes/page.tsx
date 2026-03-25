"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

interface ClassItem {
  id: string;
  name: string;
  gradeLevel: number;
  inviteCode: string;
  _count: { students: number };
  createdAt: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", gradeLevel: 1, description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClasses(); }, []);

  async function fetchClasses() {
    try {
      const res = await fetch("/api/classes");
      if (res.ok) setClasses(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: "", gradeLevel: 1, description: "" });
        fetchClasses();
      }
    } catch {} finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此班級嗎？")) return;
    try {
      await fetch(`/api/classes/${id}`, { method: "DELETE" });
      fetchClasses();
    } catch {}
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🏫 班級管理</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-admin-primary">
            + 新增班級
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">建立新班級</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">班級名稱</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-admin"
                  placeholder="例：一年甲班"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年級</label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: parseInt(e.target.value) })}
                  className="input-admin"
                >
                  <option value={1}>一年級</option>
                  <option value={2}>二年級</option>
                  <option value={3}>三年級</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">說明（選填）</label>
                <input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-admin"
                  placeholder="班級說明"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-admin-primary">
                  {saving ? "建立中..." : "建立班級"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-admin-secondary">
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Class list */}
        {loading ? (
          <p className="text-gray-400 text-center py-8">載入中...</p>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <span className="text-4xl block mb-3">🏫</span>
            <p className="text-gray-500">還沒有班級，點擊上方按鈕建立</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                <span className="text-3xl">🏫</span>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{cls.name}</h3>
                  <p className="text-sm text-gray-500">
                    {cls.gradeLevel} 年級 · {cls._count.students} 位學生
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">邀請碼</p>
                  <p className="font-mono text-sm font-bold text-primary-600">{cls.inviteCode.slice(0, 8)}</p>
                </div>
                <button
                  onClick={() => handleDelete(cls.id)}
                  className="text-sm text-red-400 hover:text-red-600"
                >
                  刪除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
