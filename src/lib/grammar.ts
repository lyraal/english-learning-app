/**
 * 規則式英文文法檢查器 — 針對國小程度
 * 不依賴外部 AI API，使用正則表達式和規則
 */

export interface GrammarError {
  text: string;        // 錯誤的文字
  position: number;    // 在原文中的位置
  length: number;      // 錯誤文字長度
  suggestion: string;  // 建議修正
  rule: string;        // 規則名稱
  explanation: string; // 解釋（中文）
}

export interface GrammarScore {
  grammar: number;     // 文法正確性 0-100
  structure: number;   // 句子結構 0-100
  vocabulary: number;  // 詞彙使用 0-100
  overall: number;     // 整體分數 0-100
}

export interface GrammarResult {
  errors: GrammarError[];
  correctedText: string;
  score: GrammarScore;
}

// ===== 常見不規則動詞錯誤 =====
const IRREGULAR_VERB_ERRORS: Record<string, { correct: string; explanation: string }> = {
  "goed": { correct: "went", explanation: "go 的過去式是 went，不是 goed" },
  "eated": { correct: "ate", explanation: "eat 的過去式是 ate，不是 eated" },
  "drinked": { correct: "drank", explanation: "drink 的過去式是 drank，不是 drinked" },
  "runned": { correct: "ran", explanation: "run 的過去式是 ran，不是 runned" },
  "swimmed": { correct: "swam", explanation: "swim 的過去式是 swam，不是 swimmed" },
  "writed": { correct: "wrote", explanation: "write 的過去式是 wrote，不是 writed" },
  "readed": { correct: "read", explanation: "read 的過去式還是 read（發音不同），不是 readed" },
  "taked": { correct: "took", explanation: "take 的過去式是 took，不是 taked" },
  "maked": { correct: "made", explanation: "make 的過去式是 made，不是 maked" },
  "gived": { correct: "gave", explanation: "give 的過去式是 gave，不是 gived" },
  "comed": { correct: "came", explanation: "come 的過去式是 came，不是 comed" },
  "seed": { correct: "saw", explanation: "see 的過去式是 saw，不是 seed" },
  "telled": { correct: "told", explanation: "tell 的過去式是 told，不是 telled" },
  "finded": { correct: "found", explanation: "find 的過去式是 found，不是 finded" },
  "teached": { correct: "taught", explanation: "teach 的過去式是 taught，不是 teached" },
  "buyed": { correct: "bought", explanation: "buy 的過去式是 bought，不是 buyed" },
  "bringed": { correct: "brought", explanation: "bring 的過去式是 brought，不是 bringed" },
  "catched": { correct: "caught", explanation: "catch 的過去式是 caught，不是 catched" },
  "thinked": { correct: "thought", explanation: "think 的過去式是 thought，不是 thinked" },
  "feeled": { correct: "felt", explanation: "feel 的過去式是 felt，不是 feeled" },
  "leaved": { correct: "left", explanation: "leave 的過去式是 left，不是 leaved" },
  "sayed": { correct: "said", explanation: "say 的過去式是 said，不是 sayed" },
  "knowed": { correct: "knew", explanation: "know 的過去式是 knew，不是 knowed" },
  "growed": { correct: "grew", explanation: "grow 的過去式是 grew，不是 growed" },
  "drawed": { correct: "drew", explanation: "draw 的過去式是 drew，不是 drawed" },
  "singed": { correct: "sang", explanation: "sing 的過去式是 sang，不是 singed" },
  "speaked": { correct: "spoke", explanation: "speak 的過去式是 spoke，不是 speaked" },
  "breaked": { correct: "broke", explanation: "break 的過去式是 broke，不是 breaked" },
  "choosed": { correct: "chose", explanation: "choose 的過去式是 chose，不是 choosed" },
  "weared": { correct: "wore", explanation: "wear 的過去式是 wore，不是 weared" },
  "drived": { correct: "drove", explanation: "drive 的過去式是 drove，不是 drived" },
  "falled": { correct: "fell", explanation: "fall 的過去式是 fell，不是 falled" },
  "flyed": { correct: "flew", explanation: "fly 的過去式是 flew，不是 flyed" },
  "forgeted": { correct: "forgot", explanation: "forget 的過去式是 forgot，不是 forgeted" },
  "forgoted": { correct: "forgot", explanation: "forget 的過去式是 forgot，不是 forgoted" },
  "hided": { correct: "hid", explanation: "hide 的過去式是 hid，不是 hided" },
  "keeped": { correct: "kept", explanation: "keep 的過去式是 kept，不是 keeped" },
  "layed": { correct: "lay", explanation: "lie（躺下）的過去式是 lay，不是 layed" },
  "losted": { correct: "lost", explanation: "lose 的過去式是 lost，不是 losted" },
  "payed": { correct: "paid", explanation: "pay 的過去式是 paid，不是 payed" },
  "putted": { correct: "put", explanation: "put 的過去式還是 put，不是 putted" },
  "rided": { correct: "rode", explanation: "ride 的過去式是 rode，不是 rided" },
  "selled": { correct: "sold", explanation: "sell 的過去式是 sold，不是 selled" },
  "sended": { correct: "sent", explanation: "send 的過去式是 sent，不是 sended" },
  "sitted": { correct: "sat", explanation: "sit 的過去式是 sat，不是 sitted" },
  "sleeped": { correct: "slept", explanation: "sleep 的過去式是 slept，不是 sleeped" },
  "standed": { correct: "stood", explanation: "stand 的過去式是 stood，不是 standed" },
  "stealed": { correct: "stole", explanation: "steal 的過去式是 stole，不是 stealed" },
  "throwed": { correct: "threw", explanation: "throw 的過去式是 threw，不是 throwed" },
  "understanded": { correct: "understood", explanation: "understand 的過去式是 understood" },
  "waked": { correct: "woke", explanation: "wake 的過去式是 woke，不是 waked" },
  "winned": { correct: "won", explanation: "win 的過去式是 won，不是 winned" },
};

