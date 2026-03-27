export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const userId = (session.user as any).id;

    const record = await prisma.practiceRecord.create({
      data: {
        studentId: userId,
        articleId: data.articleId || null,
        type: data.type || "speaking",
        transcript: data.transcript || null,
        score: data.score || null,
        accuracy: data.accuracy || null,
        fluency: data.fluency || null,
        completeness: data.completeness || null,
        wordScores: data.wordScores || null,
        duration: data.duration || null,
      },
    });

    // Award points based on score
    const points = data.score >= 90 ? 20 : data.score >= 70 ? 15 : data.score >= 50 ? 10 : 5;
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: points } },
    });

    // Record point history
    await prisma.pointHistory.create({
      data: {
        studentId: userId,
        amount: points,
        source: "practice",
        detail: `口說練習得 ${data.score} 分`,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
