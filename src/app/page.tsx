"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        login,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        // Fetch session to determine role
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        if (session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN") {
          router.push("/admin");
        } else if (session?.user?.role === "PARENT") {
          router.push("/parent");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("登入失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-100 via-white to-accent-50 flex flex-col items-center justify-center p-4">
      {/* 吉祥物區域 */}
      <div className="mb-6 text-center">
        <div className="text-8xl mb-2">🐱</div>
        <h1 className="text-kid-2xl font-black text-primary-600">
          EnglishBuddy
        </h1>
        <p className="text-kid-base text-gray-500 mt-1">英文聽說小幫手</p>
      </div>

      {/* 登入表單 */}
      <div className="card-kid w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-kid-sm font-bold text-gray-700 mb-2">
              👤 帳號
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-4 py-3 text-kid-base border-2 border-gray-200 rounded-kid
                         focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              placeholder="輸入帳號或 Email"
              required
            />
          </div>

          <div>
            <label className="block text-kid-sm font-bold text-gray-700 mb-2">
              🔒 密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-kid-base border-2 border-gray-200 rounded-kid
                         focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              placeholder="輸入密碼"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-kid p-3 text-red-600 text-kid-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-kid-primary w-full text-kid-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> 登入中...
              </span>
            ) : (
              "開始學習！🚀"
            )}
          </button>
        </form>

        {/* 測試帳號提示 */}
        <div className="mt-6 pt-4 border-t-2 border-gray-100">
          <p className="text-sm text-gray-400 text-center mb-3">測試帳號</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="font-bold">學生</div>
              <div>student1 / 123456</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="font-bold">老師</div>
              <div>teacher@test.com / 123456</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="font-bold">家長</div>
              <div>parent1 / 123456</div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-400">
        EnglishBuddy &copy; 2026 — 讓英文學習更有趣
      </p>
    </div>
  );
}
