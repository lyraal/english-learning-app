"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { href: "/admin", icon: "📊", label: "儀表板", exact: true },
  { href: "/admin/classes", icon: "🏫", label: "班級管理" },
  { href: "/admin/students", icon: "👦", label: "學生管理" },
  { href: "/admin/articles", icon: "📝", label: "教材管理" },
  { href: "/admin/vocabulary", icon: "📚", label: "單字管理" },
  { href: "/admin/assignments", icon: "📋", label: "作業指派" },
  { href: "/admin/reports", icon: "📈", label: "學生報告" },
  { href: "/admin/notify", icon: "🔔", label: "LINE 通知" },
  { href: "/admin/accounts", icon: "👥", label: "帳號管理" },
  { href: "/admin/organizations", icon: "🏢", label: "補習班管理" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (
      status === "authenticated" &&
      (session?.user as any)?.role === "STUDENT"
    ) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (!session || (session.user as any)?.role === "STUDENT") return null;

  return (
    <div className="min-h-screen bg-gray-50 font-admin flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full overflow-y-auto scrollbar-thin">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-2xl">🐱</span>
            <span className="font-bold text-lg text-primary-600">
              EnglishBuddy
            </span>
          </Link>
          <p className="text-xs text-gray-400 mt-1">老師管理後台</p>
        </div>

        {/* Nav Items */}
        <nav className="p-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {session.user?.name}
              </p>
              <p className="text-xs text-gray-400">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
              title="登出"
            >
              登出
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
