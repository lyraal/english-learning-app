export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET: 取得學生綁定的家長
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = params.id;
    const parentLinks = await prisma.parentChild.findMany({
      where: { childId: studentId },
      include: { parent: { select: { id: true, name: true, username: true } } },
    });

    return NextResponse.json({ parents: parentLinks });
  } catch (error) {
    console.error("Get parents error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST: 綁定家長（搜尋現有或建立新帳號）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = params.id;
    const data = await req.json();

    let parentId: string;

    if (data.parentUsername) {
      // 搜尋現有家長帳號
      const parent = await prisma.user.findUnique({
        where: { username: data.parentUsername },
      });
      if (!parent) {
        return NextResponse.json({ error: "找不到此帳號" }, { status: 404 });
      }
      if (parent.role !== "PARENT") {
        return NextResponse.json({ error: "此帳號不是家長角色" }, { status: 400 });
      }
      parentId = parent.id;
    } else if (data.newParentName && data.newParentPassword) {
      // 建立新家長帳號
      const username = `parent_${Date.now()}`;
      const hashedPw = await bcrypt.hash(data.newParentPassword, 10);
      const newParent = await prisma.user.create({
        data: {
          username,
          name: data.newParentName,
          password: hashedPw,
          role: "PARENT",
        },
      });
      parentId = newParent.id;
    } else {
      return NextResponse.json({ error: "請提供家長帳號或新建家長資料" }, { status: 400 });
    }

    // 檢查是否已綁定
    const existing = await prisma.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId: studentId } },
    });
    if (existing) {
      return NextResponse.json({ error: "此家長已綁定此學生" }, { status: 409 });
    }

    // 建立關聯
    const link = await prisma.parentChild.create({
      data: { parentId, childId: studentId },
      include: { parent: { select: { id: true, name: true, username: true } } },
    });

    return NextResponse.json({ message: "綁定成功", link }, { status: 201 });
  } catch (error) {
    console.error("Bind parent error:", error);
    return NextResponse.json({ error: "綁定失敗" }, { status: 500 });
  }
}

// DELETE: 解除家長綁定
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { parentChildId } = data;

    if (!parentChildId) {
      return NextResponse.json({ error: "Missing parentChildId" }, { status: 400 });
    }

    // 確認該綁定關係屬於此學生
    const link = await prisma.parentChild.findFirst({
      where: { id: parentChildId, childId: params.id },
    });
    if (!link) {
      return NextResponse.json({ error: "找不到此綁定關係" }, { status: 404 });
    }

    await prisma.parentChild.delete({ where: { id: parentChildId } });

    return NextResponse.json({ message: "解除綁定成功" });
  } catch (error) {
    console.error("Unbind parent error:", error);
    return NextResponse.json({ error: "解除綁定失敗" }, { status: 500 });
  }
}
