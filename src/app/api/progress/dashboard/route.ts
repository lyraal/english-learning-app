export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;

    // Get student's assignments
    const enrollments = await prisma.classStudent.findMany({
      where: { studentId: userId },
      select: { classId: true },
    });
    const classIds = enrollments.map((e) => e.classId);

    const assignments = await prisma.assignment.findMany({
      where: { classId: { in: classIds }, status: "ACTIVE" },
      include: {
        article: { select: { title: true } },
        submissions: { where: { studentId: userId } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    const todayTasks = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      dueDate: a.dueDate
        ? new Date(a.dueDate).toLocaleDateString("zh-TW")
        : "無期限",
      completed: a.submissions.some((s) => s.status === "completed"),
    }));

    // Weekly progress
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekPractices = await prisma.practiceRecord.findMany({
      where: { studentId: userId, createdAt: { gte: weekAgo } },
    });

    const practiceDays = new Set(
      weekPractices.map((p) => p.createdAt.toISOString().split("T")[0])
    ).size;
    const scored = weekPractices.filter((p) => p.score !== null);
    const avgScore =
      scored.length > 0
        ? Math.round(scored.reduce((s, p) => s + (p.score || 0), 0) / scored.length)
        : 0;

    // Recent articles
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, level: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      todayTasks,
      weeklyProgress: {
        practiceDays,
        totalPractices: weekPractices.length,
        avgScore,
      },
      recentArticles: articles,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
