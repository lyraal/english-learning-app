"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "首頁" },
  { href: "/articles", icon: "📖", label: "閱讀" },
  { href: "/vocabulary", icon: "✏️", label: "單字" },
  { href: "/speaking", icon: "🎤", label: "口說" },
  { href: "/writing", icon: "✍️", label: "寫作" },
  { href: "/achievements", icon: "🏆", label: "成就" },
];

export default function StudentNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 z-50 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto px-1 py-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-1.5 px-2 rounded-xl transition-all",
                isActive
                  ? "text-primary-600 scale-110"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span
                className={cn(
                  "text-[10px] font-bold",
                  isActive ? "text-primary-600" : "text-gray-400"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary-500 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
