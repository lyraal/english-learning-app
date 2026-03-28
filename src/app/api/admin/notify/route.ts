export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendCustomMessage } from "@/lib/notifications";

// POST: 老師手動發送通知給家長
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentIds, message } = await req.json();

    if (!studentIds?.length || !message?.trim()) {
      return NextResponse.json({ error: "請選擇學生並輸入訊息" }, { status: 400 });
    }

    const sent = await sendCustomMessage(studentIds, message);

    return NextResponse.json({ message: `已發送 ${sent} 則通知`, sent });
  } catch (error) {
    return NextResponse.json({ error: "發送失敗" }, { status: 500 });
  }
}
