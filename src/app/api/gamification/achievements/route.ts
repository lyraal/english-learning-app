import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/gamification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    // 取得用戶已獲得的徽章
    const earned = await prisma.achievement.findMany({
      where: { studentId: userId },
    });
    const earnedBadges = new Set(earned.map((a) => a.badge));

    // 組合完整列表
    const allAchievements = ACHIEVEMENTS.map((def) => {
      const userAchievement = earned.find((a) => a.badge === def.badge);
      return {
        badge: def.badge,
        title: def.title,
        icon: def.icon,
        description: def.description,
        points: def.points,
        earned: earnedBadges.has(def.badge),
        earnedAt: userAchievement?.earnedAt || null,
      };
    });

    return NextResponse.json({
      achievements: allAchievements,
      earnedCount: earnedBadges.size,
      totalCount: ACHIEVEMENTS.length,
    });
  } catch (error) {
    console.error("Achievements error:", error);
    return NextResponse.json({ error: "Failed to get achievements" }, { status: 500 });
  }
}
