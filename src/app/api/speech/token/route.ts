export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

/**
 * POST /api/speech/token
 * 用 Azure Speech Key 換取短期 token（10 分鐘有效）
 * 前端不直接存取 key，只用 token
 */
export async function POST() {
  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    return NextResponse.json(
      { error: "Azure Speech Services 未設定" },
      { status: 500 }
    );
  }

  try {
    const tokenRes = await fetch(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!tokenRes.ok) {
      throw new Error(`Token request failed: ${tokenRes.status}`);
    }

    const token = await tokenRes.text();

    return NextResponse.json({
      token,
      region: speechRegion,
    });
  } catch (error: any) {
    console.error("Azure token error:", error);
    return NextResponse.json(
      { error: "無法取得語音服務 token" },
      { status: 500 }
    );
  }
}
