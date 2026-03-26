/**
 * 語音工具 - 使用 Azure Speech Services
 * TTS: Azure TTS REST API (en-US-AvaMultilingualNeural)
 * STT + 發音評估: Azure Pronunciation Assessment REST API
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
  errorType?: string;
}

// ============================================================
// 麥克風檢查
// ============================================================

/**
 * 檢查麥克風是否可用，並返回友善的中文錯誤訊息
 */
export async function checkMicrophone(): Promise<{ ok: boolean; error?: string }> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      ok: false,
      error: "此瀏覽器不支援麥克風存取。請使用 Chrome 或 Edge，並確保使用 HTTPS 或 localhost。",
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // 成功取得，立即釋放
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true };
  } catch (err: any) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      return {
        ok: false,
        error: "請允許瀏覽器使用麥克風。點擊網址列左方的鎖頭圖示，開啟麥克風權限後重新整理頁面。",
      };
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return {
        ok: false,
        error: "找不到麥克風裝置。請確認麥克風已連接到電腦，並且沒有被其他程式佔用。",
      };
    }
    if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      return {
        ok: false,
        error: "麥克風被其他程式佔用中。請關閉其他使用麥克風的應用程式後再試一次。",
      };
    }
    return {
      ok: false,
      error: `麥克風錯誤：${err.message || "未知錯誤"}。請確認麥克風已連接並重新整理頁面。`,
    };
  }
}

// ============================================================
// 錄音（直接 PCM 捕捉，WAV 16kHz 16bit mono）
// 使用 ScriptProcessorNode 直接從 MediaStream 捕捉 PCM 原始資料
// 完全跳過 MediaRecorder + WebM 編解碼，避免靜音/空檔問題
// ============================================================

/**
 * 錄音 session 控制物件
 */
export interface RecordingSession {
  /** 停止錄音並回傳 WAV blob (16kHz 16bit mono) */
  stop: () => Promise<Blob>;
  /** 麥克風 MediaStream（可用於音量動畫等） */
  stream: MediaStream;
}

/**
 * 開始錄音，直接捕捉 PCM 資料，輸出 WAV 16kHz 16bit mono
 * 不使用 MediaRecorder，避免 WebM 編解碼導致靜音
 */
export async function startRecording(): Promise<RecordingSession> {
  // 先檢查麥克風
  const micCheck = await checkMicrophone();
  if (!micCheck.ok) {
    throw new Error(micCheck.error);
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  // 建立 AudioContext — 嘗試用 16kHz，但瀏覽器不一定支援
  let audioContext: AudioContext;
  try {
    audioContext = new AudioContext({ sampleRate: 16000 });
  } catch {
    // 某些瀏覽器不支援指定 sampleRate，用預設值
    audioContext = new AudioContext();
  }

  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  const pcmChunks: Float32Array[] = [];
  let isRecording = true;

  processor.onaudioprocess = (e) => {
    if (!isRecording) return;
    const inputData = e.inputBuffer.getChannelData(0);
    // 必須拷貝，因為 inputData buffer 會被重用
    pcmChunks.push(new Float32Array(inputData));
  };

  source.connect(processor);
  // ScriptProcessorNode 必須連到 destination 才能持續觸發 onaudioprocess
  processor.connect(audioContext.destination);

  return {
    stream,
    stop: async () => {
      isRecording = false;

      // 斷開音訊節點
      try { processor.disconnect(); } catch {}
      try { source.disconnect(); } catch {}

      // 停止麥克風
      stream.getTracks().forEach((t) => t.stop());

      // 合併所有 PCM chunks
      const totalLength = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of pcmChunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      // 如果 AudioContext 的取樣率不是 16kHz，重新取樣
      let samples = merged;
      const actualSampleRate = audioContext.sampleRate;
      if (actualSampleRate !== 16000) {
        const ratio = actualSampleRate / 16000;
        const newLength = Math.floor(merged.length / ratio);
        samples = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
          samples[i] = merged[Math.floor(i * ratio)];
        }
      }

      try { await audioContext.close(); } catch {}

      // 用 encodeWav 編碼為 WAV 16kHz 16bit mono
      const wavBuffer = encodeWav(samples, 16000);
      const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });

      console.log(
        `[speech] 錄音完成: ${(totalLength / actualSampleRate).toFixed(1)}s, ` +
        `原始取樣率=${actualSampleRate}Hz, ` +
        `WAV 大小=${(wavBlob.size / 1024).toFixed(1)}KB, ` +
        `PCM samples=${samples.length}`
      );

      return wavBlob;
    },
  };
}

