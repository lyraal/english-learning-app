/**
 * 單字 Emoji 對應表 — 約 120 個常見單字
 * 用於單字練習的圖片配對和文章閱讀的查詞卡片
 */

export const WORD_EMOJI_MAP: Record<string, { emoji: string; color: string }> = {
  // 動物
  cat: { emoji: "🐱", color: "#FF9800" },
  dog: { emoji: "🐕", color: "#8D6E63" },
  fish: { emoji: "🐟", color: "#2196F3" },
  bird: { emoji: "🐦", color: "#4CAF50" },
  rabbit: { emoji: "🐰", color: "#E91E63" },
  bear: { emoji: "🐻", color: "#795548" },
  monkey: { emoji: "🐵", color: "#FF5722" },
  elephant: { emoji: "🐘", color: "#607D8B" },
  lion: { emoji: "🦁", color: "#FFC107" },
  tiger: { emoji: "🐯", color: "#FF9800" },
  pig: { emoji: "🐷", color: "#F48FB1" },
  cow: { emoji: "🐮", color: "#6D4C41" },
  horse: { emoji: "🐴", color: "#8D6E63" },
  duck: { emoji: "🦆", color: "#4CAF50" },
  frog: { emoji: "🐸", color: "#4CAF50" },
  snake: { emoji: "🐍", color: "#388E3C" },
  butterfly: { emoji: "🦋", color: "#9C27B0" },
  bee: { emoji: "🐝", color: "#FFC107" },
  ant: { emoji: "🐜", color: "#5D4037" },

  // 食物
  apple: { emoji: "🍎", color: "#F44336" },
  banana: { emoji: "🍌", color: "#FFEB3B" },
  orange: { emoji: "🍊", color: "#FF9800" },
  grape: { emoji: "🍇", color: "#9C27B0" },
  watermelon: { emoji: "🍉", color: "#4CAF50" },
  strawberry: { emoji: "🍓", color: "#E91E63" },
  bread: { emoji: "🍞", color: "#FFC107" },
  cake: { emoji: "🎂", color: "#E91E63" },
  pizza: { emoji: "🍕", color: "#FF9800" },
  rice: { emoji: "🍚", color: "#FAFAFA" },
  egg: { emoji: "🥚", color: "#FFF9C4" },
  milk: { emoji: "🥛", color: "#FAFAFA" },
  water: { emoji: "💧", color: "#2196F3" },
  juice: { emoji: "🧃", color: "#FF9800" },
  ice_cream: { emoji: "🍦", color: "#E91E63" },
  chocolate: { emoji: "🍫", color: "#6D4C41" },
  candy: { emoji: "🍬", color: "#E91E63" },
  cookie: { emoji: "🍪", color: "#FFC107" },
  noodles: { emoji: "🍜", color: "#FF9800" },
  chicken: { emoji: "🍗", color: "#FF9800" },

  // 家人
  family: { emoji: "👨‍👩‍👧‍👦", color: "#2196F3" },
  father: { emoji: "👨", color: "#2196F3" },
  dad: { emoji: "👨", color: "#2196F3" },
  mother: { emoji: "👩", color: "#E91E63" },
  mom: { emoji: "👩", color: "#E91E63" },
  brother: { emoji: "👦", color: "#2196F3" },
  sister: { emoji: "👧", color: "#E91E63" },
  baby: { emoji: "👶", color: "#FFC107" },
  grandpa: { emoji: "👴", color: "#607D8B" },
  grandma: { emoji: "👵", color: "#9C27B0" },

  // 學校
  school: { emoji: "🏫", color: "#FF5722" },
  teacher: { emoji: "👩‍🏫", color: "#9C27B0" },
  student: { emoji: "👨‍🎓", color: "#2196F3" },
  book: { emoji: "📖", color: "#FF9800" },
  pen: { emoji: "🖊️", color: "#2196F3" },
  pencil: { emoji: "✏️", color: "#FFC107" },
  ruler: { emoji: "📏", color: "#607D8B" },
  bag: { emoji: "🎒", color: "#F44336" },
  desk: { emoji: "🪑", color: "#795548" },
  homework: { emoji: "📝", color: "#4CAF50" },

  // 身體
  head: { emoji: "🧑", color: "#FFC107" },
  eye: { emoji: "👁️", color: "#2196F3" },
  nose: { emoji: "👃", color: "#FF9800" },
  mouth: { emoji: "👄", color: "#E91E63" },
  ear: { emoji: "👂", color: "#FF9800" },
  hand: { emoji: "✋", color: "#FFC107" },
  foot: { emoji: "🦶", color: "#FF9800" },

  // 天氣和自然
  sun: { emoji: "☀️", color: "#FFC107" },
  moon: { emoji: "🌙", color: "#FFC107" },
  star: { emoji: "⭐", color: "#FFC107" },
  rain: { emoji: "🌧️", color: "#607D8B" },
  snow: { emoji: "❄️", color: "#B3E5FC" },
  cloud: { emoji: "☁️", color: "#90A4AE" },
  wind: { emoji: "💨", color: "#B0BEC5" },
  tree: { emoji: "🌳", color: "#4CAF50" },
  flower: { emoji: "🌸", color: "#E91E63" },
  mountain: { emoji: "⛰️", color: "#607D8B" },
  river: { emoji: "🏞️", color: "#2196F3" },
  ocean: { emoji: "🌊", color: "#1565C0" },
  spring: { emoji: "🌸", color: "#E91E63" },
  summer: { emoji: "☀️", color: "#FFC107" },
  autumn: { emoji: "🍂", color: "#FF9800" },
  fall: { emoji: "🍂", color: "#FF9800" },
  winter: { emoji: "❄️", color: "#B3E5FC" },

  // 交通
  car: { emoji: "🚗", color: "#F44336" },
  bus: { emoji: "🚌", color: "#FFC107" },
  bike: { emoji: "🚲", color: "#4CAF50" },
  airplane: { emoji: "✈️", color: "#2196F3" },
  train: { emoji: "🚂", color: "#607D8B" },
  boat: { emoji: "⛵", color: "#2196F3" },

  // 地方
  house: { emoji: "🏠", color: "#FF9800" },
  home: { emoji: "🏠", color: "#FF9800" },
  park: { emoji: "🌳", color: "#4CAF50" },
  hospital: { emoji: "🏥", color: "#F44336" },
  library: { emoji: "📚", color: "#795548" },
  zoo: { emoji: "🦁", color: "#FF9800" },
  store: { emoji: "🏪", color: "#2196F3" },
  restaurant: { emoji: "🍽️", color: "#E91E63" },

  // 物品
  phone: { emoji: "📱", color: "#607D8B" },
  computer: { emoji: "💻", color: "#2196F3" },
  clock: { emoji: "🕐", color: "#607D8B" },
  key: { emoji: "🔑", color: "#FFC107" },
  door: { emoji: "🚪", color: "#795548" },
  ball: { emoji: "⚽", color: "#4CAF50" },
  toy: { emoji: "🧸", color: "#FF9800" },
  gift: { emoji: "🎁", color: "#F44336" },

  // 動作/形容詞
  happy: { emoji: "😊", color: "#FFC107" },
  sad: { emoji: "😢", color: "#2196F3" },
  big: { emoji: "🔴", color: "#F44336" },
  small: { emoji: "🔵", color: "#2196F3" },
  hot: { emoji: "🔥", color: "#F44336" },
  cold: { emoji: "🧊", color: "#B3E5FC" },
  fast: { emoji: "⚡", color: "#FFC107" },
  slow: { emoji: "🐢", color: "#4CAF50" },
  love: { emoji: "❤️", color: "#E91E63" },
  like: { emoji: "👍", color: "#2196F3" },
};

