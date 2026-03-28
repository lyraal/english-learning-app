export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        classEnrollments: { include: { class: { select: { name: true } } } },
        childOf: {
          include: { parent: { select: { id: true, name: true, username: true } } },
        },
        _count: { select: { practiceRecords: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(students);
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
    const student = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        password: await hash(data.password || "123456", 10),
        role: "STUDENT",
      },
    });

    // Add to class if specified
    if (data.classId) {
      await prisma.classStudent.create({
        data: { classId: data.classId, studentId: student.id },
      });
    }

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