// ===== 常見拼寫錯誤 =====
const COMMON_MISSPELLINGS: Record<string, { correct: string; explanation: string }> = {
  "becaus": { correct: "because", explanation: "正確拼法是 because" },
  "becuse": { correct: "because", explanation: "正確拼法是 because" },
  "becasue": { correct: "because", explanation: "正確拼法是 because" },
  "freind": { correct: "friend", explanation: "正確拼法是 friend（i 在 e 前面）" },
  "frend": { correct: "friend", explanation: "正確拼法是 friend" },
  "ther": { correct: "there", explanation: "正確拼法是 there" },
  "thier": { correct: "their", explanation: "正確拼法是 their" },
  "realy": { correct: "really", explanation: "正確拼法是 really（有兩個 l）" },
  "beautful": { correct: "beautiful", explanation: "正確拼法是 beautiful" },
  "beatiful": { correct: "beautiful", explanation: "正確拼法是 beautiful" },
  "diffrent": { correct: "different", explanation: "正確拼法是 different" },
  "differet": { correct: "different", explanation: "正確拼法是 different" },
  "intresting": { correct: "interesting", explanation: "正確拼法是 interesting" },
  "importent": { correct: "important", explanation: "正確拼法是 important" },
  "tommorow": { correct: "tomorrow", explanation: "正確拼法是 tomorrow" },
  "tomorow": { correct: "tomorrow", explanation: "正確拼法是 tomorrow" },
  "togeather": { correct: "together", explanation: "正確拼法是 together" },
  "togather": { correct: "together", explanation: "正確拼法是 together" },
  "hapily": { correct: "happily", explanation: "正確拼法是 happily（y 變 i 再加 ly）" },
  "happyly": { correct: "happily", explanation: "正確拼法是 happily（y 變 i 再加 ly）" },
  "favorit": { correct: "favorite", explanation: "正確拼法是 favorite" },
  "favourit": { correct: "favorite", explanation: "正確拼法是 favorite" },
  "familiy": { correct: "family", explanation: "正確拼法是 family" },
  "famly": { correct: "family", explanation: "正確拼法是 family" },
  "anmal": { correct: "animal", explanation: "正確拼法是 animal" },
  "animel": { correct: "animal", explanation: "正確拼法是 animal" },
  "shcool": { correct: "school", explanation: "正確拼法是 school" },
  "skool": { correct: "school", explanation: "正確拼法是 school" },
  "teecher": { correct: "teacher", explanation: "正確拼法是 teacher" },
  "techer": { correct: "teacher", explanation: "正確拼法是 teacher" },
  "lern": { correct: "learn", explanation: "正確拼法是 learn" },
  "leanr": { correct: "learn", explanation: "正確拼法是 learn" },
  "somthing": { correct: "something", explanation: "正確拼法是 something" },
  "evrything": { correct: "everything", explanation: "正確拼法是 everything" },
  "evry": { correct: "every", explanation: "正確拼法是 every" },
  "pepole": { correct: "people", explanation: "正確拼法是 people" },
  "peple": { correct: "people", explanation: "正確拼法是 people" },
  "excercise": { correct: "exercise", explanation: "正確拼法是 exercise" },
  "exercize": { correct: "exercise", explanation: "正確拼法是 exercise" },
  "wensday": { correct: "Wednesday", explanation: "正確拼法是 Wednesday" },
  "wendsday": { correct: "Wednesday", explanation: "正確拼法是 Wednesday" },
};

