export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const includeStudents = searchParams.get("includeStudents") === "true";

    const where = (session.user as any).role === "STUDENT"
      ? { students: { some: { studentId: (session.user as any).id } } }
      : { teacherId: (session.user as any).id };

    const classes = await prisma.class.findMany({
      where,
      include: {
        _count: { select: { students: true } },
        ...(includeStudents ? {
          students: {
            include: { student: { select: { id: true, name: true, username: true } } },
          },
        } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(classes);
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
    const classRoom = await prisma.class.create({
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel || 1,
        description: data.description || null,
        teacherId: (session.user as any).id,
      },
    });

    return NextResponse.json(classRoom, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
