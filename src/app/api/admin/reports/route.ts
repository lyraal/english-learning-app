export const dynamic = 'force-dynamic';

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

    // Get all students in teacher's classes
    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: {
        students: {
          include: {
            student: {
              include: {
                practiceRecords: { where: { score: { not: null } } },
                spellingRecords: true,
              },
            },
          },
        },
      },
    });

    const reports = classes.flatMap((cls) =>
      cls.students.map((enrollment) => {
        const student = enrollment.student;
        const practices = student.practiceRecords;
        const spellings = student.spellingRecords;

        const avgScore =
          practices.length > 0
            ? Math.round(
                practices.reduce((s, p) => s + (p.score || 0), 0) /
                  practices.length
              )
            : 0;

        const speakingPractices = practices.filter(
          (p) => p.type === "speaking" && p.score !== null
        );
        const speakingAvg =
          speakingPractices.length > 0
            ? Math.round(
                speakingPractices.reduce((s, p) => s + (p.score || 0), 0) /
                  speakingPractices.length
              )
            : 0;

        const correctSpellings = spellings.filter((s) => s.isCorrect).length;
        const spellingAccuracy =
          spellings.length > 0
            ? Math.round((correctSpellings / spellings.length) * 100)
            : 0;

        return {
          id: student.id,
          name: student.name,
          className: cls.name,
          totalPractices: practices.length,
          avgScore,
          streak: student.streak,
          lastActive: student.lastActiveAt?.toISOString() || null,
          speakingAvg,
          spellingAccuracy,
        };
      })
    );

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
