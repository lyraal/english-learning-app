import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    // Total practices
    const practices = await prisma.practiceRecord.findMany({
      where: { studentId: userId },
      include: { article: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Unique study days
    const studyDays = new Set(
      practices.map((p) => p.createdAt.toISOString().split("T")[0])
    ).size;

    // Average score
    const scoredPractices = practices.filter((p) => p.score !== null);
    const avgScore =
      scoredPractices.length > 0
        ? Math.round(
            scoredPractices.reduce((s, p) => s + (p.score || 0), 0) /
              scoredPractices.length
          )
        : 0;

    // Articles read (unique)
    const articlesRead = new Set(
      practices.filter((p) => p.articleId).map((p) => p.articleId)
    ).size;

    // Words learned
    const spellingRecords = await prisma.spellingRecord.findMany({
      where: { studentId: userId, isCorrect: true },
    });
    const wordsLearned = new Set(spellingRecords.map((r) => r.wordId)).size;

    // User data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, streak: true },
    });

    // Achievements
    const achievements = await prisma.achievement.findMany({
      where: { studentId: userId },
      orderBy: { earnedAt: "desc" },
    });

    // Weekly scores (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyPractices = practices.filter(
      (p) => p.createdAt >= weekAgo && p.score !== null
    );
    const weeklyScores: { date: string; score: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayPractices = weeklyPractices.filter(
        (p) => p.createdAt.toISOString().split("T")[0] === dateStr
      );
      const dayAvg =
        dayPractices.length > 0
          ? Math.round(
              dayPractices.reduce((s, p) => s + (p.score || 0), 0) /
                dayPractices.length
            )
          : 0;
      weeklyScores.push({
        date: ["日", "一", "二", "三", "四", "五", "六"][d.getDay()],
        score: dayAvg,
      });
    }

    return NextResponse.json({
      totalPractices: practices.length,
      totalStudyDays: studyDays,
      avgScore,
      articlesRead,
      wordsLearned,
      streak: user?.streak || 0,
      points: user?.points || 0,
      recentRecords: practices.slice(0, 10),
      achievements,
      weeklyScores,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
