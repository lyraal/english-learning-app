import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/speech/tts
 * 使用 Azure TTS REST API 合成語音
 * 接收 { text, rate?, voice? }，回傳 audio/mpeg
 */
export async function POST(req: NextRequest) {
  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    return NextResponse.json(
      { error: "Azure Speech Services 未設定" },
      { status: 500 }
    );
  }

  try {
    const { text, rate, voice } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "缺少 text 參數" }, { status: 400 });
    }

    // 語速：prosody rate 屬性，例如 "-20%" 代表慢 20%
    const prosodyRate = rate ? `${Math.round((rate - 1) * 100)}%` : "-20%";
    const voiceName = voice || "en-US-AvaMultilingualNeural";

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voiceName}">
          <prosody rate="${prosodyRate}">
            ${escapeXml(text)}
          </prosody>
        </voice>
      </speak>
    `.trim();

    const ttsRes = await fetch(
      `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        },
        body: ssml,
      }
    );

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      console.error("Azure TTS error:", ttsRes.status, errText);
      throw new Error(`TTS request failed: ${ttsRes.status}`);
    }

    const audioBuffer = await ttsRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "語音合成失敗" },
      { status: 500 }
    );
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
