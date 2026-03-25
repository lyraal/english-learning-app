"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import StudentHeader from "./StudentHeader";
import StudentNav from "./StudentNav";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white">
        <div className="text-center">
          <div className="text-6xl animate-bounce-slow mb-4">🐱</div>
          <p className="text-kid-base text-gray-500">載入中...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/50 to-white">
      <StudentHeader />
      <main className="max-w-lg mx-auto px-4 pt-4 pb-24">{children}</main>
      <StudentNav />
    </div>
  );
}
