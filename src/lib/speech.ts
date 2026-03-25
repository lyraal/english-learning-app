/**
 * 語音辨識工具 - 使用 Web Speech API
 * Phase 1: 基礎語音辨識
 * Phase 2: 預留 Azure Speech Services 接口
 */

export interface SpeechResult {
  transcript: string;
  confidence: number;
  wordScores: WordScore[];
  overallScore: number;
  accuracy: number;
  fluency: number;
  completeness: number;
}

export interface WordScore {
  word: string;
  score: number; // 0-100
  status: "good" | "fair" | "poor";
}

/**
 * 開始錄音
 */
export function startRecording(): Promise<{
  mediaRecorder: MediaRecorder;
  audioChunks: Blob[];
}> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      resolve({ mediaRecorder, audioChunks });
    } catch (error) {
      reject(new Error("無法存取麥克風，請確認已授予麥克風權限"));
    }
  });
}

/**
 * 停止錄音並返回 Blob
 */
export function stopRecording(
  mediaRecorder: MediaRecorder,
  audioChunks: Blob[]
): Promise<Blob> {
  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      // Stop all tracks
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      resolve(audioBlob);
    };
    mediaRecorder.stop();
  });
}

/**
 * 使用 Web Speech API 進行語音辨識
 */
export function recognizeSpeech(targetText: string): Promise<SpeechResult> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(new Error("此瀏覽器不支援語音辨識，請使用 Chrome 或 Edge"));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;

      // 基礎評分邏輯（Phase 1）
      const result = evaluatePronunciation(transcript, targetText, confidence);
      resolve(result);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        reject(new Error("沒有偵測到語音，請再試一次"));
      } else if (event.error === "audio-capture") {
        reject(new Error("無法擷取音訊，請檢查麥克風"));
      } else {
        reject(new Error(`語音辨識錯誤：${event.error}`));
      }
    };

    recognition.start();
  });
}

/**
 * 基礎發音評估（Phase 1）
 * 透過比對辨識結果與目標文字來評分
 */
function evaluatePronunciation(
  transcript: string,
  targetText: string,
  confidence: number
): SpeechResult {
  const targetWords = targetText.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
  const spokenWords = transcript.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);

  // 逐字比對
  const wordScores: WordScore[] = targetWords.map((targetWord) => {
    const found = spokenWords.some(
      (spoken) =>
        spoken === targetWord ||
        levenshteinDistance(spoken, targetWord) <= Math.max(1, Math.floor(targetWord.length * 0.3))
    );

    const score = found ? Math.round(70 + confidence * 30) : Math.round(confidence * 40);

    return {
      word: targetWord,
      score,
      status: score >= 80 ? "good" : score >= 50 ? "fair" : "poor",
    };
  });

  // 計算各項分數
  const matchedWords = wordScores.filter((w) => w.status !== "poor").length;
  const completeness = Math.round((matchedWords / targetWords.length) * 100);
  const accuracy = Math.round(
    wordScores.reduce((sum, w) => sum + w.score, 0) / wordScores.length
  );
  const fluency = Math.round(confidence * 100);
  const overallScore = Math.round(accuracy * 0.4 + fluency * 0.3 + completeness * 0.3);

  return {
    transcript,
    confidence,
    wordScores,
    overallScore,
    accuracy,
    fluency,
    completeness,
  };
}

/**
 * Levenshtein 距離（用於模糊比對）
 */
function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }

  return dp[a.length][b.length];
}

/**
 * 文字轉語音
 */
export function speak(text: string, rate: number = 0.8): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("此瀏覽器不支援語音合成"));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = 1;

    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Google")
    ) || voices.find((v) => v.lang.startsWith("en-US"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * 取得音訊波形數據（用於錄音動畫）
 */
export function getAudioAnalyser(
  stream: MediaStream
): { analyser: AnalyserNode; dataArray: Uint8Array } {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  return { analyser, dataArray };
}

/**
 * 分數轉星星數
 */
export function scoreToStars(score: number): number {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  return 1;
}
