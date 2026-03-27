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

    // 找到用戶的班級
    const enrollment = await prisma.classStudent.findFirst({
      where: { studentId: userId },
      include: { class: true },
    });

    let students;
    if (enrollment) {
      // 取得班級內所有學生
      const classStudents = await prisma.classStudent.findMany({
        where: { classId: enrollment.classId },
        include: {
          student: {
            select: { id: true, name: true, avatar: true, points: true, streak: true },
          },
        },
      });
      students = classStudents.map((cs) => cs.student);
    } else {
      // 沒有班級，取全部學生（限 20）
      students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true, name: true, avatar: true, points: true, streak: true },
        take: 20,
      });
    }

    // 排行榜排序
    const ranked = students
      .sort((a, b) => b.points - a.points)
      .map((s, i) => ({
        rank: i + 1,
        id: s.id,
        name: s.name,
        avatar: s.avatar || "😊",
        points: s.points,
        streak: s.streak,
        level: getLevel(s.points).level,
        isMe: s.id === userId,
      }));

    return NextResponse.json({
      className: enrollment?.class?.name || "全校",
      leaderboard: ranked,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to get leaderboard" }, { status: 500 });
  }
}