// ===== "a" 前面要用 "an" 的字母 =====
const VOWEL_SOUNDS = new Set(["a", "e", "i", "o", "u"]);

// ===== 主詞-動詞搭配規則 =====
interface SubjectVerbRule {
  pattern: RegExp;
  check: (match: RegExpExecArray, text: string) => GrammarError | null;
}

/**
 * 執行文法檢查
 */
export function checkGrammar(text: string): GrammarResult {
  const errors: GrammarError[] = [];
  let correctedText = text;

  // 1. 句首大寫檢查
  checkCapitalization(text, errors);

  // 2. 句尾標點檢查
  checkPunctuation(text, errors);

  // 3. "I" 永遠大寫
  checkPronounI(text, errors);

  // 4. a/an 使用
  checkArticles(text, errors);

  // 5. is/are/am 搭配
  checkBeVerbs(text, errors);

  // 6. has/have 搭配
  checkHasHave(text, errors);

  // 7. 第三人稱單數 -s
  checkThirdPersonS(text, errors);

  // 8. 常見不規則動詞錯誤
  checkIrregularVerbs(text, errors);

  // 9. 常見拼寫錯誤
  checkSpelling(text, errors);

  // 10. 雙重否定
  checkDoubleNegative(text, errors);

  // 11. 重複單字
  checkRepeatedWords(text, errors);

  // 去重（相同位置的錯誤只保留一個）
  const uniqueErrors = deduplicateErrors(errors);

  // 生成修正版本
  correctedText = generateCorrectedText(text, uniqueErrors);

  // 計算分數
  const score = calculateScore(text, uniqueErrors);

  return { errors: uniqueErrors, correctedText, score };
}

// ===== 規則實現 =====

function checkCapitalization(text: string, errors: GrammarError[]) {
  // 句首大寫
  const sentences = text.split(/(?<=[.!?])\s+/);
  let offset = 0;
  for (const sentence of sentences) {
    const trimmed = sentence.trimStart();
    const startIdx = text.indexOf(trimmed, offset);
    if (trimmed.length > 0 && /^[a-z]/.test(trimmed)) {
      errors.push({
        text: trimmed[0],
        position: startIdx,
        length: 1,
        suggestion: trimmed[0].toUpperCase(),
        rule: "capitalization",
        explanation: "句子的第一個字母要大寫",
      });
    }
    offset = startIdx + trimmed.length;
  }
}

function checkPunctuation(text: string, errors: GrammarError[]) {
  const trimmed = text.trim();
  if (trimmed.length > 0 && !/[.!?]$/.test(trimmed)) {
    errors.push({
      text: "",
      position: trimmed.length,
      length: 0,
      suggestion: ".",
      rule: "punctuation",
      explanation: "句子結尾要加上標點符號（. ! ?）",
    });
  }

  // 檢查每個句子是否有結尾標點
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length > 1) {
    let offset = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const s = sentences[i];
      offset += s.length + 1; // +1 for space
    }
  }
}

