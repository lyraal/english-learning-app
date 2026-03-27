import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = (session.user as any).id;
    const studentId = params.id;

    // Verify student is in teacher's class
    const enrollment = await prisma.classStudent.findFirst({
      where: {
        studentId,
        class: { teacherId },
      },
      include: {
        class: { select: { name: true } },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get student info
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        username: true,
        points: true,
        streak: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get all class enrollments
    const enrollments = await prisma.classStudent.findMany({
      where: { studentId },
      include: { class: { select: { name: true } } },
    });
    const classNames = enrollments.map((e) => e.class.name);

    // Get practice records for skill averages
    const allPractices = await prisma.practiceRecord.findMany({
      where: { studentId, score: { not: null } },
      orderBy: { createdAt: "desc" },
    });

    // Reading average
    const readingPractices = allPractices.filter((p) => p.type === "reading");
    const readingAvg = readingPractices.length > 0
      ? Math.round(readingPractices.reduce((s, p) => s + (p.score || 0), 0) / readingPractices.length)
      : 0;

    // Speaking average
    const speakingPractices = allPractices.filter((p) => p.type === "speaking");
    const speakingAvg = speakingPractices.length > 0
      ? Math.round(speakingPractices.reduce((s, p) => s + (p.score || 0), 0) / speakingPractices.length)
      : 0;

    // Vocabulary (spelling) average
    const spellings = await prisma.spellingRecord.findMany({
      where: { studentId },
    });
    const correctSpellings = spellings.filter((s) => s.isCorrect).length;
    const vocabAvg = spellings.length > 0
      ? Math.round((correctSpellings / spellings.length) * 100)
      : 0;

    // Writing average
    const writings = await prisma.writingSubmission.findMany({
      where: { studentId, score: { not: null } },
    });
    const writingAvg = writings.length > 0
      ? Math.round(writings.reduce((s, w) => s + (w.score || 0), 0) / writings.length)
      : 0;

    // Recent 15 practice records
    const recentPractices = await prisma.practiceRecord.findMany({
      where: { studentId },
      include: { article: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    const recentRecords = recentPractices.map((p) => ({
      id: p.id,
      type: p.type,
      score: p.score,
      articleTitle: p.article?.title || null,
      createdAt: p.createdAt.toISOString(),
    }));

    // Speaking history (last 10)
    const speakingHistory = speakingPractices.slice(0, 10).map((p) => ({
      id: p.id,
      score: p.score,
      accuracy: p.accuracy,
      fluency: p.fluency,
      completeness: p.completeness,
      createdAt: p.createdAt.toISOString(),
    }));

    // Achievements / badges
    const achievements = await prisma.achievement.findMany({
      where: { studentId },
      orderBy: { earnedAt: "desc" },
    });

    const badges = achievements.map((a) => ({
      id: a.id,
      badge: a.badge,
      title: a.title,
      icon: a.icon,
      earnedAt: a.earnedAt.toISOString(),
    }));

    // All possible badges for progress tracking
    const allBadges = [
      { badge: "streak_3", title: "連續3天" },
      { badge: "streak_7", title: "連續7天" },
      { badge: "streak_30", title: "連續30天" },
      { badge: "perfect_score", title: "滿分達人" },
      { badge: "spelling_king", title: "拼字王" },
      { badge: "speaking_star", title: "口說之星" },
      { badge: "reading_master", title: "閱讀大師" },
      { badge: "writing_pro", title: "寫作高手" },
      { badge: "first_practice", title: "初次練習" },
      { badge: "practice_50", title: "練習50次" },
      { badge: "practice_100", title: "練習100次" },
    ];

    const badgeProgress = allBadges.map((b) => ({
      ...b,
      earned: badges.some((a) => a.badge === b.badge),
      earnedAt: badges.find((a) => a.badge === b.badge)?.earnedAt || null,
    }));

    return NextResponse.json({
      student: {
        ...student,
        lastActiveAt: student.lastActiveAt?.toISOString() || null,
        createdAt: student.createdAt.toISOString(),
        classNames,
      },
      skills: {
        reading: readingAvg,
        vocabulary: vocabAvg,
        speaking: speakingAvg,
        writing: writingAvg,
      },
      recentRecords,
      speakingHistory,
      badgeProgress,
    });
  } catch (error) {
    console.error("Student detail error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
