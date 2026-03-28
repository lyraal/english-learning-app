export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/admin/organizations/[id] — 編輯組織
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, slug, logo, plan, maxStudents, maxTeachers, isActive } = body;

  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "找不到此組織" }, { status: 404 });
  }

  if (slug && slug !== existing.slug) {
    const slugExists = await prisma.organization.findUnique({
      where: { slug },
    });
    if (slugExists) {
      return NextResponse.json(
        { error: "此識別碼已被使用" },
        { status: 400 }
      );
    }
  }

  const updateData: Record<string, any> = {};
  if (name !== undefined) updateData.name = name;
  if (slug !== undefined)
    updateData.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (logo !== undefined) updateData.logo = logo;
  if (plan !== undefined) updateData.plan = plan;
  if (maxStudents !== undefined) updateData.maxStudents = maxStudents;
  if (maxTeachers !== undefined) updateData.maxTeachers = maxTeachers;
  if (isActive !== undefined) updateData.isActive = isActive;

  const org = await prisma.organization.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(org);
}

// GET /api/admin/organizations/[id] — 取得單一組織詳情
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          classes: true,
          articles: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          username: true,
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!org) {
    return NextResponse.json({ error: "找不到此組織" }, { status: 404 });
  }

  return NextResponse.json(org);
}