function checkPronounI(text: string, errors: GrammarError[]) {
  // " i " 或句首 "i " — 應該是大寫 "I"
  const regex = /\bi\b/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    // 只在確實是代名詞 I 時標記（不在其他單字中）
    const before = match.index > 0 ? text[match.index - 1] : " ";
    const after = match.index + 1 < text.length ? text[match.index + 1] : " ";
    if (/[\s,.!?]/.test(before) && /[\s,.!?]/.test(after)) {
      errors.push({
        text: "i",
        position: match.index,
        length: 1,
        suggestion: "I",
        rule: "pronoun_i",
        explanation: "代名詞「我」在英文中永遠要大寫 I",
      });
    }
  }
}

function checkArticles(text: string, errors: GrammarError[]) {
  // "a" + 母音開頭 → "an"
  const aBeforeVowel = /\ba\s+([aeiouAEIOU]\w*)/gi;
  let match;
  while ((match = aBeforeVowel.exec(text)) !== null) {
    // 排除一些例外（如 a uniform, a university）
    const word = match[1].toLowerCase();
    if (word.startsWith("uni") || word.startsWith("eu") || word.startsWith("one")) continue;

    errors.push({
      text: `a ${match[1]}`,
      position: match.index,
      length: match[0].length,
      suggestion: `an ${match[1]}`,
      rule: "article_an",
      explanation: `母音開頭的字前面要用 an，不是 a（a ${match[1]} → an ${match[1]}）`,
    });
  }

  // "an" + 子音開頭 → "a"
  const anBeforeConsonant = /\ban\s+([bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]\w*)/g;
  while ((match = anBeforeConsonant.exec(text)) !== null) {
    // 排除例外（如 an hour, an honest）
    const word = match[1].toLowerCase();
    if (word.startsWith("hour") || word.startsWith("honest") || word.startsWith("heir") || word.startsWith("honor")) continue;

    errors.push({
      text: `an ${match[1]}`,
      position: match.index,
      length: match[0].length,
      suggestion: `a ${match[1]}`,
      rule: "article_a",
      explanation: `子音開頭的字前面要用 a，不是 an（an ${match[1]} → a ${match[1]}）`,
    });
  }
}

function checkBeVerbs(text: string, errors: GrammarError[]) {
  // I are → I am
  const iAre = /\bI\s+are\b/gi;
  let match;
  while ((match = iAre.exec(text)) !== null) {
    errors.push({
      text: match[0],
      position: match.index,
      length: match[0].length,
      suggestion: "I am",
      rule: "be_verb",
      explanation: "I 要搭配 am（I am），不是 are",
    });
  }

  // I is → I am
  const iIs = /\bI\s+is\b/gi;
  while ((match = iIs.exec(text)) !== null) {
    errors.push({
      text: match[0],
      position: match.index,
      length: match[0].length,
      suggestion: "I am",
      rule: "be_verb",
      explanation: "I 要搭配 am（I am），不是 is",
    });
  }

  // He/She/It are → He/She/It is
  const heAre = /\b(He|She|It)\s+are\b/gi;
  while ((match = heAre.exec(text)) !== null) {
    const subject = match[1];
    errors.push({
      text: match[0],
      position: match.index,
      length: match[0].length,
      suggestion: `${subject} is`,
      rule: "be_verb",
      explanation: `${subject} 要搭配 is（${subject} is），不是 are`,
    });
  }

  // He/She/It am → He/She/It is
  const heAm = /\b(He|She|It)\s+am\b/gi;
  while ((match = heAm.exec(text)) !== null) {
    const subject = match[1];
    errors.push({
      text: match[0],
      position: match.index,
      length: match[0].length,
      suggestion: `${subject} is`,
      rule: "be_verb",
      explanation: `${subject} 要搭配 is（${subject} is），不是 am`,
    });
  }

  // We/They/You is → We/They/You are
  const weIs = /\b(We|They|You)\s+is\b/gi;
  while ((match = weIs.exec(text)) !== null) {
    const subject = match[1];
    errors.push({
      text: match[0],
      position: match.index,
      length: match[0].length,
      suggestion: `${subject} are`,
      rule: "be_verb",
      explanation: `${subject} 要搭配 are（${subject} are），不是 is`,
    });
  }

  // We/They/You am → We/They/You are
  const weAm = /\b(We|They|You)\s+am\b/gi;
  while ((match = weAm.exec(text)) !== null) {
    const subject = match[1];
    errors.push({
      text: match[0],
      position: match.index,
      length: match[0].length,
      suggestion: `${subject} are`,
      rule: "be_verb",
      explanation: `${subject} 要搭配 are（${subject} are），不是 am`,
    });
  }
}

