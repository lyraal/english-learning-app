"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StudentLayout from "@/components/student/StudentLayout";
import { getLevelLabel, getLevelColor } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/word-images";

interface Article {
  id: string;
  title: string;
  titleZh: string;
  level: string;
  gradeLevel: number;
  topic: string | null;
  category: string | null;
  imageUrl: string | null;
  _count?: { words: number };
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeLevel, setActiveLevel] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  async function fetchArticles() {
    try {
      const res = await fetch("/api/articles");
      if (res.ok) {
        setArticles(await res.json());
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  const filtered =
    activeLevel === "ALL"
      ? articles
      : articles.filter((a) => a.level === activeLevel);

  const levelTabs = [
    { value: "ALL", label: "全部", emoji: "📚" },
    { value: "LEVEL1", label: "Level 1", emoji: "🌱" },
    { value: "LEVEL2", label: "Level 2", emoji: "🌿" },
    { value: "LEVEL3", label: "Level 3", emoji: "🌳" },
    { value: "LEVEL4", label: "Level 4", emoji: "🌲" },
    { value: "LEVEL5", label: "Level 5", emoji: "🏔️" },
    { value: "LEVEL6", label: "Level 6", emoji: "🚀" },
  ];

  // Get emoji for article based on category first, then topic fallback
  function getArticleEmoji(article: Article): string {
    if (article.category) {
      return getCategoryIcon(article.category).emoji;
    }
    // Legacy topic-based fallback
    switch (article.topic) {
      case "動物": return "🐾";
      case "家庭": return "👨‍👩‍👦";
      case "戶外活動": return "🏞️";
      case "學校生活": return "🏫";
      case "食物/水果": return "🍎";
      default: return "📖";
    }
  }

  return (
    <StudentLayout>
      <h1 className="text-kid-xl font-black text-gray-800 mb-4">
        📖 文章閱讀
      </h1>

      {/* Level 篩選 */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {levelTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveLevel(tab.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${
              activeLevel === tab.value
                ? "bg-primary-500 text-white shadow-md"
                : "bg-white text-gray-500 border-2 border-gray-200"
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* 文章列表 */}
      {loading ? (
        <div className="text-center py-12">
          <span className="text-4xl animate-emoji-pulse block">📖</span>
          <p className="text-gray-500 mt-2">載入文章中...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl block mb-2">📭</span>
          <p className="text-gray-500">目前沒有文章</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article, idx) => (
            <Link
              key={article.id}
              href={`/articles/${article.id}`}
              className="card-kid flex items-center gap-4 !py-4 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* 封面圖示 — 使用 category emoji */}
              <div className="w-16 h-16 rounded-kid bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">
                  {getArticleEmoji(article)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-black text-kid-base text-gray-800 truncate">
                  {getArticleEmoji(article)} {article.title}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {article.titleZh}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${getLevelColor(
                      article.level
                    )}`}
                  >
                    {getLevelLabel(article.level)}
                  </span>
                  {article.category && (
                    <span className="text-xs text-gray-400">
                      {getCategoryIcon(article.category).label}
                    </span>
                  )}
                  {article._count && (
                    <span className="text-xs text-gray-400">
                      {article._count.words} 個單字
                    </span>
                  )}
                </div>
              </div>

              <span className="text-2xl text-gray-300">›</span>
            </Link>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
