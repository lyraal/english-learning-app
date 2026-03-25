import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const words = await prisma.word.findMany({
      include: { article: { select: { title: true } } },
      orderBy: [{ article: { title: "asc" } }, { orderIndex: "asc" }],
    });
    return NextResponse.json(words);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
