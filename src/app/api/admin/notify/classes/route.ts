export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: 取得班級和學生列表（含 LINE 綁定狀態）
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || (role !== "TEACHER" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = (session.user as any).id;

    // 老師的班級
    const classes = await prisma.class.findMany({
      where: role === "ADMIN" ? {} : { teacherId },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                childOf: {
                  include: {
                    parent: { select: { lineNotifyToken: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      students: cls.students.map((cs) => ({
        id: cs.student.id,
        name: cs.student.name,
        hasLine: cs.student.childOf.some((pc) => !!pc.parent.lineNotifyToken),
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
