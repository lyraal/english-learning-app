"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
    if (status === "authenticated" && (session?.user as any)?.role !== "PARENT") {
      router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-lg">載入中...</div>
      </div>
    );
  }

  if (status !== "authenticated") return null;

  const navItems = [
    { label: "首頁", icon: "🏠", path: "/parent" },
    { label: "孩子", icon: "👶", path: "/parent" },
    { label: "通知", icon: "🔔", path: "/parent/notifications" },
    { label: "設定", icon: "⚙️", path: "/parent/settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="text-xl">👨‍👩‍👧‍👦</span>
          <h1 className="text-lg font-semibold text-slate-800">家長中心</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{session.user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            登出
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`flex-1 flex flex-col items-center py-2.5 transition-colors ${
                  isActive
                    ? "text-emerald-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-0.5 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
