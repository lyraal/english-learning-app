export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/organizations — 列出所有組織
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
          classes: true,
          articles: true,
        },
      },
    },
  });

  return NextResponse.json(organizations);
}

// POST /api/admin/organizations — 新增組織
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, slug, logo, plan, maxStudents, maxTeachers } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { error: "名稱和識別碼為必填" },
      { status: 400 }
    );
  }

  // Check slug uniqueness
  const existing = await prisma.organization.findUnique({
    where: { slug },
  });
  if (existing) {
    return NextResponse.json(
      { error: "此識別碼已被使用" },
      { status: 400 }
    );
  }

  const org = await prisma.organization.create({
    data: {
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      logo: logo || null,
      plan: plan || "free",
      maxStudents: maxStudents || 30,
      maxTeachers: maxTeachers || 3,
    },
  });

  return NextResponse.json(org, { status: 201 });
}
