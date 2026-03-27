import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = (session.user as any).id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Total students in teacher's classes
    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: {
        students: { include: { student: true } },
        _count: { select: { students: true, assignments: true } },
      },
    });

    const allStudentIds = new Set<string>();
    classes.forEach((c) =>
      c.students.forEach((s) => allStudentIds.add(s.studentId))
    );
    const studentIdArray = Array.from(allStudentIds);

    // Active today
    const activeToday = await prisma.user.count({
      where: {
        id: { in: studentIdArray },
        lastActiveAt: { gte: today },
      },
    });

    // Weekly active students
    const weeklyActiveStudents = await prisma.user.count({
      where: {
        id: { in: studentIdArray },
        lastActiveAt: { gte: weekAgo },
      },
    });

    // Total articles
    const totalArticles = await prisma.article.count();

    // Average score
    const recentScores = await prisma.practiceRecord.findMany({
      where: {
        studentId: { in: studentIdArray },
        score: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const avgScore =
      recentScores.length > 0
        ? Math.round(
            recentScores.reduce((s, r) => s + (r.score || 0), 0) /
              recentScores.length
          )
        : 0;

    // Pending assignments
    const pendingAssignments = await prisma.assignment.count({
      where: { teacherId, status: "ACTIVE" },
    });

    // Weekly completion rate
    const weeklyAssignments = await prisma.assignment.findMany({
      where: {
        teacherId,
        status: "ACTIVE",
        createdAt: { gte: weekAgo },
      },
      include: {
        _count: { select: { submissions: true } },
        submissions: { where: { status: "completed" } },
      },
    });

    let totalSubmissions = 0;
    let completedSubmissions = 0;
    for (const a of weeklyAssignments) {
      totalSubmissions += a._count.submissions;
      completedSubmissions += a.submissions.length;
    }
    const weeklyCompletionRate = totalSubmissions > 0
      ? Math.round((completedSubmissions / totalSubmissions) * 100)
      : 0;

    // Students needing attention
    const attentionNeeded: Array<{
      id: string;
      name: string;
      reason: string;
      detail: string;
      lastActiveAt: string | null;
    }> = [];

    // 1. Students inactive > 3 days
    const inactiveStudents = await prisma.user.findMany({
      where: {
        id: { in: studentIdArray },
        OR: [
          { lastActiveAt: { lt: threeDaysAgo } },
          { lastActiveAt: null },
        ],
      },
      select: { id: true, name: true, lastActiveAt: true },
    });

    for (const s of inactiveStudents) {
      attentionNeeded.push({
        id: s.id,
        name: s.name,
        reason: s.lastActiveAt ? "超過 3 天未登入" : "從未登入",
        detail: s.lastActiveAt
          ? `上次登入：${formatTimeAgo(s.lastActiveAt)}`
          : "尚未登入過",
        lastActiveAt: s.lastActiveAt?.toISOString() || null,
      });
    }

    // 2. Students with declining scores (recent 5 vs previous 5)
    for (const sid of studentIdArray) {
      if (attentionNeeded.find((a) => a.id === sid)) continue; // already flagged

      const recentPractices = await prisma.practiceRecord.findMany({
        where: { studentId: sid, score: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { score: true },
      });

      if (recentPractices.length >= 10) {
        const recent5 = recentPractices.slice(0, 5);
        const prev5 = recentPractices.slice(5, 10);
        const recentAvg = recent5.reduce((s, r) => s + (r.score || 0), 0) / 5;
        const prevAvg = prev5.reduce((s, r) => s + (r.score || 0), 0) / 5;

        if (prevAvg - recentAvg >= 15) {
          const student = await prisma.user.findUnique({
            where: { id: sid },
            select: { name: true, lastActiveAt: true },
          });
          if (student) {
            attentionNeeded.push({
              id: sid,
              name: student.name,
              reason: "最近分數下降",
              detail: `平均分從 ${Math.round(prevAvg)} 降至 ${Math.round(recentAvg)}`,
              lastActiveAt: student.lastActiveAt?.toISOString() || null,
            });
          }
        }
      }
    }

    // Class stats
    const classStats = await Promise.all(
      classes.map(async (c) => {
        const studentIds = c.students.map((s) => s.studentId);
        const classScores = await prisma.practiceRecord.findMany({
          where: { studentId: { in: studentIds }, score: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        const classAvg =
          classScores.length > 0
            ? Math.round(
                classScores.reduce((s, r) => s + (r.score || 0), 0) /
                  classScores.length
              )
            : 0;

        const activeStudents = await prisma.user.count({
          where: { id: { in: studentIds }, lastActiveAt: { gte: weekAgo } },
        });

        return {
          id: c.id,
          name: c.name,
          studentCount: c._count.students,
          avgScore: classAvg,
          activeRate:
            studentIds.length > 0
              ? Math.round((activeStudents / studentIds.length) * 100)
              : 0,
        };
      })
    );

    // Recent 5 practice records
    const recentRecords = await prisma.practiceRecord.findMany({
      where: { studentId: { in: studentIdArray } },
      include: {
        student: { select: { id: true, name: true } },
        article: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentPractices = recentRecords.map((r) => ({
      id: r.id,
      studentName: r.student.name,
      studentId: r.student.id,
      type: r.type,
      score: r.score,
      articleTitle: r.article?.title || null,
      createdAt: r.createdAt.toISOString(),
    }));

    // Recent activity (for backward compat)
    const recentActivity = recentRecords.map((r) => ({
      id: r.id,
      studentName: r.student.name,
      action: `完成${r.type === "speaking" ? "口說" : r.type === "reading" ? "閱讀" : r.type === "writing" ? "寫作" : "單字"}練習`,
      detail: r.article?.title || "",
      time: formatTimeAgo(r.createdAt),
    }));

    return NextResponse.json({
      totalStudents: allStudentIds.size,
      activeToday,
      totalClasses: classes.length,
      totalArticles,
      avgScore,
      pendingAssignments,
      weeklyActiveStudents,
      weeklyCompletionRate,
      attentionNeeded: attentionNeeded.slice(0, 10),
      recentPractices,
      classStats,
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours} 小時前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}
