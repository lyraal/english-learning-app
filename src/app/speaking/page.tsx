"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import StudentLayout from "@/components/student/StudentLayout";
import {
  scoreToStars,
  speak,
  stopSpeaking,
  startRecording,
  assessPronunciation,
  checkMicrophone,
} from "@/lib/speech";
import type { RecordingSession } from "@/lib/speech";

interface SpeakingArticle {
  id: string;
  title: string;
  content: string;
  level: string;
}

interface WordScore {
  word: string;
  score: number;
  status: "good" | "fair" | "poor";
  errorType?: string;
}

interface SpeechResult {
  transcript: string;
  overallScore: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  wordScores: WordScore[];
}

export default function SpeakingPage() {
  const searchParams = useSearchParams();
  const articleId = searchParams.get("articleId");

  const [articles, setArticles] = useState<SpeakingArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<SpeakingArticle | null>(null);
  const [loading, setLoading] = useState(true);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingExample, setIsPlayingExample] = useState(false);
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [error, setError] = useState("");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [mode, setMode] = useState<"full" | "sentence">("sentence");

  const recordingSessionRef = useRef<RecordingSession | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  async function fetchArticles() {
    try {
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
        if (articleId) {
          const found = data.find((a: any) => a.id === articleId);
          if (found) setSelectedArticle(found);
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  const sentences = selectedArticle?.content.split(/(?<=[.!?])\s+/) || [];
  const currentTarget =
    mode === "sentence" ? sentences[currentSentenceIndex] || "" : selectedArticle?.content || "";

  async function playExample() {
    if (isPlayingExample) {
      stopSpeaking();
      setIsPlayingExample(false);
      return;
    }

    setIsPlayingExample(true);
    try {
      await speak(currentTarget, 0.75);
    } catch (err) {
      console.warn("播放範例失敗:", err);
    } finally {
      setIsPlayingExample(false);
    }
  }

  async function handleStartRecording() {
    setError("");
    setResult(null);

    try {
      const session = await startRecording();
      recordingSessionRef.current = session;
      setIsRecording(true);
    } catch (err: any) {
      setError(err.message || "無法啟動錄音");
    }
  }

  async function handleStopRecording() {
    if (!recordingSessionRef.current) return;

    setIsRecording(false);
    setIsProcessing(true);

    try {
      const audioBlob = await recordingSessionRef.current.stop();

      console.log(`[speaking] WAV blob size: ${(audioBlob.size / 1024).toFixed(1)}KB`);

      // 呼叫 Azure Pronunciation Assessment
      const speechResult = await assessPronunciation(audioBlob, currentTarget);

      setResult({
        transcript: speechResult.transcript,
        overallScore: speechResult.overallScore,
        accuracy: speechResult.accuracy,
        fluency: speechResult.fluency,
        completeness: speechResult.completeness,
        wordScores: speechResult.wordScores,
      });

      // 儲存紀錄
      fetch("/api/speaking/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: selectedArticle?.id,
          type: "speaking",
          transcript: speechResult.transcript,
          score: speechResult.overallScore,
          accuracy: speechResult.accuracy,
          fluency: speechResult.fluency,
          completeness: speechResult.completeness,
          wordScores: JSON.stringify(speechResult.wordScores),
        }),
      }).catch(() => {});
    } catch (err: any) {
      setError(err.message || "發音評估失敗，請再試一次");
    } finally {
      setIsProcessing(false);
      recordingSessionRef.current = null;
    }
  }

  function nextSentence() {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex((p) => p + 1);
      setResult(null);
      setError("");
    }
  }

  function prevSentence() {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex((p) => p - 1);
      setResult(null);
      setError("");
    }
  }

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <span className="text-4xl animate-bounce-slow block">🎤</span>
          <p className="text-gray-500 mt-2">載入中...</p>
        </div>
      </StudentLayout>
    );
  }

  // Article selection
  if (!selectedArticle) {
    return (
      <StudentLayout>
        <h1 className="text-kid-xl font-black text-gray-800 mb-2">
          🎤 口說練習
        </h1>
        <p className="text-kid-sm text-gray-500 mb-6">選擇一篇文章來練習朗讀</p>
        <div className="space-y-3">
          {articles.map((article) => (
            <button
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="card-kid w-full text-left flex items-center gap-3"
            >
              <span className="text-3xl">📖</span>
              <div className="flex-1">
                <p className="font-black text-kid-base">{article.title}</p>
                <p className="text-xs text-gray-400">
                  {article.level.replace("LEVEL", "Level ")}
                </p>
              </div>
              <span className="text-2xl text-gray-300">›</span>
            </button>
          ))}
        </div>
      </StudentLayout>
    );
  }

  const stars = result ? scoreToStars(result.overallScore) : 0;

  return (
    <StudentLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            setSelectedArticle(null);
            setResult(null);
            setCurrentSentenceIndex(0);
            stopSpeaking();
          }}
          className="text-primary-500 font-bold hover:text-primary-700"
        >
          ← 選擇文章
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => { setMode("sentence"); setResult(null); }}
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              mode === "sentence" ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            逐句
          </button>
          <button
            onClick={() => { setMode("full"); setResult(null); }}
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              mode === "full" ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            全文
          </button>
        </div>
      </div>

      {/* Target text */}
      <div className="card-kid mb-4 text-center">
        <p className="text-xs text-gray-400 mb-2">
          {mode === "sentence" ? `第 ${currentSentenceIndex + 1}/${sentences.length} 句` : "全文朗讀"}
        </p>
        <p className="text-kid-xl font-bold text-gray-800 leading-relaxed mb-4">
          {result
            ? result.wordScores.map((ws, i) => (
                <span
                  key={i}
                  className={`inline-block mx-0.5 px-1 rounded ${
                    ws.status === "good"
                      ? "word-good"
                      : ws.status === "fair"
                      ? "word-fair"
                      : "word-poor"
                  }`}
                  title={`${ws.score}分${ws.errorType && ws.errorType !== "None" ? ` (${ws.errorType})` : ""}`}
                >
                  {ws.word}
                </span>
              ))
            : currentTarget}
        </p>

        {/* Play example button */}
        <button
          onClick={playExample}
          className={`btn-kid ${
            isPlayingExample
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-primary-50 text-primary-600 hover:bg-primary-100"
          } !px-5 !py-2 mb-4`}
        >
          {isPlayingExample ? "⏹ 停止播放" : "🔊 聽範例"}
        </button>

        {/* Sentence navigation */}
        {mode === "sentence" && (
          <div className="flex justify-center gap-3 mb-2">
            <button
              onClick={prevSentence}
              disabled={currentSentenceIndex === 0}
              className="px-3 py-1 rounded-lg bg-gray-100 text-gray-500 disabled:opacity-30"
            >
              ← 上一句
            </button>
            <button
              onClick={nextSentence}
              disabled={currentSentenceIndex >= sentences.length - 1}
              className="px-3 py-1 rounded-lg bg-gray-100 text-gray-500 disabled:opacity-30"
            >
              下一句 →
            </button>
          </div>
        )}
      </div>

      {/* Recording button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isProcessing}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl
                     transition-all active:scale-90 shadow-lg ${
                       isRecording
                         ? "bg-red-500 text-white recording-pulse"
                         : isProcessing
                         ? "bg-gray-300 text-gray-500"
                         : "bg-accent-500 text-white hover:bg-accent-600 hover:scale-105"
                     }`}
        >
          {isRecording ? "⏹" : isProcessing ? "⏳" : "🎤"}
        </button>
      </div>

      <p className="text-center text-sm text-gray-400 mb-4">
        {isRecording
          ? "正在錄音... 說完後點擊停止"
          : isProcessing
          ? "Azure 語音分析中..."
          : "點擊麥克風開始錄音"}
      </p>

      {/* Error */}
      {error && (
        <div className="card-kid bg-red-50 border-red-200 text-center text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card-kid mb-4">
          <div className="text-center mb-4">
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`text-3xl ${
                    s <= stars ? "animate-star-pop" : "opacity-30"
                  }`}
                  style={{ animationDelay: `${s * 0.1}s` }}
                >
                  ⭐
                </span>
              ))}
            </div>
            <p className="text-kid-2xl font-black text-primary-600">
              {result.overallScore} 分
            </p>
            <p className="text-xs text-gray-400 mt-1">Azure Pronunciation Assessment</p>
          </div>

          {/* Score breakdown */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">準確度</p>
              <p className="text-lg font-black text-primary-600">
                {result.accuracy}%
              </p>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">流暢度</p>
              <p className="text-lg font-black text-success-600">
                {result.fluency}%
              </p>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">完整度</p>
              <p className="text-lg font-black text-accent-600">
                {result.completeness}%
              </p>
            </div>
          </div>

          {/* Word-level feedback legend */}
          <div className="flex justify-center gap-4 mb-3 text-xs text-gray-500">
            <span><span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300 mr-1"></span>良好 ≥80</span>
            <span><span className="inline-block w-3 h-3 rounded bg-yellow-100 border border-yellow-300 mr-1"></span>尚可 50-79</span>
            <span><span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300 mr-1"></span>需加強 &lt;50</span>
          </div>

          {/* Transcript */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-400 mb-1">你說的是：</p>
            <p className="text-sm text-gray-600">{result.transcript}</p>
          </div>

          <button
            onClick={() => setResult(null)}
            className="btn-kid-accent w-full"
          >
            🔄 再試一次
          </button>
        </div>
      )}
    </StudentLayout>
  );
}
