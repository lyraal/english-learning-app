"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import StudentLayout from "@/components/student/StudentLayout";
import { getLevelLabel, getLevelColor } from "@/lib/utils";
import { speak, stopSpeaking, speakSentences } from "@/lib/speech";

interface ArticleDetail {
  id: string;
  title: string;
  titleZh: string;
  content: string;
  contentZh: string | null;
  level: string;
  topic: string | null;
  words: Array<{
    id: string;
    word: string;
    phonetic: string | null;
    translation: string;
    exampleSentence: string | null;
  }>;
}

interface WordPopup {
  word: string;
  phonetic: string | null;
  translation: string;
  example: string | null;
  x: number;
  y: number;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeWord, setActiveWord] = useState<WordPopup | null>(null);
  const [highlightedSentence, setHighlightedSentence] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.8);

  // 用 ref 儲存取消函式
  const cancelPlayRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchArticle();
  }, [params.id]);

  // 組件卸載時停止播放
  useEffect(() => {
    return () => {
      if (cancelPlayRef.current) cancelPlayRef.current();
      stopSpeaking();
    };
  }, []);

  async function fetchArticle() {
    try {
      const res = await fetch(`/api/articles/${params.id}`);
      if (res.ok) {
        setArticle(await res.json());
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  const sentences = article?.content.split(/(?<=[.!?])\s+/) || [];

  function handlePlayAll() {
    if (isPlaying) {
      // 停止播放
      if (cancelPlayRef.current) {
        cancelPlayRef.current();
        cancelPlayRef.current = null;
      }
      stopSpeaking();
      setIsPlaying(false);
      setHighlightedSentence(-1);
    } else {
      // 開始逐句播放
      setIsPlaying(true);
      const cancel = speakSentences(
        sentences,
        (index) => setHighlightedSentence(index),
        () => {
          setIsPlaying(false);
          setHighlightedSentence(-1);
          cancelPlayRef.current = null;
        },
        playbackRate
      );
      cancelPlayRef.current = cancel;
    }
  }

  async function handleSentenceClick(sentence: string, idx: number) {
    // 停止目前播放
    if (cancelPlayRef.current) {
      cancelPlayRef.current();
      cancelPlayRef.current = null;
      setIsPlaying(false);
    }
    stopSpeaking();

    setHighlightedSentence(idx);
    try {
      await speak(sentence, playbackRate);
    } catch {
      // 忽略播放錯誤
    }
    setHighlightedSentence(-1);
  }

  function handleWordClick(word: string, e: React.MouseEvent) {
    const wordData = article?.words.find(
      (w) => w.word.toLowerCase() === word.toLowerCase().replace(/[^\w]/g, "")
    );

    if (wordData) {
      // 用 Azure TTS 朗讀單字
      speak(wordData.word, 0.7);

      setActiveWord({
        word: wordData.word,
        phonetic: wordData.phonetic,
        translation: wordData.translation,
        example: wordData.exampleSentence,
        x: e.clientX,
        y: e.clientY,
      });
    }
  }

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <span className="text-4xl animate-bounce-slow block">📖</span>
          <p className="text-gray-500 mt-2">載入文章中...</p>
        </div>
      </StudentLayout>
    );
  }

  if (!article) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <span className="text-4xl block mb-2">😕</span>
          <p className="text-gray-500">找不到這篇文章</p>
          <button
            onClick={() => router.push("/articles")}
            className="btn-kid-primary mt-4"
          >
            回到文章列表
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      {/* 返回按鈕 */}
      <button
        onClick={() => {
          stopSpeaking();
          if (cancelPlayRef.current) cancelPlayRef.current();
          router.push("/articles");
        }}
        className="flex items-center gap-1 text-primary-500 font-bold mb-4 hover:text-primary-700"
      >
        ← 回到文章列表
      </button>

      {/* 文章標題 */}
      <div className="card-kid mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${getLevelColor(
              article.level
            )}`}
          >
            {getLevelLabel(article.level)}
          </span>
          {article.topic && (
            <span className="text-xs text-gray-400">{article.topic}</span>
          )}
        </div>
        <h1 className="text-kid-xl font-black text-gray-800">
          {article.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{article.titleZh}</p>
      </div>

      {/* 播放控制 */}
      <div className="card-kid mb-4 flex items-center justify-between">
        <button
          onClick={handlePlayAll}
          className={`btn-kid ${
            isPlaying
              ? "bg-red-100 text-red-600 hover:bg-red-200"
              : "bg-primary-100 text-primary-600 hover:bg-primary-200"
          } !px-5 !py-2`}
        >
          {isPlaying ? "⏹ 停止" : "🔊 播放朗讀"}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">速度</span>
          {[0.5, 0.75, 1.0].map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                playbackRate === rate
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* 文章內文 */}
      <div className="card-kid mb-4">
        <div className="leading-loose text-kid-lg">
          {sentences.map((sentence, idx) => (
            <span
              key={idx}
              className={`inline cursor-pointer transition-all duration-300 ${
                highlightedSentence === idx
                  ? "bg-kid-yellow/30 rounded px-1"
                  : ""
              }`}
              onClick={() => handleSentenceClick(sentence, idx)}
            >
              {sentence.split(/(\s+)/).map((word, wIdx) => {
                const cleanWord = word.replace(/[^\w]/g, "").toLowerCase();
                const isKeyWord = article.words.some(
                  (w) => w.word.toLowerCase() === cleanWord
                );
                return (
                  <span
                    key={wIdx}
                    className={
                      isKeyWord
                        ? "text-primary-600 font-bold underline decoration-dotted decoration-primary-300 cursor-pointer hover:bg-primary-50 rounded px-0.5"
                        : ""
                    }
                    onClick={(e) => {
                      if (isKeyWord) {
                        e.stopPropagation();
                        handleWordClick(word, e);
                      }
                    }}
                  >
                    {word}
                  </span>
                );
              })}{" "}
            </span>
          ))}
        </div>

        {/* 翻譯切換 */}
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className="mt-4 text-sm text-gray-400 hover:text-primary-500 flex items-center gap-1"
        >
          {showTranslation ? "🙈 隱藏翻譯" : "👀 顯示中文翻譯"}
        </button>
        {showTranslation && article.contentZh && (
          <p className="mt-2 text-sm text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-lg">
            {article.contentZh}
          </p>
        )}
      </div>

      {/* 單字列表 */}
      <div className="card-kid mb-4">
        <h2 className="text-kid-lg font-black text-gray-700 mb-3">
          📝 重點單字
        </h2>
        <div className="space-y-3">
          {article.words.map((word) => (
            <div
              key={word.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-kid cursor-pointer hover:bg-primary-50 transition-colors"
              onClick={() => speak(word.word, 0.7)}
            >
              <span className="text-2xl">🔊</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-kid-base text-primary-700">
                    {word.word}
                  </span>
                  {word.phonetic && (
                    <span className="text-xs text-gray-400">
                      {word.phonetic}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{word.translation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 開始練習按鈕 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            stopSpeaking();
            if (cancelPlayRef.current) cancelPlayRef.current();
            router.push(`/speaking?articleId=${article.id}`);
          }}
          className="btn-kid-accent w-full"
        >
          🎤 口說練習
        </button>
        <button
          onClick={() => {
            stopSpeaking();
            if (cancelPlayRef.current) cancelPlayRef.current();
            router.push(`/vocabulary?articleId=${article.id}`);
          }}
          className="btn-kid-success w-full"
        >
          ✏️ 單字練習
        </button>
      </div>

      {/* 單字彈出卡片 */}
      {activeWord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={() => setActiveWord(null)}
        >
          <div
            className="bg-white rounded-kid-lg p-6 shadow-2xl max-w-xs w-full mx-4 animate-star-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-3">
              <h3 className="text-kid-2xl font-black text-primary-600">
                {activeWord.word}
              </h3>
              {activeWord.phonetic && (
                <p className="text-sm text-gray-400">{activeWord.phonetic}</p>
              )}
            </div>
            <p className="text-kid-base text-center font-bold text-gray-700 mb-3">
              {activeWord.translation}
            </p>
            {activeWord.example && (
              <p className="text-sm text-gray-500 text-center bg-gray-50 p-2 rounded-lg">
                {activeWord.example}
              </p>
            )}
            <button
              onClick={() => speak(activeWord.word, 0.6)}
              className="btn-kid-primary w-full mt-4"
            >
              🔊 再聽一次
            </button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
