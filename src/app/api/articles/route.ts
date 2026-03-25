import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
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
        authorId: (session.user as any).id,
      },
    });
    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
