import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export const dynamic = "force-dynamic";

// PATCH: 重設密碼 / 停用啟用帳號
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { action } = body;

    // 確認目標帳號存在
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "找不到該帳號" }, { status: 404 });
    }

    // 老師不能操作 ADMIN 帳號
    if (userRole === "TEACHER" && targetUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "老師無法操作管理員帳號" },
        { status: 403 }
      );
    }

    // 不能操作自己的帳號（停用/重設密碼應走 change-password）
    const currentUserId = (session.user as any).id;
    if (id === currentUserId && action === "toggle-status") {
      return NextResponse.json(
        { error: "無法停用自己的帳號" },
        { status: 400 }
      );
    }

    if (action === "update-profile") {
      const { name, username } = body;
      const updateData: any = {};

      if (name && name.trim()) {
        updateData.name = name.trim();
      }

      if (username !== undefined) {
        const trimmed = username?.trim();
        if (trimmed) {
          // 檢查 username 是否已被其他人使用
          const existing = await prisma.user.findFirst({
            where: { username: trimmed, id: { not: id } },
          });
          if (existing) {
            return NextResponse.json({ error: "此帳號名稱已被使用" }, { status: 409 });
          }
          updateData.username = trimmed;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: "請提供要修改的欄位" }, { status: 400 });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, username: true },
      });

      return NextResponse.json({ message: "已更新", user: updated });
    }

    if (action === "reset-password") {
      const { newPassword } = body;
      if (!newPassword || newPassword.length < 4) {
        return NextResponse.json(
          { error: "新密碼至少需要 4 個字元" },
          { status: 400 }
        );
      }

      const hashedPassword = await hash(newPassword, 12);
      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ message: `已重設 ${targetUser.name} 的密碼` });
    }

    if (action === "toggle-status") {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { isActive: true },
      });

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: !user?.isActive },
        select: { id: true, name: true, isActive: true },
      });

      return NextResponse.json({
        message: `已${updatedUser.isActive ? "啟用" : "停用"} ${updatedUser.name} 的帳號`,
        isActive: updatedUser.isActive,
      });
    }

    return NextResponse.json({ error: "不支援的操作" }, { status: 400 });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json({ error: "操作失敗" }, { status: 500 });
  }
}
