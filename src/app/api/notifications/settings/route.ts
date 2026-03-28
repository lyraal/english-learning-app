export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface NotificationPrefs {
  dailySummary: boolean;
  badge: boolean;
  streak: boolean;
  assignment: boolean;
  inactive: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  dailySummary: true,
  badge: true,
  streak: true,
  assignment: true,
  inactive: true,
};

// GET: 取得通知偏好設定
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { notificationPrefs: true, lineNotifyToken: true },
    });

    let prefs: NotificationPrefs = { ...DEFAULT_PREFS };
    if (user?.notificationPrefs) {
      try {
        prefs = { ...DEFAULT_PREFS, ...JSON.parse(user.notificationPrefs) };
      } catch {}
    }

    return NextResponse.json({
      connected: !!user?.lineNotifyToken,
      prefs,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT: 更新通知偏好設定
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const prefs: NotificationPrefs = {
      dailySummary: body.dailySummary ?? true,
      badge: body.badge ?? true,
      streak: body.streak ?? true,
      assignment: body.assignment ?? true,
      inactive: body.inactive ?? true,
    };

    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { notificationPrefs: JSON.stringify(prefs) },
    });

    return NextResponse.json({ message: "已更新", prefs });
  } catch (error) {
    return NextResponse.json({ error: "更新失敗" }, { status: 500 });
  }
}
