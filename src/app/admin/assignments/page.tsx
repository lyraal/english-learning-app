"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatDate } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  type: string;
  status: string;
  dueDate: string | null;
  class: { name: string };
  article: { title: string } | null;
  _count: { submissions: number };
  createdAt: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [articles, setArticles] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", type: "MIXED", classId: "", articleId: "", dueDate: "",
  });

  useEffect(() => {
    fetchAssignments();
    fetchClasses();
    fetchArticles();
  }, []);

  async function fetchAssignments() {
    try {
      const res = await fetch("/api/assignments");
      if (res.ok) setAssignments(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function fetchClasses() {
    try { const res = await fetch("/api/classes"); if (res.ok) setClasses(await res.json()); } catch {}
  }
  async function fetchArticles() {
    try { const res = await fetch("/api/articles"); if (res.ok) setArticles(await res.json()); } catch {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ title: "", description: "", type: "MIXED", classId: "", articleId: "", dueDate: "" });
        fetchAssignments();
      }
    } catch {}
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📋 作業指派</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-admin-primary">
            + 指派作業
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">作業名稱</label>
                  <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input-admin" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="input-admin">
                    <option value="READING">閱讀</option>
                    <option value="VOCABULARY">單字</option>
                    <option value="SPEAKING">口說</option>
                    <option value="MIXED">綜合</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">班級</label>
                  <select value={formData.classId} onChange={(e) => setFormData({...formData, classId: e.target.value})} className="input-admin" required>
                    <option value="">-- 選擇班級 --</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">指定文章（選填）</label>
                  <select value={formData.articleId} onChange={(e) => setFormData({...formData, articleId: e.target.value})} className="input-admin">
                    <option value="">-- 不指定 --</option>
                    {articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="input-admin" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">說明</label>
                  <input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-admin" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-admin-primary">指派作業</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-admin-secondary">取消</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-400 text-center py-8">載入中...</p>
          ) : assignments.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <span className="text-4xl block mb-3">📋</span>
              <p className="text-gray-500">尚未指派任何作業</p>
            </div>
          ) : (
            assignments.map((a) => (
              <div key={a.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                <span className="text-2xl">
                  {a.type === "READING" ? "📖" : a.type === "SPEAKING" ? "🎤" : a.type === "VOCABULARY" ? "✏️" : "📋"}
                </span>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{a.title}</h3>
                  <p className="text-xs text-gray-500">
                    {a.class.name} · {a.article?.title || "綜合練習"} · {a._count.submissions} 人已提交
                  </p>
                </div>
                <div className="text-right">
                  {a.dueDate && (
                    <p className="text-xs text-gray-400">截止：{formatDate(a.dueDate)}</p>
                  )}
                  <span className={`text-xs font-bold ${a.status === "ACTIVE" ? "text-success-600" : "text-gray-400"}`}>
                    {a.status === "ACTIVE" ? "進行中" : a.status === "CLOSED" ? "已結束" : "草稿"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
