export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role === "STUDENT") {
      // Get assignments for student's classes
      const enrollments = await prisma.classStudent.findMany({
        where: { studentId: userId },
        select: { classId: true },
      });
      const classIds = enrollments.map((e) => e.classId);

      const assignments = await prisma.assignment.findMany({
        where: { classId: { in: classIds }, status: "ACTIVE" },
        include: {
          class: { select: { name: true } },
          article: { select: { title: true } },
          submissions: { where: { studentId: userId } },
        },
        orderBy: { dueDate: "asc" },
      });
      return NextResponse.json(assignments);
    } else {
      const assignments = await prisma.assignment.findMany({
        where: { teacherId: userId },
        include: {
          class: { select: { name: true } },
          article: { select: { title: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(assignments);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type || "MIXED",
        classId: data.classId,
        articleId: data.articleId || null,
        teacherId: (session.user as any).id,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
