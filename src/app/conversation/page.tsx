"use client";

import { useState, useRef, useEffect } from "react";
import StudentLayout from "@/components/student/StudentLayout";
import { scenarios, type Scenario } from "@/lib/conversation";
import type { GrammarError } from "@/lib/grammar";

interface ChatMessage {
  role: "ai" | "user";
  text: string;
  textZh?: string;
  grammarErrors?: GrammarError[];
}

interface ConversationSummary {
  totalMessages: number;
  wordsUsed: string[];
  grammarCorrectRate: number;
  scenarioTitle: string;
}

export default function ConversationPage() {
  const [step, setStep] = useState<"select" | "chat" | "summary">("select");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState("start");
  const [isEnded, setIsEnded] = useState(false);
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [showZh, setShowZh] = useState<Record<number, boolean>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function startScenario(s: Scenario) {
    setScenario(s);
    setMessages([
      {
        role: "ai",
        text: s.starterMessage,
        textZh: s.starterMessageZh,
      },
    ]);
    setCurrentNodeId("start");
    setIsEnded(false);
    setSummary(null);
    setShowZh({});
    setStep("chat");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleSend() {
    if (!input.trim() || !scenario || isLoading || isEnded) return;
    const userMsg = input.trim();
    setInput("");
    setIsLoading(true);

    // 加入使用者訊息（先不帶文法錯誤）
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);

    try {
      const res = await fetch("/api/conversation/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          currentNodeId,
          userMessage: userMsg,
        }),
      });

      const data = await res.json();

      // 更新使用者訊息的文法錯誤
      setMessages((prev) => {
        const updated = [...prev];
        const lastUserIdx = updated.length - 1;
        if (updated[lastUserIdx]?.role === "user") {
          updated[lastUserIdx] = {
            ...updated[lastUserIdx],
            grammarErrors: data.grammarErrors || [],
          };
        }
        return updated;
      });

      // 加入 AI 回覆
      if (data.aiMessage) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: data.aiMessage,
            textZh: data.aiMessageZh,
          },
        ]);
      }

      setCurrentNodeId(data.nextNodeId || currentNodeId);

      if (data.isEnd) {
        setIsEnded(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Oops! Something went wrong. Try again!" },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  }

  function calculateSummary() {
    if (!scenario) return;

    const userMessages = messages.filter((m) => m.role === "user");
    const allWords = userMessages
      .flatMap((m) => m.text.toLowerCase().split(/\s+/))
      .filter(Boolean);
    const uniqueWords = Array.from(new Set(allWords));

    // 找出情境相關的單字
    const vocabWords = scenario.vocabulary
      .filter((v) => allWords.some((w) => w.includes(v.word.toLowerCase())))
      .map((v) => v.word);

    const totalErrors = userMessages.reduce(
      (sum, m) => sum + (m.grammarErrors?.length || 0),
      0
    );
    const correctRate =
      userMessages.length > 0
        ? Math.round(
            ((userMessages.length - Math.min(totalErrors, userMessages.length)) /
              userMessages.length) *
              100
          )
        : 100;

    setSummary({
      totalMessages: userMessages.length,
      wordsUsed: vocabWords.length > 0 ? vocabWords : uniqueWords.slice(0, 8),
      grammarCorrectRate: correctRate,
      scenarioTitle: scenario.titleZh,
    });
    setStep("summary");
  }

  function toggleZh(idx: number) {
    setShowZh((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  // ===== 選擇情境 =====
  if (step === "select") {
    return (
      <StudentLayout>
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              💬 AI 對話練習
            </h1>
            <p className="text-gray-500 mt-1">選一個情境，開始用英文對話吧！</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => startScenario(s)}
                className="bg-white rounded-2xl p-4 shadow-sm border-2 border-gray-100 hover:border-primary-300 hover:shadow-md transition-all text-left active:scale-95"
              >
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-bold text-gray-800 text-sm">
                  {s.title}
                </div>
                <div className="text-gray-500 text-xs mt-0.5">
                  {s.titleZh}
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      s.level === "easy"
                        ? "bg-green-100 text-green-600"
                        : s.level === "medium"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {s.level === "easy"
                      ? "簡單"
                      : s.level === "medium"
                      ? "中等"
                      : "進階"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ===== 對話總結 =====
  if (step === "summary" && summary) {
    return (
      <StudentLayout>
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">🎊</div>
            <h2 className="text-xl font-bold text-gray-800">對話完成！</h2>
            <p className="text-gray-500 text-sm">{summary.scenarioTitle}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">你說了</span>
              <span className="text-xl font-bold text-primary-600">
                {summary.totalMessages} 句
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">文法正確率</span>
              <span
                className={`text-xl font-bold ${
                  summary.grammarCorrectRate >= 80
                    ? "text-green-500"
                    : summary.grammarCorrectRate >= 60
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {summary.grammarCorrectRate}%
              </span>
            </div>

            <div>
              <span className="text-gray-600 block mb-2">使用的單字</span>
              <div className="flex flex-wrap gap-2">
                {summary.wordsUsed.map((w, i) => (
                  <span
                    key={i}
                    className="bg-primary-50 text-primary-700 px-2 py-1 rounded-lg text-sm font-medium"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (scenario) startScenario(scenario);
              }}
              className="flex-1 bg-primary-100 text-primary-700 font-bold py-3 rounded-xl active:scale-95 transition-transform"
            >
              🔄 再練一次
            </button>
            <button
              onClick={() => setStep("select")}
              className="flex-1 bg-primary-500 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform"
            >
              📋 換情境
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ===== 聊天介面 =====
  return (
    <StudentLayout>
      <div className="flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
        {/* 頂部資訊列 */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border-2 border-gray-100 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{scenario?.icon}</span>
            <div>
              <div className="font-bold text-sm text-gray-800">
                {scenario?.title}
              </div>
              <div className="text-[10px] text-gray-400">
                {scenario?.aiRoleZh}跟你對話
              </div>
            </div>
          </div>
          <button
            onClick={() => setStep("select")}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg"
          >
            結束
          </button>
        </div>

        {/* 提示單字 */}
        {scenario && (
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {scenario.vocabulary.map((v, i) => (
              <span
                key={i}
                className="shrink-0 bg-amber-50 text-amber-700 text-[11px] px-2 py-1 rounded-full border border-amber-200"
              >
                {v.word}
                <span className="text-amber-400 ml-1">{v.meaning}</span>
              </span>
            ))}
          </div>
        )}

        {/* 聊天訊息區 */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-2">
          {messages.map((msg, idx) => (
            <div key={idx}>
              <div
                className={`flex ${
                  msg.role === "ai" ? "justify-start" : "justify-end"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg mr-2 shrink-0 mt-1">
                    {scenario?.icon || "🤖"}
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "ai"
                      ? "bg-gray-100 text-gray-800 rounded-tl-md"
                      : "bg-primary-500 text-white rounded-tr-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  {msg.role === "ai" && msg.textZh && (
                    <button
                      onClick={() => toggleZh(idx)}
                      className="text-[10px] text-gray-400 mt-1 hover:text-gray-600"
                    >
                      {showZh[idx] ? msg.textZh : "💡 看中文"}
                    </button>
                  )}
                </div>
              </div>

              {/* 文法錯誤提示 */}
              {msg.role === "user" &&
                msg.grammarErrors &&
                msg.grammarErrors.length > 0 && (
                  <div className="flex justify-end mt-1 mr-1">
                    <div className="max-w-[75%] space-y-0.5">
                      {msg.grammarErrors.slice(0, 3).map((err, errIdx) => (
                        <div
                          key={errIdx}
                          className="text-[11px] text-red-400 bg-red-50 rounded-lg px-2 py-1"
                        >
                          <span className="font-medium">
                            {err.text || "缺少"} → {err.suggestion}
                          </span>
                          <span className="text-red-300 ml-1">
                            {err.explanation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg mr-2">
                {scenario?.icon || "🤖"}
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* 底部輸入區 */}
        {isEnded ? (
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={calculateSummary}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform text-base shadow-sm"
            >
              🎉 查看對話總結
            </button>
          </div>
        ) : (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="用英文回答..."
                className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400 transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-primary-500 text-white px-4 py-3 rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
              >
                送出
              </button>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
