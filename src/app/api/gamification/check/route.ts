export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/gamification";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const newlyEarned: string[] = [];

    // 取得用戶已有的徽章
    const existing = await prisma.achievement.findMany({
      where: { studentId: userId },
    });
    const earnedBadges = new Set(existing.map((a) => a.badge));

    // 取得用戶資料
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 取得練習紀錄
    const practices = await prisma.practiceRecord.findMany({
      where: { studentId: userId },
    });

    const speakingPractices = practices.filter((p) => p.type === "speaking");
    const readingPractices = practices.filter((p) => p.type === "reading");
    const vocabPractices = practices.filter((p) => p.type === "vocabulary");
    const writingPractices = practices.filter((p) => p.type === "writing");

    // 寫作提交數
    const writingCount = await prisma.writingSubmission.count({
      where: { studentId: userId },
    });

    // 檢查每個徽章
    const checks: Record<string, boolean> = {
      // 1. 初學者 — 完成第一次口說練習
      first_speaking: speakingPractices.length >= 1,
      // 2. 書蟲 — 閱讀 5 篇文章
      reader_5: readingPractices.length >= 5,
      // 3. 單字達人 — 單字練習正確率超過 80%
      vocab_80: (() => {
        const spellingRecords = practices.filter((p) => p.type === "vocabulary");
        if (spellingRecords.length < 3) return false;
        const avgScore = spellingRecords.reduce((sum, p) => sum + (p.score || 0), 0) / spellingRecords.length;
        return avgScore >= 80;
      })(),
      // 4. 小小演說家 — 口說練習得分超過 80
      speaker_80: speakingPractices.some((p) => (p.score || 0) >= 80),
      // 5. 連續 3 天
      streak_3: user.streak >= 3,
      // 6. 連續 7 天
      streak_7: user.streak >= 7,
      // 7. 小作家 — 完成 3 次寫作練習
      writer_3: writingCount >= 3,
      // 8. 滿分王 — 口說練習得到 95 分以上
      perfect_95: speakingPractices.some((p) => (p.score || 0) >= 95),
      // 9. 全能學霸 — 每種練習各完成 10 次
      all_rounder:
        speakingPractices.length >= 10 &&
        readingPractices.length >= 10 &&
        vocabPractices.length >= 10 &&
        writingCount >= 10,
      // 10. 英文小達人 — 累積 500 積分
      point_500: user.points >= 500,
    };

    // 授予新徽章
    for (const [badge, achieved] of Object.entries(checks)) {
      if (achieved && !earnedBadges.has(badge)) {
        const def = ACHIEVEMENTS.find((a) => a.badge === badge);
        if (!def) continue;

        await prisma.achievement.create({
          data: {
            studentId: userId,
            badge: def.badge,
            title: def.title,
            icon: def.icon,
          },
        });

        // 獎勵積分
        await prisma.user.update({
          where: { id: userId },
          data: { points: { increment: def.points } },
        });

        await prisma.pointHistory.create({
          data: {
            studentId: userId,
            amount: def.points,
            source: "achievement",
            detail: `獲得徽章「${def.title}」`,
          },
        });

        newlyEarned.push(badge);
      }
    }

    return NextResponse.json({ newlyEarned });
  } catch (error) {
    console.error("Check achievements error:", error);
    return NextResponse.json({ error: "Failed to check achievements" }, { status: 500 });
  }
}
