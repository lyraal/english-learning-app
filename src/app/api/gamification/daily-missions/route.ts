import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateDailyMissions } from "@/lib/gamification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 檢查今天是否已有任務
    let missions = await prisma.dailyMission.findMany({
      where: { userId, date: today },
      orderBy: { createdAt: "asc" },
    });

    // 如果沒有，生成新任務
    if (missions.length === 0) {
      const templates = generateDailyMissions();
      for (const t of templates) {
        await prisma.dailyMission.create({
          data: {
            userId,
            date: today,
            missionType: t.missionType,
            description: t.description,
            points: t.points,
            completed: false,
          },
        });
      }
      missions = await prisma.dailyMission.findMany({
        where: { userId, date: today },
        orderBy: { createdAt: "asc" },
      });
    }

    // 自動檢測任務完成情況（根據今天的練習記錄）
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayPractices = await prisma.practiceRecord.findMany({
      where: {
        studentId: userId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    });

    const todayWritings = await prisma.writingSubmission.count({
      where: {
        studentId: userId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    });

    for (const mission of missions) {
      if (mission.completed) continue;

      let completed = false;
      switch (mission.missionType) {
        case "read_article":
          completed = todayPractices.some((p) => p.type === "reading");
          break;
        case "vocabulary_10":
          completed = todayPractices.some((p) => p.type === "vocabulary");
          break;
        case "speaking_1":
          completed = todayPractices.some((p) => p.type === "speaking");
          break;
        case "writing_1":
          completed = todayWritings >= 1;
          break;
      }

      if (completed && !mission.completed) {
        await prisma.dailyMission.update({
          where: { id: mission.id },
          data: { completed: true },
        });

        // 額外積分
        await prisma.user.update({
          where: { id: userId },
          data: { points: { increment: mission.points } },
        });

        await prisma.pointHistory.create({
          data: {
            studentId: userId,
            amount: mission.points,
            source: "mission",
            detail: `完成每日任務：${mission.description}`,
          },
        });

        mission.completed = true;
      }
    }

    return NextResponse.json({
      missions: missions.map((m) => ({
        id: m.id,
        missionType: m.missionType,
        description: m.description,
        completed: m.completed,
        points: m.points,
      })),
    });
  } catch (error) {
    console.error("Daily missions error:", error);
    return NextResponse.json({ error: "Failed to get daily missions" }, { status: 500 });
  }
}
