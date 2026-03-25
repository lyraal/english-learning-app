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

    // Active today
    const activeToday = await prisma.user.count({
      where: {
        id: { in: Array.from(allStudentIds) },
        lastActiveAt: { gte: today },
      },
    });

    // Total articles
    const totalArticles = await prisma.article.count();

    // Average score
    const recentScores = await prisma.practiceRecord.findMany({
      where: {
        studentId: { in: Array.from(allStudentIds) },
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
          where: { id: { in: studentIds }, lastActiveAt: { gte: today } },
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

    // Recent activity
    const recentRecords = await prisma.practiceRecord.findMany({
      where: { studentId: { in: Array.from(allStudentIds) } },
      include: { student: { select: { name: true } }, article: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const recentActivity = recentRecords.map((r) => ({
      id: r.id,
      studentName: r.student.name,
      action: `完成${r.type === "speaking" ? "口說" : r.type === "reading" ? "閱讀" : "單字"}練習`,
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
      classStats,
      recentActivity,
    });
  } catch (error) {
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
