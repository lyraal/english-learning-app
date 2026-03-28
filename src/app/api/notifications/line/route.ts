export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: 取得 LINE 通知狀態
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { lineNotifyToken: true },
    });

    return NextResponse.json({
      connected: !!user?.lineNotifyToken,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST: 產生 LINE 綁定碼
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();

    if (data.action === "generate-code") {
      // 產生 6 位數綁定碼
      const code = String(Math.floor(100000 + Math.random() * 900000));

      await prisma.user.update({
        where: { id: (session.user as any).id },
        data: { lineBindingCode: code },
      });

      // 10 分鐘後自動清除（非阻塞）
      setTimeout(async () => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: (session.user as any).id },
            select: { lineBindingCode: true },
          });
          if (user?.lineBindingCode === code) {
            await prisma.user.update({
              where: { id: (session.user as any).id },
              data: { lineBindingCode: null },
            });
          }
        } catch {}
      }, 10 * 60 * 1000);

      return NextResponse.json({ code });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "操作失敗" }, { status: 500 });
  }
}

// DELETE: 解除 LINE 綁定
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { lineNotifyToken: null, lineBindingCode: null },
    });

    return NextResponse.json({ message: "已解除綁定" });
  } catch (error) {
    return NextResponse.json({ error: "解除失敗" }, { status: 500 });
  }
}
