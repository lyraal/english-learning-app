import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const childId = params.id;

  if (role !== "PARENT") {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  // Verify parent-child relationship
  const relation = await prisma.parentChild.findUnique({
    where: {
      parentId_childId: { parentId: userId, childId },
    },
  });

  if (!relation) {
    return NextResponse.json({ error: "此孩子不在您的帳號下" }, { status: 403 });
  }

  // Get child basic info
  const child = await prisma.user.findUnique({
    where: { id: childId },
    select: { name: true, avatar: true, points: true, streak: true },
  });

  if (!child) {
    return NextResponse.json({ error: "找不到使用者" }, { status: 404 });
  }

  // Weekly date range
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  // Weekly practice records
  const weeklyRecords = await prisma.practiceRecord.findMany({
    where: { studentId: childId, createdAt: { gte: weekStart } },
  });

  const practiceCount = weeklyRecords.length;
  const averageScore =
    practiceCount > 0
      ? weeklyRecords.reduce((sum, r) => sum + (r.score || 0), 0) / practiceCount
      : 0;

  // Assignments completed this week
  const assignmentsCompleted = await prisma.assignmentSubmission.count({
    where: {
      studentId: childId,
      status: "completed",
      completedAt: { gte: weekStart },
    },
  });

  // Skill scores - average of recent 10 per type
  const skillTypes = ["reading", "vocabulary", "speaking", "writing"] as const;
  const skillScores: Record<string, number> = {};

  for (const type of skillTypes) {
    const records = await prisma.practiceRecord.findMany({
      where: { studentId: childId, type },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { score: true },
    });
    const scored = records.filter((r) => r.score != null);
    skillScores[type] =
      scored.length > 0
        ? scored.reduce((sum, r) => sum + (r.score || 0), 0) / scored.length
        : 0;
  }

  // Recent 10 records
  const recentRecords = await prisma.practiceRecord.findMany({
    where: { studentId: childId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { article: { select: { titleZh: true } } },
  });

  // Badges
  const achievements = await prisma.achievement.findMany({
    where: { studentId: childId },
    orderBy: { earnedAt: "desc" },
  });

  // Total possible badges (hardcoded common set)
  const totalBadges = 10;

  return NextResponse.json({
    child,
    weeklySummary: {
      practiceCount,
      averageScore,
      assignmentsCompleted,
    },
    skillScores,
    recentRecords: recentRecords.map((r) => ({
      id: r.id,
      type: r.type,
      score: r.score,
      createdAt: r.createdAt,
      articleTitle: r.article?.titleZh || null,
    })),
    badges: {
      total: totalBadges,
      unlocked: achievements.length,
      list: achievements.map((a) => ({
        badge: a.badge,
        title: a.title,
        icon: a.icon,
        earnedAt: a.earnedAt,
      })),
    },
  });
}
