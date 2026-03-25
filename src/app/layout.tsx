import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/lib/auth-provider";

export const metadata: Metadata = {
  title: "EnglishBuddy - 英文聽說小幫手",
  description: "國小學生英文聽說線上學習系統，AI 幫你練口語！",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