// 文章分類圖示
export const CATEGORY_ICONS: Record<string, { emoji: string; label: string }> = {
  daily_life: { emoji: "🏠", label: "日常生活" },
  school: { emoji: "🏫", label: "學校" },
  nature: { emoji: "🌿", label: "自然" },
  food: { emoji: "🍕", label: "美食" },
  animals: { emoji: "🐾", label: "動物" },
  travel: { emoji: "✈️", label: "旅行" },
  technology: { emoji: "💻", label: "科技" },
  culture: { emoji: "🎭", label: "文化" },
  environment: { emoji: "🌍", label: "環境" },
  health: { emoji: "🏥", label: "健康" },
  sports: { emoji: "⚽", label: "運動" },
  career: { emoji: "💼", label: "職業" },
};

/**
 * 取得單字對應的 emoji（模糊匹配）
 */
export function getWordEmoji(word: string): { emoji: string; color: string } | null {
  const lower = word.toLowerCase().trim();

  // 精確匹配
  if (WORD_EMOJI_MAP[lower]) return WORD_EMOJI_MAP[lower];

  // 去除 s 複數
  if (lower.endsWith("s") && WORD_EMOJI_MAP[lower.slice(0, -1)]) {
    return WORD_EMOJI_MAP[lower.slice(0, -1)];
  }

  // 去除 es 複數
  if (lower.endsWith("es") && WORD_EMOJI_MAP[lower.slice(0, -2)]) {
    return WORD_EMOJI_MAP[lower.slice(0, -2)];
  }

  return null;
}

/**
 * 取得分類圖示
 */
export function getCategoryIcon(category: string): { emoji: string; label: string } {
  return CATEGORY_ICONS[category] || { emoji: "📖", label: "一般" };
}
