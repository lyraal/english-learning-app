export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { withOrgFilter } from "@/lib/organization";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const includeStudents = searchParams.get("includeStudents") === "true";

    const userRole = (session.user as any).role;
    const orgId = (session.user as any).organizationId || null;

    let where: Record<string, any> = {};
    if (userRole === "STUDENT") {
      where = { students: { some: { studentId: (session.user as any).id } } };
    } else if (userRole === "ADMIN") {
      // ADMIN sees all within their org (or all if no org)
      where = {};
    } else {
      where = { teacherId: (session.user as any).id };
    }

    // Apply org filter
    where = withOrgFilter(where, orgId);

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

    const orgId = (session.user as any).organizationId || null;
    const data = await req.json();
    const classRoom = await prisma.class.create({
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel || 1,
        description: data.description || null,
        teacherId: (session.user as any).id,
        organizationId: orgId,
      },
    });

    return NextResponse.json(classRoom, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
