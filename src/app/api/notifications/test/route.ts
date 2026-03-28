export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendTestNotification } from "@/lib/notifications";

// POST: 發送測試通知
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { lineNotifyToken: true, name: true },
    });

    if (!user?.lineNotifyToken) {
      return NextResponse.json({ error: "尚未綁定 LINE Notify" }, { status: 400 });
    }

    const ok = await sendTestNotification(user.lineNotifyToken, user.name);
    if (!ok) {
      return NextResponse.json({ error: "發送失敗，Token 可能已失效" }, { status: 500 });
    }

    return NextResponse.json({ message: "測試通知已發送" });
  } catch (error) {
    return NextResponse.json({ error: "發送失敗" }, { status: 500 });
  }
}
