export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notifyAsync, notifyAssignmentCompleted } from "@/lib/notifications";

// POST: 學生完成作業
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const { assignmentId, score } = await req.json();

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
    }

    // 找到這個學生的作業提交記錄
    const submission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: userId,
        },
      },
      include: {
        assignment: { select: { title: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (submission.status === "completed") {
      return NextResponse.json({ error: "Already completed" }, { status: 400 });
    }

    // 更新為完成
    await prisma.assignmentSubmission.update({
      where: { id: submission.id },
      data: {
        status: "completed",
        score: score ?? null,
        completedAt: new Date(),
      },
    });

    // Fire-and-forget: 通知家長
    notifyAsync(() =>
      notifyAssignmentCompleted(userId, submission.assignment.title, score)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complete assignment error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
