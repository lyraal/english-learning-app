"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

interface WordItem {
  id: string;
  word: string;
  phonetic: string | null;
  translation: string;
  article: { title: string };
}

export default function AdminVocabularyPage() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [articles, setArticles] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    word: "", phonetic: "", translation: "", exampleSentence: "", articleId: "",
  });

  useEffect(() => {
    fetchWords();
    fetchArticles();
  }, []);

  async function fetchWords() {
    try {
      const res = await fetch("/api/vocabulary/all");
      if (res.ok) setWords(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function fetchArticles() {
    try {
      const res = await fetch("/api/articles");
      if (res.ok) setArticles(await res.json());
    } catch {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ word: "", phonetic: "", translation: "", exampleSentence: "", articleId: "" });
        fetchWords();
      }
    } catch {}
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📚 單字管理</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-admin-primary">
            + 新增單字
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">英文單字</label>
                <input value={formData.word} onChange={(e) => setFormData({...formData, word: e.target.value})} className="input-admin" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">音標</label>
                <input value={formData.phonetic} onChange={(e) => setFormData({...formData, phonetic: e.target.value})} className="input-admin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">中文翻譯</label>
                <input value={formData.translation} onChange={(e) => setFormData({...formData, translation: e.target.value})} className="input-admin" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所屬文章</label>
                <select value={formData.articleId} onChange={(e) => setFormData({...formData, articleId: e.target.value})} className="input-admin" required>
                  <option value="">-- 選擇文章 --</option>
                  {articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">例句</label>
                <input value={formData.exampleSentence} onChange={(e) => setFormData({...formData, exampleSentence: e.target.value})} className="input-admin" />
              </div>
              <div className="col-span-2 flex gap-2">
                <button type="submit" className="btn-admin-primary">儲存</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-admin-secondary">取消</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">單字</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">音標</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">中文</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">所屬文章</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">載入中...</td></tr>
              ) : words.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">尚無單字</td></tr>
              ) : (
                words.map((w) => (
                  <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-primary-600">{w.word}</td>
                    <td className="px-4 py-3 text-gray-500">{w.phonetic || "-"}</td>
                    <td className="px-4 py-3">{w.translation}</td>
                    <td className="px-4 py-3 text-gray-500">{w.article?.title}</td>
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