function checkHasHave(text: string, errors: GrammarError[]) {
  // He/She/It have → has
  const heHave = /\b(He|She|It)\s+have\b/gi;
  let match;
  while ((match = heHave.exec(text)) !== null) {
    const subject = match[1];
    errors.push({
      text: match[0],
      position: match.index,
      length: match[0].length,
      suggestion: `${subject} has`,
      rule: "has_have",
      explanation: `${subject} 要搭配 has（${subject} has），不是 have`,
    });
  }

  // I/We/They/You has → have
  const iHas = /\b(I|We|They|You)\s+has\b/gi;
  while ((match = iHas.exec(text)) !== null) {
    const subject = match[1];
    errors.push({
      text: match[0],
      position: match.index,
      length: match[0].length,
      suggestion: `${subject} have`,
      rule: "has_have",
      explanation: `${subject} 要搭配 have（${subject} have），不是 has`,
    });
  }
}

function checkThirdPersonS(text: string, errors: GrammarError[]) {
  // He/She/It + 動詞原形（常見動詞）
  const commonVerbs = [
    "like", "want", "need", "go", "come", "play", "eat", "drink",
    "read", "write", "run", "walk", "talk", "work", "live", "love",
    "know", "think", "make", "take", "give", "look", "use", "find",
    "tell", "ask", "try", "leave", "call", "feel", "start", "help",
    "show", "hear", "turn", "move", "learn", "study", "cook", "clean",
    "wash", "watch", "sleep", "wake", "open", "close", "sing", "dance",
    "draw", "paint", "swim", "jump", "catch", "throw", "build",
  ];

  for (const verb of commonVerbs) {
    const regex = new RegExp(`\\b(He|She|It)\\s+${verb}\\b(?!s|ed|ing)`, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      // 確認後面不是 s
      const afterMatch = text.substring(match.index + match[0].length);
      if (afterMatch.startsWith("s") || afterMatch.startsWith("ed") || afterMatch.startsWith("ing")) continue;

      const subject = match[1];
      // 動詞加 s 規則
      let verbWithS = verb + "s";
      if (verb.endsWith("y") && !["play", "stay", "enjoy"].includes(verb)) {
        verbWithS = verb.slice(0, -1) + "ies";
      } else if (verb.endsWith("sh") || verb.endsWith("ch") || verb.endsWith("x") || verb.endsWith("o") || verb.endsWith("ss")) {
        verbWithS = verb + "es";
      }

      errors.push({
        text: match[0],
        position: match.index,
        length: match[0].length,
        suggestion: `${subject} ${verbWithS}`,
        rule: "third_person_s",
        explanation: `第三人稱單數（${subject}）的動詞要加 s（${verb} → ${verbWithS}）`,
      });
    }
  }
}

function checkIrregularVerbs(text: string, errors: GrammarError[]) {
  const words = text.split(/\s+/);
  let offset = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[.,!?;:'"]/g, "").toLowerCase();
    const pos = text.indexOf(word, offset);

    if (IRREGULAR_VERB_ERRORS[cleanWord]) {
      const { correct, explanation } = IRREGULAR_VERB_ERRORS[cleanWord];
      errors.push({
        text: cleanWord,
        position: pos,
        length: cleanWord.length,
        suggestion: correct,
        rule: "irregular_verb",
        explanation,
      });
    }

    offset = pos + word.length;
  }
}

function checkSpelling(text: string, errors: GrammarError[]) {
  const words = text.split(/\s+/);
  let offset = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[.,!?;:'"]/g, "").toLowerCase();
    const pos = text.indexOf(word, offset);

    if (COMMON_MISSPELLINGS[cleanWord]) {
      const { correct, explanation } = COMMON_MISSPELLINGS[cleanWord];
      errors.push({
        text: cleanWord,
        position: pos,
        length: cleanWord.length,
        suggestion: correct,
        rule: "spelling",
        explanation,
      });
    }

    offset = pos + word.length;
  }
}

