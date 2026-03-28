export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getOrganizationId, withOrgFilter } from "@/lib/organization";

export async function GET() {
  try {
    const orgId = await getOrganizationId();

    const articles = await prisma.article.findMany({
      where: withOrgFilter({ isPublished: true }, orgId),
      include: {
        _count: { select: { words: true, exercises: true } },
      },
      orderBy: [{ gradeLevel: "asc" }, { level: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
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
    const article = await prisma.article.create({
      data: {
        title: data.title,
        titleZh: data.titleZh,
        content: data.content,
        contentZh: data.contentZh || null,
        level: data.level || "LEVEL1",
        gradeLevel: data.gradeLevel || 1,
        topic: data.topic || null,
        category: data.category || null,
        authorId: (session.user as any).id,
        organizationId: orgId,
      },
    });
    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
