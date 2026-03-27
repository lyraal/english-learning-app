export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const { missionId } = await req.json();

    if (!missionId) {
      return NextResponse.json({ error: "Mission ID required" }, { status: 400 });
    }

    const mission = await prisma.dailyMission.findFirst({
      where: { id: missionId, userId },
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    if (mission.completed) {
      return NextResponse.json({ error: "Mission already completed" }, { status: 400 });
    }

    // 標記完成
    await prisma.dailyMission.update({
      where: { id: missionId },
      data: { completed: true },
    });

    // 獎勵積分
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

    return NextResponse.json({ success: true, points: mission.points });
  } catch (error) {
    console.error("Complete mission error:", error);
    return NextResponse.json({ error: "Failed to complete mission" }, { status: 500 });
  }
}
