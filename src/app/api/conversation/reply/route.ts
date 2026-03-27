export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getScenarioById, findNextNode } from "@/lib/conversation";
import { checkGrammar } from "@/lib/grammar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, currentNodeId, userMessage } = body;

    if (!scenarioId || !currentNodeId || !userMessage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 }
      );
    }

    // 文法檢查
    const grammarResult = checkGrammar(userMessage);

    // 找下一個對話節點
    const nextNode = findNextNode(scenario, currentNodeId, userMessage);

    if (!nextNode) {
      // 對話已結束或找不到節點
      return NextResponse.json({
        aiMessage: "That was a great conversation! Good job!",
        aiMessageZh: "這是一段很棒的對話！做得好！",
        grammarErrors: grammarResult.errors,
        nextNodeId: currentNodeId,
        isEnd: true,
      });
    }

    return NextResponse.json({
      aiMessage: nextNode.aiMessage,
      aiMessageZh: nextNode.aiMessageZh,
      grammarErrors: grammarResult.errors,
      nextNodeId: nextNode.id,
      isEnd: nextNode.isEnd || false,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
