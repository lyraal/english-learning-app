export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get("articleId");

    const where = articleId ? { articleId } : {};
    const words = await prisma.word.findMany({
      where,
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json(words);
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
    const word = await prisma.word.create({
      data: {
        word: data.word,
        phonetic: data.phonetic || null,
        translation: data.translation,
        exampleSentence: data.exampleSentence || null,
        articleId: data.articleId,
      },
    });

    return NextResponse.json(word, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
