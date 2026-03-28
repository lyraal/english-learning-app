export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendDailySummary, notifyInactive } from "@/lib/notifications";

// POST: 觸發通知（內部/排程使用）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, studentId } = await req.json();

    switch (type) {
      case "daily_summary":
        await sendDailySummary(studentId);
        break;
      case "inactive":
        await notifyInactive(studentId, 3);
        break;
      default:
        return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }

    return NextResponse.json({ message: "已發送" });
  } catch (error) {
    return NextResponse.json({ error: "發送失敗" }, { status: 500 });
  }
}
