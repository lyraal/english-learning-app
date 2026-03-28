"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import StudentLayout from "@/components/student/StudentLayout";
import { speak, startRecording, assessPronunciation } from "@/lib/speech";
import { getWordEmoji } from "@/lib/word-images";

interface Word {
  id: string;
  word: string;
  phonetic: string | null;
  translation: string;
  imageUrl: string | null;
}

type GameType = "spelling" | "picture_match" | "drag_letters" | "picture_speak";

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Confetti component
function Confetti() {
  const emojis = ["🌟", "⭐", "✨", "🎉", "🎊", "💫", "🏆", "👏", "🎯", "💯", "🌈", "🎵"];
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {emojis.map((emoji, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${5 + (i * 8) % 90}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${2 + Math.random() * 1.5}s`,
            fontSize: `${1.2 + Math.random() * 0.8}rem`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}

export default function VocabularyPage() {
  return (
    <Suspense fallback={<StudentLayout><p className="text-center py-12 text-gray-500">載入中...</p></StudentLayout>}>
      <VocabularyPageContent />
    </Suspense>
  );
}

function VocabularyPageContent() {
  const searchParams = useSearchParams();
  const articleId = searchParams.get("articleId");

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Spelling game state
  const [userInput, setUserInput] = useState("");
  const [letterPool, setLetterPool] = useState<string[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);

  // Picture match state
  const [matchOptions, setMatchOptions] = useState<string[]>([]);

  // Picture speak state
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");

  useEffect(() => {
    fetchWords();
  }, [articleId]);

  async function fetchWords() {
    try {
      const url = articleId
        ? `/api/vocabulary?articleId=${articleId}`
        : "/api/vocabulary";
      const res = await fetch(url);
      if (res.ok) {
        let data = await res.json();
        if (data.length > 0) {
          // 每組練習限制 10 題，隨機抽取
          if (data.length > 10) {
            data = shuffleArray(data).slice(0, 10);
          }
          setWords(data);
        } else {
          setWords(sampleWords.slice(0, 10));
        }
      } else {
        setWords(sampleWords.slice(0, 10));
      }
    } catch {
      setWords(sampleWords.slice(0, 10));
    } finally {
      setLoading(false);
    }
  }

  const currentWord = words[currentIndex];

  // Initialize game when type or word changes
  useEffect(() => {
    if (!currentWord || !gameType) return;

    if (gameType === "spelling" || gameType === "drag_letters") {
      const letters = currentWord.word.split("");
      const shuffled = [...letters].sort(() => Math.random() - 0.5);
      const extras = "abcdefghijklmnopqrstuvwxyz"
        .split("")
        .filter((l) => !letters.includes(l))
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(3, 8 - letters.length));
      setLetterPool([...shuffled, ...extras].sort(() => Math.random() - 0.5));
      setSelectedLetters([]);
      setUserInput("");
    }

    if (gameType === "picture_match") {
      const others = words
        .filter((w) => w.id !== currentWord.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.word);
      const options = [...others, currentWord.word].sort(
        () => Math.random() - 0.5
      );
      setMatchOptions(options);
    }

    if (gameType === "picture_speak") {
      setSpokenText("");
      setIsListening(false);
    }

    setFeedback(null);
  }, [currentIndex, gameType, words]);

  function checkAnswer(answer: string) {
    const isCorrect =
      answer.toLowerCase().trim() === currentWord.word.toLowerCase();
    setFeedback(isCorrect ? "correct" : "wrong");
    setTotalAttempts((p) => p + 1);

    if (isCorrect) {
      setScore((p) => p + 1);
      speak("Great job!", 1.0);
    } else {
      speak(currentWord.word, 0.7);
    }

    // Save record
    fetch("/api/vocabulary/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordId: currentWord.id,
        isCorrect,
        gameType,
      }),
    }).catch(() => {});

    // Move to next after delay
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex((p) => p + 1);
      } else {
        setShowResult(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      setFeedback(null);
    }, 1500);
  }

  function handleLetterClick(letter: string, index: number) {
    const newSelected = [...selectedLetters, letter];
    setSelectedLetters(newSelected);
    const newPool = [...letterPool];
    newPool.splice(index, 1);
    setLetterPool(newPool);

    if (newSelected.length === currentWord.word.length) {
      checkAnswer(newSelected.join(""));
    }
  }

  function handleRemoveLetter(index: number) {
    const letter = selectedLetters[index];
    const newSelected = [...selectedLetters];
    newSelected.splice(index, 1);
    setSelectedLetters(newSelected);
    setLetterPool([...letterPool, letter]);
  }

  function resetGame() {
    setCurrentIndex(0);
    setScore(0);
    setTotalAttempts(0);
    setShowResult(false);
    setGameType(null);
    setFeedback(null);
    setShowConfetti(false);
  }

  function playWordAudio() {
    if (currentWord) {
      speak(currentWord.word, 0.6);
    }
  }

  // Picture-speak: 使用 Azure Speech Services 錄音 + 發音評估
  const recordingRef = useRef<any>(null);

  async function startListening() {
    setSpokenText("");
    setIsListening(true);

    try {
      const session = await startRecording();
      recordingRef.current = session;

      // 3 秒後自動停止（單字不需要錄太久）
      setTimeout(() => {
        if (recordingRef.current) {
          stopListening();
        }
      }, 3000);
    } catch (err: any) {
      setIsListening(false);
      setSpokenText(err.message || "無法啟動錄音");
    }
  }

  async function stopListening() {
    if (!recordingRef.current) return;

    setIsListening(false);
    setSpokenText("辨識中...");

    try {
      const audioBlob = await recordingRef.current.stop();
      recordingRef.current = null;

      // 使用 Azure Pronunciation Assessment 辨識
      const result = await assessPronunciation(audioBlob, currentWord.word);

      if (result.transcript) {
        const transcript = result.transcript.toLowerCase().replace(/[^a-z\s]/g, "").trim();
        setSpokenText(transcript);

        // 檢查是否匹配（完全一致或包含目標單字）
        const target = currentWord.word.toLowerCase();
        if (transcript === target || transcript.includes(target)) {
          checkAnswer(currentWord.word);
        } else {
          checkAnswer(transcript);
        }
      } else {
        setSpokenText("沒有偵測到語音，請再試一次");
      }
    } catch (err: any) {
      setSpokenText(err.message || "語音辨識失敗，請再試一次");
      recordingRef.current = null;
    }
  }

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <span className="text-4xl animate-emoji-pulse block">✏️</span>
          <p className="text-gray-500 mt-2">載入中...</p>
        </div>
      </StudentLayout>
    );
  }

  // Game selection screen
  if (!gameType) {
    return (
      <StudentLayout>
        <h1 className="text-kid-xl font-black text-gray-800 mb-2">
          ✏️ 單字練習
        </h1>
        <p className="text-kid-sm text-gray-500 mb-6">
          選擇一個遊戲開始練習！（共 {words.length} 個單字）
        </p>

        <div className="space-y-4">
          <button
            onClick={() => setGameType("spelling")}
            className="card-kid w-full text-left flex items-center gap-4 hover:border-primary-300"
          >
            <span className="text-5xl">🔤</span>
            <div>
              <p className="text-kid-lg font-black text-primary-600">
                聽音拼字
              </p>
              <p className="text-sm text-gray-500">
                聽到發音，選出正確的字母拼出單字
              </p>
            </div>
          </button>

          <button
            onClick={() => setGameType("picture_match")}
            className="card-kid w-full text-left flex items-center gap-4 hover:border-success-300"
          >
            <span className="text-5xl">🖼️</span>
            <div>
              <p className="text-kid-lg font-black text-success-600">
                圖片配對
              </p>
              <p className="text-sm text-gray-500">
                看 emoji 圖片，選出正確的英文單字
              </p>
            </div>
          </button>

          <button
            onClick={() => setGameType("picture_speak")}
            className="card-kid w-full text-left flex items-center gap-4 hover:border-accent-300"
          >
            <span className="text-5xl">🎤</span>
            <div>
              <p className="text-kid-lg font-black text-accent-600">
                看圖說英文
              </p>
              <p className="text-sm text-gray-500">
                看到 emoji 圖片，說出對應的英文單字
              </p>
            </div>
          </button>

          <button
            onClick={() => setGameType("drag_letters")}
            className="card-kid w-full text-left flex items-center gap-4 hover:border-yellow-300"
          >
            <span className="text-5xl">🧩</span>
            <div>
              <p className="text-kid-lg font-black text-yellow-600">
                字母排列
              </p>
              <p className="text-sm text-gray-500">
                把打散的字母排列成正確的單字
              </p>
            </div>
          </button>
        </div>
      </StudentLayout>
    );
  }

  // Result screen
  if (showResult) {
    const percentage = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
    return (
      <StudentLayout>
        {showConfetti && <Confetti />}
        <div className="text-center py-8">
          <span className="text-7xl block mb-4 animate-correct">
            {percentage >= 80 ? "🌟" : percentage >= 60 ? "👍" : "💪"}
          </span>
          <h1 className="text-kid-2xl font-black text-gray-800 mb-2">
            練習完成！
          </h1>
          <p className="text-kid-lg text-gray-500 mb-6">
            答對 {score} / {totalAttempts} 題
          </p>

          <div className="card-kid mb-6">
            <div className="text-5xl font-black text-primary-500 mb-2">
              {percentage}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
              <div
                className="bg-gradient-to-r from-primary-400 to-primary-600 h-4 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              {percentage >= 80
                ? "太棒了！你是拼字高手！"
                : percentage >= 60
                ? "不錯喔！繼續加油！"
                : "沒關係，多練習就會進步！"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={resetGame} className="btn-kid-primary">
              🔄 再玩一次
            </button>
            <button
              onClick={() => setGameType(null)}
              className="btn-kid-outline"
            >
              換個遊戲
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Get current word emoji
  const wordEmoji = getWordEmoji(currentWord.word);

  // Active game
  return (
    <StudentLayout>
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setGameType(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        <div className="flex-1 bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary-400 to-success-400 h-3 rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / words.length) * 100}%`,
            }}
          />
        </div>
        <span className="text-sm text-gray-500 font-bold">
          {currentIndex + 1}/{words.length}
        </span>
      </div>

      {/* Feedback overlay */}
      {feedback && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${
            feedback === "correct"
              ? "bg-success-500/10"
              : "bg-red-500/10"
          }`}
        >
          <div className="flex flex-col items-center">
            <span className={`text-8xl ${feedback === "correct" ? "animate-correct" : "animate-shake"}`}>
              {feedback === "correct" ? "✅" : "❌"}
            </span>
            {/* Star burst particles on correct */}
            {feedback === "correct" && (
              <div className="absolute">
                {["⭐", "✨", "🌟", "💫"].map((s, i) => (
                  <span
                    key={i}
                    className="absolute animate-star-burst text-2xl"
                    style={{
                      top: `${-30 + Math.sin(i * 1.57) * 40}px`,
                      left: `${-10 + Math.cos(i * 1.57) * 40}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game content */}
      <div className="card-kid mb-4 text-center">
        {/* Emoji display for the word */}
        {wordEmoji && (
          <div
            className={`text-6xl mb-3 ${feedback === "correct" ? "animate-correct" : feedback === "wrong" ? "animate-shake" : "animate-emoji-pulse"}`}
          >
            {wordEmoji.emoji}
          </div>
        )}

        {gameType === "picture_speak" ? (
          <>
            {/* 看圖說英文模式 */}
            {!wordEmoji && (
              <div className="w-24 h-24 rounded-full bg-accent-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">❓</span>
              </div>
            )}
            <p className="text-kid-lg font-bold text-gray-500 mb-2">
              {currentWord.translation}
            </p>
            <p className="text-sm text-gray-400 mb-6">看圖片，說出英文單字！</p>

            <button
              onClick={isListening ? stopListening : startListening}
              disabled={feedback !== null || spokenText === "辨識中..."}
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${
                isListening
                  ? "bg-red-100 recording-pulse"
                  : spokenText === "辨識中..."
                  ? "bg-gray-100"
                  : "bg-accent-100 hover:bg-accent-200 active:scale-95"
              }`}
            >
              <span className="text-5xl">{isListening ? "⏹" : spokenText === "辨識中..." ? "⏳" : "🎤"}</span>
            </button>
            <p className="text-xs text-gray-400 mb-2">
              {isListening ? "錄音中... 說完後點擊停止（或等 3 秒自動停止）" : spokenText === "辨識中..." ? "Azure 語音辨識中..." : "點擊麥克風開始說話"}
            </p>

            {spokenText && (
              <p className="text-sm text-gray-500 mb-2">
                你說的：<span className="font-bold text-gray-700">{spokenText}</span>
              </p>
            )}

            <p className="text-xs text-gray-400">點擊麥克風開始說話</p>
          </>
        ) : gameType === "picture_match" ? (
          <>
            {/* 圖片配對模式 — 顯示 emoji + 翻譯 */}
            {!wordEmoji && (
              <button
                onClick={playWordAudio}
                className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 hover:bg-primary-200 transition-all active:scale-95"
              >
                <span className="text-4xl">🔊</span>
              </button>
            )}
            <p className="text-kid-xl font-black text-gray-700 mb-2">
              {currentWord.translation}
            </p>
            <p className="text-sm text-gray-400 mb-6">選出正確的英文單字</p>
            <div className="grid grid-cols-2 gap-3">
              {matchOptions.map((option, idx) => {
                const optEmoji = getWordEmoji(option);
                return (
                  <button
                    key={idx}
                    onClick={() => checkAnswer(option)}
                    disabled={feedback !== null}
                    className="btn-kid bg-white border-2 border-gray-200 text-gray-700
                             hover:border-primary-300 hover:bg-primary-50 text-kid-lg
                             flex items-center justify-center gap-2"
                  >
                    {optEmoji && <span>{optEmoji.emoji}</span>}
                    {option}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* 拼字 / 字母排列模式 */}
            <button
              onClick={playWordAudio}
              className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 hover:bg-primary-200 transition-all active:scale-95"
            >
              <span className="text-4xl">🔊</span>
            </button>
            <p className="text-sm text-gray-400 mb-1">聽發音，拼出這個單字</p>
            <p className="text-kid-lg font-bold text-gray-500 mb-4">
              {currentWord.translation}
            </p>

            {/* Selected letters / answer area */}
            <div className="flex justify-center gap-1 mb-6 min-h-[52px]">
              {Array.from({ length: currentWord.word.length }).map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (selectedLetters[idx]) handleRemoveLetter(idx);
                  }}
                  className={`w-11 h-12 rounded-lg border-2 flex items-center justify-center
                    text-kid-lg font-black transition-all cursor-pointer ${
                      selectedLetters[idx]
                        ? "border-primary-400 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-gray-50"
                    }`}
                >
                  {selectedLetters[idx] || ""}
                </div>
              ))}
            </div>

            {/* Letter pool */}
            <div className="flex flex-wrap justify-center gap-2">
              {letterPool.map((letter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLetterClick(letter, idx)}
                  disabled={
                    selectedLetters.length >= currentWord.word.length ||
                    feedback !== null
                  }
                  className="w-11 h-12 rounded-lg bg-white border-2 border-gray-200
                           text-kid-lg font-black text-gray-600
                           hover:border-primary-300 hover:bg-primary-50
                           active:scale-90 transition-all
                           disabled:opacity-30"
                >
                  {letter}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}

const sampleWords: Word[] = [
  { id: "w1", word: "cat", phonetic: "/kæt/", translation: "貓", imageUrl: null },
  { id: "w2", word: "white", phonetic: "/waɪt/", translation: "白色的", imageUrl: null },
  { id: "w3", word: "name", phonetic: "/neɪm/", translation: "名字", imageUrl: null },
  { id: "w4", word: "play", phonetic: "/pleɪ/", translation: "玩", imageUrl: null },
  { id: "w5", word: "fish", phonetic: "/fɪʃ/", translation: "魚", imageUrl: null },
  { id: "w6", word: "friend", phonetic: "/frɛnd/", translation: "朋友", imageUrl: null },
];
