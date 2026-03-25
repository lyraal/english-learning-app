"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import StudentLayout from "@/components/student/StudentLayout";
import { scoreToStars } from "@/lib/speech";

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
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [error, setError] = useState("");
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [mode, setMode] = useState<"full" | "sentence">("sentence");

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  function playExample() {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentTarget);
    utterance.lang = "en-US";
    utterance.rate = 0.75;
    window.speechSynthesis.speak(utterance);
  }

  async function startRecording() {
    setError("");
    setResult(null);

    try {
      // Start audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);

      // Start speech recognition
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        throw new Error("此瀏覽器不支援語音辨識，請使用 Chrome");
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        processResult(transcript, confidence);
      };

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech") {
          setError("沒有偵測到語音，請對著麥克風大聲說！");
        } else {
          setError("語音辨識失敗，請再試一次");
        }
        stopRecording();
      };

      recognition.onend = () => {
        stopMediaRecorder();
      };

      recognition.start();
      setIsRecording(true);
    } catch (err: any) {
      setError(err.message || "無法啟動錄音");
    }
  }

  function stopRecording() {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    stopMediaRecorder();
  }

  function stopMediaRecorder() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  }

  function processResult(transcript: string, confidence: number) {
    setIsProcessing(true);
    setIsRecording(false);

    const targetWords = currentTarget.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
    const spokenWords = transcript.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);

    const wordScores: WordScore[] = targetWords.map((tw) => {
      const found = spokenWords.some(
        (sw) => sw === tw || levenshtein(sw, tw) <= Math.max(1, Math.floor(tw.length * 0.3))
      );
      const score = found ? Math.round(70 + confidence * 30) : Math.round(confidence * 30);
      return {
        word: tw,
        score,
        status: score >= 80 ? "good" : score >= 50 ? "fair" : "poor",
      };
    });

    const matched = wordScores.filter((w) => w.status !== "poor").length;
    const completeness = Math.round((matched / targetWords.length) * 100);
    const accuracy = Math.round(wordScores.reduce((s, w) => s + w.score, 0) / wordScores.length);
    const fluency = Math.round(confidence * 100);
    const overallScore = Math.round(accuracy * 0.4 + fluency * 0.3 + completeness * 0.3);

    const speechResult: SpeechResult = {
      transcript,
      overallScore,
      accuracy,
      fluency,
      completeness,
      wordScores,
    };

    setResult(speechResult);
    setIsProcessing(false);

    // Save record
    fetch("/api/speaking/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId: selectedArticle?.id,
        type: "speaking",
        transcript,
        score: overallScore,
        accuracy,
        fluency,
        completeness,
        wordScores: JSON.stringify(wordScores),
      }),
    }).catch(() => {});
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
                >
                  {ws.word}
                </span>
              ))
            : currentTarget}
        </p>

        {/* Play example button */}
        <button
          onClick={playExample}
          className="btn-kid bg-primary-50 text-primary-600 hover:bg-primary-100 !px-5 !py-2 mb-4"
        >
          🔊 聽範例
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
          onClick={isRecording ? stopRecording : startRecording}
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
          ? "分析中..."
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

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return dp[a.length][b.length];
}