function checkDoubleNegative(text: string, errors: GrammarError[]) {
  // don't + no/nothing/nobody/nowhere/never
  const doubleNeg = /\b(don't|doesn't|didn't|can't|won't|isn't|aren't)\s+\w*\s*(no|nothing|nobody|nowhere|never)\b/gi;
  let match;
  while ((match = doubleNeg.exec(text)) !== null) {
    errors.push({
      text: match[0],
      position: match.index,
      length: match[0].length,
      suggestion: match[0].replace(/\b(no|nothing|nobody|nowhere)\b/i, (m) => {
        const replacements: Record<string, string> = {
          "no": "any", "nothing": "anything", "nobody": "anybody", "nowhere": "anywhere",
        };
        return replacements[m.toLowerCase()] || m;
      }),
      rule: "double_negative",
      explanation: "英文中不使用雙重否定。例如 don't have no → don't have any",
    });
  }
}

function checkRepeatedWords(text: string, errors: GrammarError[]) {
  const regex = /\b(\w+)\s+\1\b/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    // 排除一些合理的重複（如 "very very", "had had"）
    const word = match[1].toLowerCase();
    if (["very", "had", "that", "so"].includes(word)) continue;

    errors.push({
      text: match[0],
      position: match.index,
      length: match[0].length,
      suggestion: match[1],
      rule: "repeated_word",
      explanation: `重複的字：「${match[1]}」出現了兩次，可能是打字錯誤`,
    });
  }
}

// ===== 輔助函數 =====

