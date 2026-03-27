export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getLevel } from "@/lib/gamification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, streak: true, lastActiveAt: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 更新連續天數
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;

    let streak = user.streak;
    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        streak = 1; // 中斷了
        await prisma.user.update({
          where: { id: userId },
          data: { streak: 1, lastActiveAt: new Date() },
        });
      } else if (diffDays === 1) {
        streak = user.streak + 1;
        await prisma.user.update({
          where: { id: userId },
          data: { streak, lastActiveAt: new Date() },
        });
      }
      // diffDays === 0: 同一天，不更新
    } else {
      streak = 1;
      await prisma.user.update({
        where: { id: userId },
        data: { streak: 1, lastActiveAt: new Date() },
      });
    }

    const levelInfo = getLevel(user.points);

    // 最近獲得的徽章
    const recentAchievements = await prisma.achievement.findMany({
      where: { studentId: userId },
      orderBy: { earnedAt: "desc" },
      take: 5,
    });

    // 練習統計
    const totalPractices = await prisma.practiceRecord.count({
      where: { studentId: userId },
    });

    return NextResponse.json({
      points: user.points,
      streak,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      nextLevelPoints: levelInfo.nextLevelPoints,
      levelProgress: levelInfo.progress,
      totalPractices,
      recentAchievements: recentAchievements.map((a) => ({
        badge: a.badge,
        title: a.title,
        icon: a.icon,
        earnedAt: a.earnedAt,
      })),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
