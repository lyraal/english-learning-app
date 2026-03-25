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

    const record = await prisma.spellingRecord.create({
      data: {
        studentId: userId,
        wordId: data.wordId,
        isCorrect: data.isCorrect,
      },
    });

    // Award points
    if (data.isCorrect) {
      await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: 5 } },
      });
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
