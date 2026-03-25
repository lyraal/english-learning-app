"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getLevelLabel } from "@/lib/utils";

interface Article {
  id: string;
  title: string;
  titleZh: string;
  level: string;
  gradeLevel: number;
  topic: string | null;
  isPublished: boolean;
  _count: { words: number; exercises: number };
  createdAt: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "", titleZh: "", content: "", contentZh: "",
    level: "LEVEL1", gradeLevel: 1, topic: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchArticles(); }, []);

  async function fetchArticles() {
    try {
      const res = await fetch("/api/articles");
      if (res.ok) setArticles(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ title: "", titleZh: "", content: "", contentZh: "", level: "LEVEL1", gradeLevel: 1, topic: "" });
        fetchArticles();
      }
    } catch {} finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此教材嗎？")) return;
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    fetchArticles();
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📝 教材管理</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-admin-primary">
            + 新增文章
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">新增文章</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">英文標題</label>
                  <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input-admin" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">中文標題</label>
                  <input value={formData.titleZh} onChange={(e) => setFormData({...formData, titleZh: e.target.value})} className="input-admin" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">英文內文</label>
                <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="input-admin" rows={4} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">中文翻譯</label>
                <textarea value={formData.contentZh} onChange={(e) => setFormData({...formData, contentZh: e.target.value})} className="input-admin" rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">難度</label>
                  <select value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} className="input-admin">
                    <option value="LEVEL1">Level 1</option>
                    <option value="LEVEL2">Level 2</option>
                    <option value="LEVEL3">Level 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年級</label>
                  <select value={formData.gradeLevel} onChange={(e) => setFormData({...formData, gradeLevel: parseInt(e.target.value)})} className="input-admin">
                    <option value={1}>一年級</option>
                    <option value={2}>二年級</option>
                    <option value={3}>三年級</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主題</label>
                  <input value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} className="input-admin" placeholder="例：動物" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-admin-primary">{saving ? "儲存中..." : "儲存文章"}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-admin-secondary">取消</button>
              </div>
            </form>
          </div>
        )}

        {/* Article list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">文章</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">難度</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">年級</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">單字數</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">狀態</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">載入中...</td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">尚無文章</td></tr>
              ) : (
                articles.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.titleZh}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-600">
                        {getLevelLabel(a.level)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{a.gradeLevel} 年級</td>
                    <td className="px-4 py-3 text-center">{a._count.words}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold ${a.isPublished ? "text-success-600" : "text-gray-400"}`}>
                        {a.isPublished ? "已發布" : "草稿"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-600 text-xs">
                        刪除
                      </button>
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