function deduplicateErrors(errors: GrammarError[]): GrammarError[] {
  const seen = new Set<string>();
  return errors.filter((err) => {
    // 用位置+長度去重，同一位置的不同規則只保留第一個
    const key = `${err.position}-${err.length}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateCorrectedText(text: string, errors: GrammarError[]): string {
  if (errors.length === 0) return text;

  // 按位置倒序排列，從後往前替換
  const sorted = [...errors].sort((a, b) => b.position - a.position);
  let result = text;

  for (const err of sorted) {
    if (err.length === 0) {
      // 插入（如缺少標點）
      result = result.slice(0, err.position) + err.suggestion + result.slice(err.position);
    } else {
      result = result.slice(0, err.position) + err.suggestion + result.slice(err.position + err.length);
    }
  }

  return result;
}

function calculateScore(text: string, errors: GrammarError[]): GrammarScore {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const sentenceCount = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;

  if (wordCount === 0) {
    return { grammar: 0, structure: 0, vocabulary: 0, overall: 0 };
  }

  // 文法分數：根據錯誤密度
  const grammarErrors = errors.filter((e) =>
    ["be_verb", "has_have", "third_person_s", "article_a", "article_an", "irregular_verb", "double_negative", "pronoun_i"].includes(e.rule)
  ).length;
  const grammarRatio = grammarErrors / wordCount;
  const grammar = Math.max(0, Math.round(100 - grammarRatio * 300));

  // 結構分數
  const structureErrors = errors.filter((e) =>
    ["capitalization", "punctuation", "repeated_word"].includes(e.rule)
  ).length;
  const structureBase = sentenceCount >= 3 ? 80 : sentenceCount >= 2 ? 60 : 40;
  const structure = Math.max(0, Math.min(100, structureBase + 20 - structureErrors * 15));

  // 詞彙分數：根據字數和拼寫錯誤
  const spellingErrors = errors.filter((e) => e.rule === "spelling").length;
  const vocabBase = wordCount >= 50 ? 90 : wordCount >= 30 ? 75 : wordCount >= 15 ? 60 : 40;
  const vocabulary = Math.max(0, Math.min(100, vocabBase - spellingErrors * 10));

  // 整體分數
  const overall = Math.round(grammar * 0.4 + structure * 0.3 + vocabulary * 0.3);

  return { grammar, structure, vocabulary, overall };
}

// ===== 寫作題目產生器 =====

export interface WritingPrompt {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  level: string;
  hints: string[];
  hintsZh: string[];
}

export const writingPrompts: WritingPrompt[] = [
  {
    id: "my_family",
    title: "My Family",
    titleZh: "我的家庭",
    description: "Write about your family. Who are they? What do they look like? What do they like to do?",
    descriptionZh: "寫一篇關於你的家庭的文章。他們是誰？長什麼樣子？喜歡做什麼？",
    level: "LEVEL1",
    hints: ["I have...", "My mom/dad is...", "We like to..."],
    hintsZh: ["我有...", "我的媽媽/爸爸是...", "我們喜歡..."],
  },
  {
    id: "my_day",
    title: "What I Did Today",
    titleZh: "我今天做了什麼",
    description: "Write about what you did today from morning to night.",
    descriptionZh: "寫一篇關於你今天從早到晚做了什麼事情的文章。",
    level: "LEVEL1",
    hints: ["I woke up at...", "Then I...", "After that, I...", "At night, I..."],
    hintsZh: ["我...點起床", "然後我...", "之後我...", "晚上我..."],
  },
  {
    id: "my_pet",
    title: "My Pet",
    titleZh: "我的寵物",
    description: "Write about your pet (or a pet you want). What is it? What does it look like? What does it do?",
    descriptionZh: "寫一篇關於你的寵物（或你想要的寵物）的文章。",
    level: "LEVEL1",
    hints: ["I have a...", "It is...", "It likes to...", "I love my..."],
    hintsZh: ["我有一隻...", "牠是...", "牠喜歡...", "我愛我的..."],
  },
  {
    id: "favorite_food",
    title: "My Favorite Food",
    titleZh: "我最喜歡的食物",
    description: "Write about your favorite food. What is it? Why do you like it? When do you eat it?",
    descriptionZh: "寫一篇關於你最喜歡的食物的文章。是什麼？為什麼喜歡？什麼時候吃？",
    level: "LEVEL2",
    hints: ["My favorite food is...", "I like it because...", "It tastes...", "I usually eat it..."],
    hintsZh: ["我最喜歡的食物是...", "我喜歡它因為...", "它嚐起來...", "我通常在...吃它"],
  },
  {
    id: "best_friend",
    title: "My Best Friend",
    titleZh: "我最好的朋友",
    description: "Write about your best friend. Who are they? What do you do together?",
    descriptionZh: "寫一篇關於你最好的朋友的文章。他是誰？你們一起做什麼？",
    level: "LEVEL2",
    hints: ["My best friend is...", "We like to...", "He/She is...", "We always..."],
    hintsZh: ["我最好的朋友是...", "我們喜歡...", "他/她是...", "我們總是..."],
  },
  {
    id: "dream_job",
    title: "My Dream Job",
    titleZh: "我的夢想工作",
    description: "Write about what you want to be when you grow up. Why? What will you do?",
    descriptionZh: "寫一篇關於你長大後想做什麼工作的文章。為什麼？你會做什麼？",
    level: "LEVEL3",
    hints: ["When I grow up, I want to be...", "I like this job because...", "I will...", "I think it is..."],
    hintsZh: ["我長大後想成為...", "我喜歡這份工作因為...", "我會...", "我覺得它..."],
  },
  {
    id: "weekend_plan",
    title: "My Weekend",
    titleZh: "我的週末",
    description: "Write about what you usually do on weekends, or plan for this weekend.",
    descriptionZh: "寫一篇關於你週末通常做什麼，或這個週末的計畫。",
    level: "LEVEL2",
    hints: ["On weekends, I...", "In the morning, I...", "In the afternoon, I...", "I feel..."],
    hintsZh: ["在週末，我...", "早上我...", "下午我...", "我覺得..."],
  },
  {
    id: "school_life",
    title: "My School",
    titleZh: "我的學校",
    description: "Write about your school. What subjects do you like? What do you do at school?",
    descriptionZh: "寫一篇關於你學校的文章。喜歡什麼科目？在學校做什麼？",
    level: "LEVEL2",
    hints: ["My school is...", "I like... class.", "My teacher is...", "At school, I..."],
    hintsZh: ["我的學校是...", "我喜歡...課", "我的老師是...", "在學校，我..."],
  },
];
