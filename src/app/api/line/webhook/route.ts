export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyLineSignature, getLineProfile, sendLineMessage } from "@/lib/line-notify";

/**
 * LINE Webhook 端點
 * 接收 LINE 平台的事件（加好友、傳訊息等）
 *
 * 流程：
 * 1. 家長在系統中取得綁定碼（6位數）
 * 2. 家長加「美語課輔 AI 助理」LINE 官方帳號為好友
 * 3. 家長傳送綁定碼到 LINE
 * 4. 系統自動綁定家長帳號的 lineUserId
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    // 驗證簽名（生產環境必須驗證）
    if (process.env.NODE_ENV === "production" && !verifyLineSignature(body, signature)) {
      console.error("[LINE Webhook] 簽名驗證失敗");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const data = JSON.parse(body);
    const events = data.events || [];

    for (const event of events) {
      const lineUserId = event.source?.userId;
      if (!lineUserId) continue;

      // 加好友事件
      if (event.type === "follow") {
        console.log(`[LINE Webhook] 新好友: ${lineUserId}`);
        await sendLineMessage(lineUserId,
          "歡迎加入「美語課輔 AI 助理」！🎉\n\n" +
          "請輸入您在系統中取得的 6 位數綁定碼，即可開始接收孩子的學習進度通知。\n\n" +
          "例如：123456"
        );
      }

      // 訊息事件（處理綁定碼）
      if (event.type === "message" && event.message?.type === "text") {
        const text = event.message.text.trim();
        console.log(`[LINE Webhook] 收到訊息: "${text}" from ${lineUserId}`);

        // 檢查是否為 6 位數綁定碼
        if (/^\d{6}$/.test(text)) {
          await handleBindingCode(lineUserId, text);
        } else {
          await sendLineMessage(lineUserId,
            "請輸入 6 位數綁定碼來綁定您的帳號。\n" +
            "綁定碼可在系統的「通知設定」頁面中取得。"
          );
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[LINE Webhook] 錯誤:", error);
    return NextResponse.json({ status: "ok" }); // LINE 要求回 200
  }
}

// LINE Webhook 驗證用
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

async function handleBindingCode(lineUserId: string, code: string) {
  // 查詢綁定碼
  const user = await prisma.user.findFirst({
    where: {
      lineBindingCode: code,
      role: "PARENT",
    },
  });

  if (!user) {
    await sendLineMessage(lineUserId,
      "❌ 綁定碼無效或已過期。\n請到系統的「通知設定」頁面重新產生綁定碼。"
    );
    return;
  }

  // 綁定 LINE User ID
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lineNotifyToken: lineUserId, // 存 LINE User ID
      lineBindingCode: null, // 清除綁定碼
    },
  });

  const profile = await getLineProfile(lineUserId);
  const displayName = profile?.displayName || "家長";

  await sendLineMessage(lineUserId,
    `✅ 綁定成功！\n\n${displayName} 您好，您的帳號已成功綁定。\n\n` +
    "您將收到以下通知：\n" +
    "📚 每日學習摘要\n" +
    "🏆 獲得新徽章\n" +
    "🔥 連續學習里程碑\n" +
    "✅ 作業完成\n" +
    "⚠️ 未登入提醒\n\n" +
    "如需調整通知設定，請到系統的「通知設定」頁面。"
  );
}