/**
 * 將 PCM float32 samples 編碼為 WAV 格式
 */
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // PCM data
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ============================================================
// Azure TTS（文字轉語音）
// ============================================================

// TTS 音頻快取，避免重複請求
const ttsCache = new Map<string, string>();

/**
 * 使用 Azure TTS 播放文字語音
 * @param text 要朗讀的文字
 * @param rate 語速 (0.5-2.0)，預設 0.8
 * @param voice Azure 語音名稱，預設 en-US-AvaMultilingualNeural
 */
export async function speak(
  text: string,
  rate: number = 0.8,
  voice?: string
): Promise<void> {
  // 停止目前正在播放的音頻
  stopSpeaking();

  const cacheKey = `${text}|${rate}|${voice || ""}`;

  let audioUrl = ttsCache.get(cacheKey);

  if (!audioUrl) {
    try {
      const res = await fetch("/api/speech/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, rate, voice }),
      });

      if (!res.ok) {
        throw new Error("TTS 請求失敗");
      }

      const audioBlob = await res.blob();
      audioUrl = URL.createObjectURL(audioBlob);
      ttsCache.set(cacheKey, audioUrl);

      // 限制快取大小
      if (ttsCache.size > 100) {
        const firstKey = ttsCache.keys().next().value;
        if (firstKey) {
          const oldUrl = ttsCache.get(firstKey);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          ttsCache.delete(firstKey);
        }
      }
    } catch (error) {
      // 若 Azure TTS 失敗，fallback 到 Web Speech API
      console.warn("Azure TTS 失敗，使用瀏覽器 TTS:", error);
      return speakFallback(text, rate);
    }
  }

  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    currentAudioElement = audio;
    audio.onended = () => {
      currentAudioElement = null;
      resolve();
    };
    audio.onerror = (e) => {
      currentAudioElement = null;
      reject(new Error("音頻播放失敗"));
    };
    audio.play().catch(reject);
  });
}

let currentAudioElement: HTMLAudioElement | null = null;

/**
 * 停止目前正在播放的語音
 */
export function stopSpeaking() {
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  // 也停止 Web Speech API fallback
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Web Speech API fallback（當 Azure TTS 不可用時）
 */
function speakFallback(text: string, rate: number = 0.8): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("此瀏覽器不支援語音合成"));
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
      voices.find((v) => v.lang.startsWith("en-US"));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
}

// ============================================================
// Azure 逐句 TTS（帶高亮回呼）
// ============================================================

/**
 * 逐句播放 TTS 並在播放時呼叫 callback
 * @param sentences 句子陣列
 * @param onSentenceStart 開始播放第 n 句時的回呼
 * @param onComplete 全部播完的回呼
 * @param rate 語速
 * @returns 取消函式
 */
export function speakSentences(
  sentences: string[],
  onSentenceStart: (index: number) => void,
  onComplete: () => void,
  rate: number = 0.8
): () => void {
  let cancelled = false;
  let currentIndex = 0;

  async function playNext() {
    if (cancelled || currentIndex >= sentences.length) {
      if (!cancelled) onComplete();
      return;
    }

    onSentenceStart(currentIndex);

    try {
      await speak(sentences[currentIndex], rate);
    } catch {
      // 忽略播放錯誤，繼續下一句
    }

    currentIndex++;
    if (!cancelled) playNext();
  }

  playNext();

  return () => {
    cancelled = true;
    stopSpeaking();
  };
}

// ============================================================
// Azure Pronunciation Assessment（發音評估）
// ============================================================

/**
 * 使用 Azure Pronunciation Assessment 評估發音
 * @param audioBlob WAV 格式音頻
 * @param referenceText 參考文字
 */
export async function assessPronunciation(
  audioBlob: Blob,
  referenceText: string
): Promise<SpeechResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.wav");
  formData.append("referenceText", referenceText);

  const res = await fetch("/api/speech/pronunciation", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("發音評估請求失敗，請稍後再試");
  }

  const data = await res.json();

  if (!data.success && data.error) {
    throw new Error(data.error);
  }

  return {
    transcript: data.transcript,
    confidence: data.overallScore / 100,
    wordScores: data.wordScores || [],
    overallScore: data.overallScore,
    accuracy: data.accuracy,
    fluency: data.fluency,
    completeness: data.completeness,
  };
}

// ============================================================
// 工具函式
// ============================================================

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
