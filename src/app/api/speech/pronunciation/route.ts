export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/speech/pronunciation
 * 接收音頻 + 參考文字，呼叫 Azure Pronunciation Assessment API
 * 回傳逐字評分結果
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
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const referenceText = formData.get("referenceText") as string | null;

    if (!audioFile || !referenceText) {
      return NextResponse.json(
        { error: "缺少 audio 或 referenceText 參數" },
        { status: 400 }
      );
    }

    const audioBuffer = await audioFile.arrayBuffer();

    console.log(
      `[pronunciation] 收到音頻: size=${audioBuffer.byteLength} bytes, ` +
      `referenceText="${referenceText.substring(0, 50)}..."`
    );

    // 驗證 WAV 格式
    if (audioBuffer.byteLength < 44) {
      console.error("[pronunciation] 音頻太小，可能是空檔案");
      return NextResponse.json({
        success: false,
        error: "錄音檔案太小，請確認麥克風正常運作後重試",
        transcript: "", overallScore: 0, accuracy: 0, fluency: 0, completeness: 0, wordScores: [],
      });
    }

    // 檢查 WAV header
    const headerView = new DataView(audioBuffer.slice(0, 44));
    const riff = String.fromCharCode(headerView.getUint8(0), headerView.getUint8(1), headerView.getUint8(2), headerView.getUint8(3));
    const sampleRate = headerView.getUint32(24, true);
    const bitsPerSample = headerView.getUint16(34, true);
    const dataSize = headerView.getUint32(40, true);
    console.log(
      `[pronunciation] WAV header: riff="${riff}", sampleRate=${sampleRate}, ` +
      `bits=${bitsPerSample}, dataSize=${dataSize}, duration≈${(dataSize / (sampleRate * 2)).toFixed(1)}s`
    );

    if (dataSize < 3200) {
      // 少於 0.1 秒的音頻（16000 * 2 * 0.1 = 3200）
      console.error("[pronunciation] 音頻時長太短");
      return NextResponse.json({
        success: false,
        error: "錄音時間太短，請說完整的句子後再停止錄音",
        transcript: "", overallScore: 0, accuracy: 0, fluency: 0, completeness: 0, wordScores: [],
      });
    }

    // Pronunciation Assessment 設定
    const pronAssessmentConfig = {
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Granularity: "Word",
      Dimension: "Comprehensive",
      EnableMiscue: true,
    };

    const pronAssessmentHeader = Buffer.from(
      JSON.stringify(pronAssessmentConfig)
    ).toString("base64");

    // 呼叫 Azure Speech-to-Text + Pronunciation Assessment
    const sttRes = await fetch(
      `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "audio/wav",
          Accept: "application/json;text/xml",
          "Pronunciation-Assessment": pronAssessmentHeader,
        },
        body: audioBuffer,
      }
    );

    if (!sttRes.ok) {
      const errText = await sttRes.text();
      console.error("Azure Pronunciation error:", sttRes.status, errText);
      throw new Error(`Pronunciation assessment failed: ${sttRes.status}`);
    }

    const result = await sttRes.json();

    console.log("[pronunciation] Azure 回應:", JSON.stringify(result, null, 2));

    if (result.RecognitionStatus !== "Success") {
      console.warn(`[pronunciation] RecognitionStatus=${result.RecognitionStatus}`, JSON.stringify(result));
      // 處理無語音等情況
      return NextResponse.json({
        success: false,
        error:
          result.RecognitionStatus === "NoMatch"
            ? "沒有偵測到語音，請再試一次"
            : result.RecognitionStatus === "InitialSilenceTimeout"
            ? "沒有偵測到語音，請對著麥克風大聲說"
            : `辨識失敗：${result.RecognitionStatus}`,
        transcript: "",
        overallScore: 0,
        accuracy: 0,
        fluency: 0,
        completeness: 0,
        wordScores: [],
      });
    }

    // 解析 Pronunciation Assessment 結果
    // Azure 回傳的分數可能在 NBest[0] 直接屬性或巢狀在 PronunciationAssessment 中
    const nBest = result.NBest?.[0];
    const pronResult = nBest?.PronunciationAssessment || nBest;
    const words = nBest?.Words || [];

    const wordScores = words.map((w: any) => {
      // Word 層級的分數也可能直接在 word 上或巢狀在 PronunciationAssessment
      const pa = w.PronunciationAssessment || w;
      const score = pa?.AccuracyScore ?? 0;
      return {
        word: w.Word,
        score: Math.round(score),
        status:
          score >= 80 ? "good" : score >= 50 ? "fair" : ("poor" as const),
        errorType: pa?.ErrorType || w?.ErrorType || "None",
      };
    });

    const overallScore = Math.round(pronResult?.PronScore ?? 0);
    const accuracy = Math.round(pronResult?.AccuracyScore ?? 0);
    const fluency = Math.round(pronResult?.FluencyScore ?? 0);
    const completeness = Math.round(pronResult?.CompletenessScore ?? 0);

    console.log(`[pronunciation] 解析結果: overall=${overallScore}, accuracy=${accuracy}, fluency=${fluency}, completeness=${completeness}, words=${wordScores.length}`);

    return NextResponse.json({
      success: true,
      transcript: nBest?.Display || result.DisplayText || "",
      overallScore,
      accuracy,
      fluency,
      completeness,
      wordScores,
    });
  } catch (error: any) {
    console.error("Pronunciation assessment error:", error);
    return NextResponse.json(
      { error: "發音評估失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
