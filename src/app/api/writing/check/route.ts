export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkGrammar } from "@/lib/grammar";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, prompt, promptZh } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // 執行文法檢查
    const result = checkGrammar(text);

    // 儲存到資料庫
    const submission = await prisma.writingSubmission.create({
      data: {
        studentId: userId,
        prompt: prompt || "Free writing",
        promptZh: promptZh || "自由寫作",
        content: text,
        correctedText: result.correctedText,
        errors: JSON.stringify(result.errors),
        score: result.score.overall,
        grammarScore: result.score.grammar,
        structureScore: result.score.structure,
        vocabScore: result.score.vocabulary,
        feedback: generateFeedback(result),
      },
    });

    // 記錄練習
    await prisma.practiceRecord.create({
      data: {
        studentId: userId,
        type: "writing",
        score: result.score.overall,
        feedback: generateFeedback(result),
      },
    });

    // 積分：寫作練習 15 分
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: 15 } },
    });

    await prisma.pointHistory.create({
      data: {
        studentId: userId,
        amount: 15,
        source: "writing",
        detail: `完成寫作練習，得 ${result.score.overall} 分`,
      },
    });

    return NextResponse.json({
      id: submission.id,
      errors: result.errors,
      correctedText: result.correctedText,
      score: result.score,
      feedback: generateFeedback(result),
    });
  } catch (error) {
    console.error("Writing check error:", error);
    return NextResponse.json({ error: "Failed to check grammar" }, { status: 500 });
  }
}

function generateFeedback(result: ReturnType<typeof checkGrammar>): string {
  const { errors, score } = result;
  const parts: string[] = [];

  if (score.overall >= 90) {
    parts.push("太棒了！你的英文寫作非常好！🌟");
  } else if (score.overall >= 75) {
    parts.push("寫得不錯！只有一些小地方可以改進。👍");
  } else if (score.overall >= 60) {
    parts.push("繼續加油！多練習就會越來越好。💪");
  } else {
    parts.push("不要灰心，多練習就會進步的！加油！🎯");
  }

  if (errors.length === 0) {
    parts.push("沒有發現任何文法錯誤，你真厲害！");
  } else {
    const errorTypes = new Set(errors.map((e) => e.rule));
    if (errorTypes.has("capitalization")) parts.push("注意句首要大寫喔。");
    if (errorTypes.has("punctuation")) parts.push("記得在句子結尾加上標點符號。");
    if (errorTypes.has("be_verb") || errorTypes.has("has_have") || errorTypes.has("third_person_s")) {
      parts.push("主詞和動詞的搭配需要多注意。");
    }
    if (errorTypes.has("spelling")) parts.push("有一些拼字需要注意。");
    if (errorTypes.has("article_a") || errorTypes.has("article_an")) parts.push("a 和 an 的使用可以再注意。");
  }

  return parts.join(" ");
}
