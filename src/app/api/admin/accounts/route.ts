import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export const dynamic = "force-dynamic";

// GET: 列出帳號（支援角色篩選和搜尋）
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const where: any = {};

    // 角色篩選
    if (role) {
      where.role = role;
    }

    // 搜尋（姓名或 username）
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // 老師只能看到自己班級的學生，除非是 ADMIN
    if (userRole === "TEACHER") {
      const userId = (session.user as any).id;
      const teacherClasses = await prisma.class.findMany({
        where: { teacherId: userId },
        select: { id: true },
      });
      const classIds = teacherClasses.map((c) => c.id);

      // 獲取班級裡的學生 ID
      const classStudents = await prisma.classStudent.findMany({
        where: { classId: { in: classIds } },
        select: { studentId: true },
      });
      const studentIds = classStudents.map((cs) => cs.studentId);

      // 老師可以看到自己班級的學生和家長（通過 parentChild 關聯）
      const parentChildren = await prisma.parentChild.findMany({
        where: { childId: { in: studentIds } },
        select: { parentId: true },
      });
      const parentIds = parentChildren.map((pc) => pc.parentId);

      // 允許看到的用戶：自己班級的學生 + 對應的家長 + 自己
      const idSet = new Set([...studentIds, ...parentIds, userId]);
      const allowedIds = Array.from(idSet);
      where.id = { in: allowedIds };
    }

    const accounts = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastActiveAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("List accounts error:", error);
    return NextResponse.json({ error: "取得帳號列表失敗" }, { status: 500 });
  }
}

// POST: 新增帳號
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "TEACHER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const { name, username, email, password, role } = await req.json();

    if (!name || !password || !role) {
      return NextResponse.json(
        { error: "請填寫姓名、密碼和角色" },
        { status: 400 }
      );
    }

    if (!username && !email) {
      return NextResponse.json(
        { error: "請至少填寫帳號或 Email" },
        { status: 400 }
      );
    }

    // 老師不能建立 ADMIN 帳號
    if (userRole === "TEACHER" && role === "ADMIN") {
      return NextResponse.json(
        { error: "老師無法建立管理員帳號" },
        { status: 403 }
      );
    }

    // 檢查帳號是否已存在
    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername) {
        return NextResponse.json(
          { error: "此帳號已被使用" },
          { status: 400 }
        );
      }
    }
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "此 Email 已被使用" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        username: username || undefined,
        email: email || undefined,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Create account error:", error);
    return NextResponse.json({ error: "新增帳號失敗" }, { status: 500 });
  }
}
