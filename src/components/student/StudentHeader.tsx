"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function StudentHeader() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-3xl">🐱</span>
          <span className="text-kid-sm font-black text-primary-600 hidden sm:block">
            EnglishBuddy
          </span>
        </Link>

        {/* 積分與用戶 */}
        <div className="flex items-center gap-3">
          {/* 連續天數 */}
          <div className="flex items-center gap-1 bg-accent-50 px-3 py-1 rounded-full">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold text-accent-600">
              {user?.streak || 0}
            </span>
          </div>

          {/* 星星 */}
          <div className="flex items-center gap-1 bg-kid-yellow/10 px-3 py-1 rounded-full">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-bold text-yellow-600">
              {user?.points || 0}
            </span>
          </div>

          {/* 用戶頭像 */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center
                       text-lg hover:bg-primary-200 transition-colors"
            title="登出"
          >
            {user?.avatar || "😊"}
          </button>
        </div>
      </div>
    </header>
  );
}
