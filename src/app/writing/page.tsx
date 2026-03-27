"use client";

import { useState } from "react";
import StudentLayout from "@/components/student/StudentLayout";
import { writingPrompts, type WritingPrompt } from "@/lib/grammar";
import type { GrammarError, GrammarScore } from "@/lib/grammar";

interface CheckResult {
  errors: GrammarError[];
  correctedText: string;
  score: GrammarScore;
  feedback: string;
}

export default function WritingPage() {
  const [step, setStep] = useState<"select" | "write" | "result">("select");
  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt | null>(null);
  const [text, setText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [showCorrected, setShowCorrected] = useState(false);

  async function handleCheck() {
    if (!text.trim()) return;
    setIsChecking(true);
    try {
      const res = await fetch("/api/writing/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          prompt: selectedPrompt?.title || "Free writing",
          promptZh: selectedPrompt?.titleZh || "自由寫作",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setStep("result");
      }
    } catch (err) {
      console.error("Check failed:", err);
    } finally {
      setIsChecking(false);
    }
  }

  function renderHighlightedText() {
    if (!result || result.errors.length === 0) {
      return <p className="text-kid-base leading-relaxed">{text}</p>;
    }

    // 按位置排序錯誤
    const sortedErrors = [...result.errors].sort((a, b) => a.position - b.position);
    const segments: React.ReactNode[] = [];
    let lastIdx = 0;

    sortedErrors.forEach((err, i) => {
      if (err.position > lastIdx) {
        segments.push(
          <span key={`text-${i}`}>{text.slice(lastIdx, err.position)}</span>
        );
      }
      if (err.length > 0) {
        segments.push(
          <span
            key={`err-${i}`}
            className="bg-red-100 border-b-2 border-red-400 px-0.5 rounded cursor-pointer relative group"
            title={err.explanation}
          >
            {text.slice(err.position, err.position + err.length)}
            <span className="absolute bottom-full left-0 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap z-10 mb-1">
              ✏️ {err.suggestion} — {err.explanation}
            </span>
          </span>
        );
        lastIdx = err.position + err.length;
      } else {
        // 插入型錯誤（如缺少標點）
        segments.push(
          <span
            key={`insert-${i}`}
            className="text-red-500 font-bold cursor-pointer relative group"
            title={err.explanation}
          >
            ⚠️
            <span className="absolute bottom-full left-0 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap z-10 mb-1">
              需要加上 {err.suggestion} — {err.explanation}
            </span>
          </span>
        );
      }
    });

    if (lastIdx < text.length) {
      segments.push(<span key="text-end">{text.slice(lastIdx)}</span>);
    }

    return <p className="text-kid-base leading-relaxed">{segments}</p>;
  }

  function renderScoreBar(label: string, value: number, color: string) {
    return (
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-bold text-gray-600">{label}</span>
          <span className={`text-sm font-black ${color}`}>{value} 分</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${
              value >= 80 ? "bg-success-400" : value >= 60 ? "bg-accent-400" : "bg-red-400"
            }`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  }

  // ===== 選題畫面 =====
  if (step === "select") {
    return (
      <StudentLayout>
        <div className="mb-4">
          <h1 className="text-kid-xl font-black text-gray-800 mb-1">✍️ 寫作練習</h1>
          <p className="text-kid-sm text-gray-500">選一個題目，用英文寫一篇短文吧！</p>
        </div>

        <div className="space-y-3">
          {writingPrompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => {
                setSelectedPrompt(prompt);
                setStep("write");
                setText("");
                setResult(null);
              }}
              className="card-kid w-full text-left hover:border-primary-300 active:scale-[0.98] transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">📝</span>
                <div className="flex-1">
                  <p className="font-black text-kid-sm text-gray-800">{prompt.title}</p>
                  <p className="text-sm text-gray-500">{prompt.titleZh}</p>
                  <p className="text-xs text-gray-400 mt-1">{prompt.descriptionZh}</p>
                </div>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full font-bold shrink-0">
                  {prompt.level.replace("LEVEL", "Lv.")}
                </span>
              </div>
            </button>
          ))}
        </div>
      </StudentLayout>
    );
  }

  // ===== 寫作畫面 =====
  if (step === "write") {
    return (
      <StudentLayout>
        <div className="mb-4">
          <button
            onClick={() => setStep("select")}
            className="text-sm text-primary-500 font-bold mb-2 inline-block"
          >
            ← 回到題目列表
          </button>
          <h1 className="text-kid-xl font-black text-gray-800">{selectedPrompt?.title}</h1>
          <p className="text-kid-sm text-gray-500">{selectedPrompt?.titleZh}</p>
        </div>

        {/* 題目描述 */}
        <div className="card-kid bg-primary-50 mb-4 !border-primary-200">
          <p className="text-sm text-primary-700">{selectedPrompt?.description}</p>
          <p className="text-xs text-primary-500 mt-1">{selectedPrompt?.descriptionZh}</p>
        </div>

        {/* 提示句 */}
        <div className="card-kid bg-accent-50 mb-4 !border-accent-200">
          <p className="text-sm font-bold text-accent-700 mb-2">💡 小提示：可以用這些句子開頭</p>
          <div className="space-y-1">
            {selectedPrompt?.hints.map((hint, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-accent-500">•</span>
                <div>
                  <span className="text-accent-700">{hint}</span>
                  <span className="text-accent-400 text-xs ml-1">
                    {selectedPrompt.hintsZh[i]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 寫作區 */}
        <div className="mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start writing in English here..."
            className="w-full h-48 p-4 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-kid-sm resize-none"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{text.split(/\s+/).filter(Boolean).length} 個字</span>
            <span>{text.length} 字元</span>
          </div>
        </div>

        {/* 檢查按鈕 */}
        <button
          onClick={handleCheck}
          disabled={!text.trim() || isChecking}
          className={`w-full py-4 rounded-xl text-white font-black text-kid-lg transition-all ${
            !text.trim() || isChecking
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-primary-500 hover:bg-primary-600 active:scale-[0.98] shadow-lg"
          }`}
        >
          {isChecking ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> 正在檢查中...
            </span>
          ) : (
            "🔍 檢查文法"
          )}
        </button>
      </StudentLayout>
    );
  }

  // ===== 結果畫面 =====
  return (
    <StudentLayout>
      <div className="mb-4">
        <button
          onClick={() => {
            setStep("write");
            setResult(null);
          }}
          className="text-sm text-primary-500 font-bold mb-2 inline-block"
        >
          ← 回去修改
        </button>
        <h1 className="text-kid-xl font-black text-gray-800">📊 檢查結果</h1>
      </div>

      {/* 整體分數 */}
      <div className={`card-kid mb-4 text-center py-6 ${
        (result?.score.overall ?? 0) >= 80
          ? "bg-success-50 !border-success-300"
          : (result?.score.overall ?? 0) >= 60
          ? "bg-accent-50 !border-accent-300"
          : "bg-red-50 !border-red-300"
      }`}>
        <p className="text-6xl font-black mb-2">
          {(result?.score.overall ?? 0) >= 80 ? "🌟" : (result?.score.overall ?? 0) >= 60 ? "👍" : "💪"}
        </p>
        <p className="text-kid-2xl font-black">
          {result?.score.overall ?? 0} 分
        </p>
        <p className="text-sm text-gray-600 mt-1">{result?.feedback}</p>
      </div>

      {/* 各項分數 */}
      <div className="card-kid mb-4">
        <h2 className="font-black text-kid-sm text-gray-700 mb-3">📈 詳細評分</h2>
        {renderScoreBar("文法正確性", result?.score.grammar ?? 0, "text-primary-600")}
        {renderScoreBar("句子結構", result?.score.structure ?? 0, "text-success-600")}
        {renderScoreBar("詞彙使用", result?.score.vocabulary ?? 0, "text-accent-600")}
      </div>

      {/* 錯誤標記 */}
      <div className="card-kid mb-4">
        <h2 className="font-black text-kid-sm text-gray-700 mb-3">
          📝 你的文章
          {result && result.errors.length > 0 && (
            <span className="text-xs text-red-500 font-normal ml-2">
              （找到 {result.errors.length} 個可以改進的地方）
            </span>
          )}
        </h2>
        <div className="bg-gray-50 rounded-lg p-4">{renderHighlightedText()}</div>
      </div>

      {/* 錯誤列表 */}
      {result && result.errors.length > 0 && (
        <div className="card-kid mb-4">
          <h2 className="font-black text-kid-sm text-gray-700 mb-3">🔧 修正建議</h2>
          <div className="space-y-3">
            {result.errors.map((err, i) => (
              <div key={i} className="bg-red-50 rounded-lg p-3 border border-red-100">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 text-lg">❌</span>
                  <div className="flex-1">
                    {err.length > 0 ? (
                      <p className="text-sm">
                        <span className="line-through text-red-500 font-bold">{err.text}</span>
                        <span className="mx-1">→</span>
                        <span className="text-success-600 font-bold">{err.suggestion}</span>
                      </p>
                    ) : (
                      <p className="text-sm">
                        <span className="text-success-600 font-bold">需要加上 {err.suggestion}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">💡 {err.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 修正版本 */}
      {result && result.errors.length > 0 && (
        <div className="card-kid mb-4">
          <button
            onClick={() => setShowCorrected(!showCorrected)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="font-black text-kid-sm text-success-700">
              ✅ {showCorrected ? "修正後的版本" : "點擊查看修正版本"}
            </h2>
            <span className="text-lg">{showCorrected ? "🔼" : "🔽"}</span>
          </button>
          {showCorrected && (
            <div className="bg-success-50 rounded-lg p-4 mt-3 border border-success-200">
              <p className="text-kid-base leading-relaxed text-success-800">
                {result.correctedText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="space-y-3 mb-8">
        <button
          onClick={() => {
            setStep("write");
            setResult(null);
          }}
          className="w-full py-3 rounded-xl bg-primary-500 text-white font-black text-kid-sm hover:bg-primary-600 active:scale-[0.98] transition-all"
        >
          ✏️ 再修改一次
        </button>
        <button
          onClick={() => {
            setStep("select");
            setText("");
            setResult(null);
            setSelectedPrompt(null);
          }}
          className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-black text-kid-sm hover:bg-gray-200 active:scale-[0.98] transition-all"
        >
          📝 換一個題目
        </button>
      </div>
    </StudentLayout>
  );
}
