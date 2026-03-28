import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash, compare } from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "請填寫舊密碼和新密碼" },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: "新密碼至少需要 4 個字元" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "找不到用戶" }, { status: 404 });
    }

    // 驗證舊密碼
    const isValid = await compare(oldPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "舊密碼錯誤" }, { status: 400 });
    }

    // 更新密碼
    const hashedPassword = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "密碼已更新" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "更新密碼失敗" }, { status: 500 });
  }
}
