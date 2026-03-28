/**
 * LINE Messaging API 工具
 * 使用 LINE 官方帳號推播訊息給家長
 * 文件：https://developers.line.biz/en/docs/messaging-api/
 */

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || "";

/**
 * 發送 LINE 推播訊息給指定用戶
 * @param lineUserId LINE 用戶 ID（家長加好友後取得）
 * @param message 訊息文字
 */
export async function sendLineMessage(lineUserId: string, message: string): Promise<boolean> {
  if (!CHANNEL_ACCESS_TOKEN) {
    console.error("[LINE] Channel access token 未設定");
    return false;
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[LINE] 推播失敗: ${res.status}`, errText);
    }
    return res.ok;
  } catch (error) {
    console.error("[LINE] 推播錯誤:", error);
    return false;
  }
}

/**
 * 驗證 LINE Webhook 簽名
 */
export function verifyLineSignature(body: string, signature: string): boolean {
  if (!CHANNEL_SECRET) return false;
  try {
    const crypto = require("crypto");
    const hash = crypto
      .createHmac("SHA256", CHANNEL_SECRET)
      .update(body)
      .digest("base64");
    return hash === signature;
  } catch {
    return false;
  }
}

/**
 * 取得 LINE 用戶的 profile
 */
export async function getLineProfile(lineUserId: string): Promise<{ displayName: string; pictureUrl?: string } | null> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    });
    if (res.ok) return res.json();
    return null;
  } catch {
    return null;
  }
}

// 保留舊的 export 名稱做相容（notifications.ts 引用）
export async function sendLineNotify(token: string, message: string): Promise<boolean> {
  // token 在 Messaging API 模式下就是 lineUserId
  return sendLineMessage(token, message);
}

export async function verifyLineToken(token: string): Promise<boolean> {
  // 驗證 LINE user ID 是否有效
  const profile = await getLineProfile(token);
  return !!profile;
}
