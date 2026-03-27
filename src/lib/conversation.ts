/**
 * AI 對話練習引擎 — 用對話樹 + 關鍵字匹配
 * 不依賴外部 AI API
 */

export interface DialogNode {
  id: string;
  aiMessage: string;
  aiMessageZh: string;
  /** 關鍵字 → 下一個節點 ID 的映射 */
  responses: { keywords: string[]; nextId: string; }[];
  /** 找不到匹配時的預設下一個節點 */
  fallbackId?: string;
  /** 是否為結束節點 */
  isEnd?: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  titleZh: string;
  icon: string;
  aiRole: string;
  aiRoleZh: string;
  userRole: string;
  userRoleZh: string;
  starterMessage: string;
  starterMessageZh: string;
  vocabulary: { word: string; meaning: string }[];
  level: "easy" | "medium" | "hard";
  dialogTree: DialogNode[];
}

// ===== 6 個情境 =====

const storeScenario: Scenario = {
  id: "store",
  title: "At the Store",
  titleZh: "在商店買東西",
  icon: "🏪",
  aiRole: "Store Clerk",
  aiRoleZh: "店員",
  userRole: "Customer",
  userRoleZh: "顧客",
  starterMessage: "Welcome to our store! How can I help you today?",
  starterMessageZh: "歡迎來到我們的商店！今天需要什麼幫助嗎？",
  vocabulary: [
    { word: "buy", meaning: "買" },
    { word: "how much", meaning: "多少錢" },
    { word: "please", meaning: "請" },
    { word: "thank you", meaning: "謝謝" },
    { word: "bag", meaning: "袋子" },
  ],
  level: "easy",
  dialogTree: [
    {
      id: "start",
      aiMessage: "Welcome to our store! How can I help you today?",
      aiMessageZh: "歡迎來到我們的商店！今天需要什麼幫助嗎？",
      responses: [
        { keywords: ["buy", "want", "need", "looking", "get"], nextId: "what_item" },
        { keywords: ["how much", "price", "cost", "money"], nextId: "ask_what_price" },
        { keywords: ["hello", "hi", "hey"], nextId: "greet_back" },
      ],
      fallbackId: "hint_buy",
    },
    {
      id: "greet_back",
      aiMessage: "Hi there! Are you looking for something special today?",
      aiMessageZh: "嗨！你今天在找什麼特別的東西嗎？",
      responses: [
        { keywords: ["buy", "want", "need", "looking", "get", "yes"], nextId: "what_item" },
        { keywords: ["no", "just looking", "browse"], nextId: "just_looking" },
      ],
      fallbackId: "what_item",
    },
    {
      id: "hint_buy",
      aiMessage: "Would you like to buy something? You can say: 'I want to buy...' or 'I'm looking for...'",
      aiMessageZh: "你想買什麼嗎？你可以說：'I want to buy...' 或 'I'm looking for...'",
      responses: [
        { keywords: ["buy", "want", "need", "looking", "get"], nextId: "what_item" },
      ],
      fallbackId: "what_item",
    },
    {
      id: "just_looking",
      aiMessage: "No problem! Take your time. We have snacks, drinks, and toys. Let me know if you need anything!",
      aiMessageZh: "沒問題！慢慢看。我們有零食、飲料和玩具。需要什麼跟我說！",
      responses: [
        { keywords: ["snack", "candy", "chocolate", "chip", "cookie"], nextId: "show_snacks" },
        { keywords: ["drink", "water", "juice", "milk"], nextId: "show_drinks" },
        { keywords: ["toy", "game", "ball"], nextId: "show_toys" },
        { keywords: ["buy", "want", "get", "this"], nextId: "what_item" },
      ],
      fallbackId: "what_item",
    },
    {
      id: "what_item",
      aiMessage: "Sure! What would you like to buy? We have snacks, drinks, and toys!",
      aiMessageZh: "好的！你想買什麼？我們有零食、飲料和玩具！",
      responses: [
        { keywords: ["snack", "candy", "chocolate", "chip", "cookie"], nextId: "show_snacks" },
        { keywords: ["drink", "water", "juice", "milk"], nextId: "show_drinks" },
        { keywords: ["toy", "game", "ball"], nextId: "show_toys" },
        { keywords: ["pencil", "pen", "eraser", "notebook", "book"], nextId: "show_school" },
      ],
      fallbackId: "pick_category",
    },
    {
      id: "pick_category",
      aiMessage: "Hmm, I'm not sure we have that. But we have snacks, drinks, and toys. Which one do you want?",
      aiMessageZh: "嗯，我不確定我們有那個。但我們有零食、飲料和玩具。你想看哪一種？",
      responses: [
        { keywords: ["snack", "candy", "chocolate", "chip", "food", "eat"], nextId: "show_snacks" },
        { keywords: ["drink", "water", "juice"], nextId: "show_drinks" },
        { keywords: ["toy", "game"], nextId: "show_toys" },
      ],
      fallbackId: "show_snacks",
    },
    {
      id: "show_snacks",
      aiMessage: "We have chocolate for $2, cookies for $3, and chips for $1.50. Which one would you like?",
      aiMessageZh: "我們有巧克力 $2、餅乾 $3 和洋芋片 $1.50。你想要哪一個？",
      responses: [
        { keywords: ["chocolate"], nextId: "buy_chocolate" },
        { keywords: ["cookie"], nextId: "buy_cookie" },
        { keywords: ["chip"], nextId: "buy_chips" },
        { keywords: ["all", "everything", "each"], nextId: "buy_all_snacks" },
      ],
      fallbackId: "buy_chocolate",
    },
    {
      id: "show_drinks",
      aiMessage: "We have orange juice for $2, milk for $1.50, and water for $1. What would you like?",
      aiMessageZh: "我們有柳橙汁 $2、牛奶 $1.50 和水 $1。你想要什麼？",
      responses: [
        { keywords: ["juice", "orange"], nextId: "buy_juice" },
        { keywords: ["milk"], nextId: "buy_milk" },
        { keywords: ["water"], nextId: "buy_water" },
      ],
      fallbackId: "buy_juice",
    },
    {
      id: "show_toys",
      aiMessage: "We have teddy bears, toy cars, and puzzles. They are all $5. Do you want one?",
      aiMessageZh: "我們有泰迪熊、玩具車和拼圖。都是 $5。你想要一個嗎？",
      responses: [
        { keywords: ["bear", "teddy"], nextId: "buy_toy" },
        { keywords: ["car"], nextId: "buy_toy" },
        { keywords: ["puzzle"], nextId: "buy_toy" },
        { keywords: ["yes", "want", "ok", "sure"], nextId: "buy_toy" },
        { keywords: ["no", "don't", "not"], nextId: "anything_else" },
      ],
      fallbackId: "buy_toy",
    },
    {
      id: "show_school",
      aiMessage: "Great! We have pencils for $0.50, erasers for $0.30, and notebooks for $2. What do you need?",
      aiMessageZh: "太好了！我們有鉛筆 $0.50、橡皮擦 $0.30 和筆記本 $2。你需要什麼？",
      responses: [
        { keywords: ["pencil", "pen"], nextId: "buy_pencil" },
        { keywords: ["eraser"], nextId: "buy_eraser" },
        { keywords: ["notebook", "book"], nextId: "buy_notebook" },
      ],
      fallbackId: "buy_pencil",
    },
    {
      id: "buy_chocolate",
      aiMessage: "Good choice! One chocolate is $2. Do you need anything else?",
      aiMessageZh: "好選擇！一個巧克力 $2。你還需要別的嗎？",
      responses: [
        { keywords: ["yes", "more", "also", "and"], nextId: "what_item" },
        { keywords: ["no", "that's all", "enough", "done", "nothing"], nextId: "checkout" },
        { keywords: ["bag", "plastic"], nextId: "offer_bag" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "buy_cookie",
      aiMessage: "Yummy! One cookie pack is $3. Do you need anything else?",
      aiMessageZh: "好吃！一包餅乾 $3。你還需要別的嗎？",
      responses: [
        { keywords: ["yes", "more", "also", "and"], nextId: "what_item" },
        { keywords: ["no", "that's all", "enough", "done"], nextId: "checkout" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "buy_chips",
      aiMessage: "Nice! One bag of chips is $1.50. Do you need anything else?",
      aiMessageZh: "不錯！一包洋芋片 $1.50。你還需要別的嗎？",
      responses: [
        { keywords: ["yes", "more", "also"], nextId: "what_item" },
        { keywords: ["no", "that's all", "enough"], nextId: "checkout" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "buy_all_snacks",
      aiMessage: "Wow, you want all the snacks! That will be $6.50 total. Would you like a bag?",
      aiMessageZh: "哇，你全部都要！總共 $6.50。你要袋子嗎？",
      responses: [
        { keywords: ["yes", "please", "bag", "ok"], nextId: "bag_yes" },
        { keywords: ["no", "don't"], nextId: "checkout" },
      ],
      fallbackId: "bag_yes",
    },
    {
      id: "buy_juice",
      aiMessage: "One orange juice, $2. Anything else?",
      aiMessageZh: "一杯柳橙汁，$2。還要別的嗎？",
      responses: [
        { keywords: ["yes", "more", "also"], nextId: "what_item" },
        { keywords: ["no", "that's all"], nextId: "checkout" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "buy_milk",
      aiMessage: "One milk, $1.50. Would you like anything else?",
      aiMessageZh: "一瓶牛奶，$1.50。還需要別的嗎？",
      responses: [
        { keywords: ["yes", "more"], nextId: "what_item" },
        { keywords: ["no", "that's all"], nextId: "checkout" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "buy_water",
      aiMessage: "One water, $1. Do you want anything else?",
      aiMessageZh: "一瓶水，$1。還要別的嗎？",
      responses: [
        { keywords: ["yes", "more"], nextId: "what_item" },
        { keywords: ["no", "that's all"], nextId: "checkout" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "buy_toy",
      aiMessage: "Great pick! That's $5. Would you like a bag for it?",
      aiMessageZh: "好選擇！$5。你要袋子嗎？",
      responses: [
        { keywords: ["yes", "please", "bag"], nextId: "bag_yes" },
        { keywords: ["no", "don't"], nextId: "checkout" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "buy_pencil",
      aiMessage: "Here is your pencil! That's $0.50. Anything else?",
      aiMessageZh: "這是你的鉛筆！$0.50。還要別的嗎？",
      responses: [
        { keywords: ["yes", "more"], nextId: "what_item" },
        { keywords: ["no", "that's all"], nextId: "checkout" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "buy_eraser",
      aiMessage: "Here you go! One eraser, $0.30. Do you need anything else?",
      aiMessageZh: "給你！一個橡皮擦，$0.30。還需要別的嗎？",
      responses: [
        { keywords: ["yes"], nextId: "what_item" },
        { keywords: ["no", "that's all"], nextId: "checkout" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "buy_notebook",
      aiMessage: "One notebook, $2. Would you like anything else?",
      aiMessageZh: "一本筆記本，$2。還需要別的嗎？",
      responses: [
        { keywords: ["yes"], nextId: "what_item" },
        { keywords: ["no"], nextId: "checkout" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "ask_what_price",
      aiMessage: "What item are you asking about? We have snacks, drinks, and toys!",
      aiMessageZh: "你在問哪個東西的價格？我們有零食、飲料和玩具！",
      responses: [
        { keywords: ["snack", "candy", "chocolate", "chip", "cookie"], nextId: "show_snacks" },
        { keywords: ["drink", "water", "juice", "milk"], nextId: "show_drinks" },
        { keywords: ["toy"], nextId: "show_toys" },
      ],
      fallbackId: "what_item",
    },
    {
      id: "offer_bag",
      aiMessage: "Sure! I'll put it in a bag for you. That's $0.10 extra. Is that OK?",
      aiMessageZh: "好的！我幫你裝袋。多 $0.10。可以嗎？",
      responses: [
        { keywords: ["yes", "ok", "sure", "fine"], nextId: "bag_yes" },
        { keywords: ["no", "don't"], nextId: "checkout" },
      ],
      fallbackId: "bag_yes",
    },
    {
      id: "bag_yes",
      aiMessage: "OK! Here is your bag. Let me ring you up!",
      aiMessageZh: "好的！這是你的袋子。讓我幫你結帳！",
      responses: [
        { keywords: ["thank", "thanks", "ok", "great", "pay", "yes"], nextId: "checkout" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "anything_else",
      aiMessage: "OK! Do you want to look at something else, or are you ready to pay?",
      aiMessageZh: "好的！你要看看別的，還是準備結帳了？",
      responses: [
        { keywords: ["look", "more", "yes", "something"], nextId: "what_item" },
        { keywords: ["pay", "ready", "done", "no", "checkout"], nextId: "checkout" },
      ],
      fallbackId: "checkout",
    },
    {
      id: "checkout",
      aiMessage: "Here you go! Thank you for shopping with us. Have a great day! Goodbye!",
      aiMessageZh: "給你！謝謝你來我們這裡買東西。祝你有美好的一天！再見！",
      responses: [],
      isEnd: true,
    },
  ],
};

const foodScenario: Scenario = {
  id: "food",
  title: "Ordering Food",
  titleZh: "點餐",
  icon: "🍕",
  aiRole: "Waiter",
  aiRoleZh: "服務生",
  userRole: "Customer",
  userRoleZh: "顧客",
  starterMessage: "Welcome to Sunny Restaurant! Here is our menu. What would you like to order?",
  starterMessageZh: "歡迎來到陽光餐廳！這是我們的菜單。你想點什麼？",
  vocabulary: [
    { word: "order", meaning: "點餐" },
    { word: "menu", meaning: "菜單" },
    { word: "delicious", meaning: "好吃的" },
    { word: "drink", meaning: "飲料" },
    { word: "dessert", meaning: "甜點" },
  ],
  level: "easy",
  dialogTree: [
    {
      id: "start",
      aiMessage: "Welcome to Sunny Restaurant! Here is our menu. What would you like to order?",
      aiMessageZh: "歡迎來到陽光餐廳！這是我們的菜單。你想點什麼？",
      responses: [
        { keywords: ["pizza", "burger", "sandwich", "pasta", "noodle", "rice", "chicken", "fish"], nextId: "main_dish" },
        { keywords: ["menu", "what", "have", "recommend", "special"], nextId: "show_menu" },
        { keywords: ["drink", "juice", "water", "milk", "soda", "tea"], nextId: "pick_drink" },
        { keywords: ["hello", "hi"], nextId: "greet_food" },
      ],
      fallbackId: "show_menu",
    },
    {
      id: "greet_food",
      aiMessage: "Hello! Nice to see you! Would you like to see our menu?",
      aiMessageZh: "你好！很高興見到你！要看看菜單嗎？",
      responses: [
        { keywords: ["yes", "please", "ok", "sure", "menu"], nextId: "show_menu" },
        { keywords: ["pizza", "burger", "chicken", "fish", "noodle"], nextId: "main_dish" },
      ],
      fallbackId: "show_menu",
    },
    {
      id: "show_menu",
      aiMessage: "We have: Pizza, Chicken Nuggets, Fish and Chips, and Pasta. All come with a free drink! What sounds good?",
      aiMessageZh: "我們有：披薩、雞塊、炸魚薯條和義大利麵。都附免費飲料！你想吃什麼？",
      responses: [
        { keywords: ["pizza"], nextId: "order_pizza" },
        { keywords: ["chicken", "nugget"], nextId: "order_chicken" },
        { keywords: ["fish", "chip"], nextId: "order_fish" },
        { keywords: ["pasta", "noodle", "spaghetti"], nextId: "order_pasta" },
      ],
      fallbackId: "main_dish",
    },
    {
      id: "main_dish",
      aiMessage: "Good choice! What size would you like — small, medium, or large?",
      aiMessageZh: "好選擇！你要什麼大小 — 小、中還是大？",
      responses: [
        { keywords: ["small", "little"], nextId: "pick_drink" },
        { keywords: ["medium", "regular", "normal"], nextId: "pick_drink" },
        { keywords: ["large", "big"], nextId: "pick_drink" },
      ],
      fallbackId: "pick_drink",
    },
    {
      id: "order_pizza",
      aiMessage: "Great! We have cheese pizza and pepperoni pizza. Which one do you want?",
      aiMessageZh: "太好了！我們有起司披薩和臘腸披薩。你要哪一種？",
      responses: [
        { keywords: ["cheese"], nextId: "pick_drink" },
        { keywords: ["pepperoni"], nextId: "pick_drink" },
        { keywords: ["both", "all"], nextId: "pick_drink" },
      ],
      fallbackId: "pick_drink",
    },
    {
      id: "order_chicken",
      aiMessage: "Yum! How many chicken nuggets? We have 6 pieces or 10 pieces.",
      aiMessageZh: "好吃！你要幾塊雞塊？我們有 6 塊或 10 塊。",
      responses: [
        { keywords: ["6", "six", "small"], nextId: "pick_drink" },
        { keywords: ["10", "ten", "big", "large", "more"], nextId: "pick_drink" },
      ],
      fallbackId: "pick_drink",
    },
    {
      id: "order_fish",
      aiMessage: "Fish and Chips! Would you like ketchup or tartar sauce with that?",
      aiMessageZh: "炸魚薯條！你要番茄醬還是塔塔醬？",
      responses: [
        { keywords: ["ketchup", "tomato"], nextId: "pick_drink" },
        { keywords: ["tartar", "white"], nextId: "pick_drink" },
        { keywords: ["both", "all"], nextId: "pick_drink" },
        { keywords: ["no", "none", "nothing"], nextId: "pick_drink" },
      ],
      fallbackId: "pick_drink",
    },
    {
      id: "order_pasta",
      aiMessage: "Pasta! Do you want tomato sauce or cream sauce?",
      aiMessageZh: "義大利麵！你要番茄醬還是奶油醬？",
      responses: [
        { keywords: ["tomato", "red"], nextId: "pick_drink" },
        { keywords: ["cream", "white"], nextId: "pick_drink" },
      ],
      fallbackId: "pick_drink",
    },
    {
      id: "pick_drink",
      aiMessage: "Now for your free drink! We have orange juice, apple juice, milk, and water. What would you like?",
      aiMessageZh: "現在選你的免費飲料！我們有柳橙汁、蘋果汁、牛奶和水。你想要什麼？",
      responses: [
        { keywords: ["orange"], nextId: "dessert_ask" },
        { keywords: ["apple"], nextId: "dessert_ask" },
        { keywords: ["milk"], nextId: "dessert_ask" },
        { keywords: ["water"], nextId: "dessert_ask" },
      ],
      fallbackId: "dessert_ask",
    },
    {
      id: "dessert_ask",
      aiMessage: "Would you like to add a dessert? We have ice cream and chocolate cake!",
      aiMessageZh: "你想加一份甜點嗎？我們有冰淇淋和巧克力蛋糕！",
      responses: [
        { keywords: ["ice cream", "ice", "cream"], nextId: "ice_cream_flavor" },
        { keywords: ["cake", "chocolate"], nextId: "confirm_order" },
        { keywords: ["no", "don't", "not", "enough", "full"], nextId: "confirm_order" },
        { keywords: ["yes", "sure", "ok"], nextId: "ice_cream_flavor" },
      ],
      fallbackId: "confirm_order",
    },
    {
      id: "ice_cream_flavor",
      aiMessage: "What flavor of ice cream? We have vanilla, chocolate, and strawberry!",
      aiMessageZh: "你要什麼口味的冰淇淋？我們有香草、巧克力和草莓！",
      responses: [
        { keywords: ["vanilla"], nextId: "confirm_order" },
        { keywords: ["chocolate"], nextId: "confirm_order" },
        { keywords: ["strawberry"], nextId: "confirm_order" },
      ],
      fallbackId: "confirm_order",
    },
    {
      id: "confirm_order",
      aiMessage: "Your order is ready! Is there anything else you'd like?",
      aiMessageZh: "你的餐點準備好了！還需要別的嗎？",
      responses: [
        { keywords: ["no", "that's all", "done", "nothing", "good"], nextId: "goodbye_food" },
        { keywords: ["yes", "more", "also", "and"], nextId: "show_menu" },
      ],
      fallbackId: "goodbye_food",
    },
    {
      id: "goodbye_food",
      aiMessage: "Your food will be ready soon! Enjoy your meal! Thank you for coming!",
      aiMessageZh: "你的餐點馬上就好！用餐愉快！謝謝你的光臨！",
      responses: [],
      isEnd: true,
    },
  ],
};

const schoolScenario: Scenario = {
  id: "school",
  title: "At School",
  titleZh: "在學校",
  icon: "🏫",
  aiRole: "Classmate",
  aiRoleZh: "同學",
  userRole: "Student",
  userRoleZh: "學生",
  starterMessage: "Hey! Good morning! Did you do the homework last night?",
  starterMessageZh: "嘿！早安！你昨晚有寫作業嗎？",
  vocabulary: [
    { word: "homework", meaning: "作業" },
    { word: "subject", meaning: "科目" },
    { word: "teacher", meaning: "老師" },
    { word: "recess", meaning: "下課時間" },
    { word: "favorite", meaning: "最喜歡的" },
  ],
  level: "easy",
  dialogTree: [
    {
      id: "start",
      aiMessage: "Hey! Good morning! Did you do the homework last night?",
      aiMessageZh: "嘿！早安！你昨晚有寫作業嗎？",
      responses: [
        { keywords: ["yes", "did", "finished", "done", "completed"], nextId: "hw_yes" },
        { keywords: ["no", "didn't", "forgot", "not"], nextId: "hw_no" },
        { keywords: ["hard", "difficult", "help"], nextId: "hw_hard" },
        { keywords: ["morning", "hello", "hi", "hey"], nextId: "greet_school" },
      ],
      fallbackId: "hw_yes",
    },
    {
      id: "greet_school",
      aiMessage: "Good morning! So, did you finish the homework? I thought it was pretty easy!",
      aiMessageZh: "早安！所以你寫完作業了嗎？我覺得蠻簡單的！",
      responses: [
        { keywords: ["yes", "easy", "did", "finished"], nextId: "hw_yes" },
        { keywords: ["no", "didn't", "hard"], nextId: "hw_no" },
      ],
      fallbackId: "hw_yes",
    },
    {
      id: "hw_yes",
      aiMessage: "Nice! Me too. What is your favorite subject? Mine is math!",
      aiMessageZh: "不錯！我也是。你最喜歡什麼科目？我最喜歡數學！",
      responses: [
        { keywords: ["math", "maths"], nextId: "same_subject" },
        { keywords: ["english", "reading", "writing"], nextId: "english_subject" },
        { keywords: ["science"], nextId: "science_subject" },
        { keywords: ["art", "music", "pe", "sports", "gym"], nextId: "fun_subject" },
      ],
      fallbackId: "any_subject",
    },
    {
      id: "hw_no",
      aiMessage: "Oh no! Maybe you can do it during recess. What subject was it for?",
      aiMessageZh: "哦不！也許你可以下課的時候寫。是哪個科目的作業？",
      responses: [
        { keywords: ["math"], nextId: "same_subject" },
        { keywords: ["english", "reading", "writing"], nextId: "english_subject" },
        { keywords: ["science"], nextId: "science_subject" },
        { keywords: ["don't know", "forgot", "remember"], nextId: "any_subject" },
      ],
      fallbackId: "any_subject",
    },
    {
      id: "hw_hard",
      aiMessage: "It was a little hard, right? I can help you! What part was difficult?",
      aiMessageZh: "有點難對吧？我可以幫你！哪個部分比較難？",
      responses: [
        { keywords: ["math", "number"], nextId: "same_subject" },
        { keywords: ["english", "word", "sentence"], nextId: "english_subject" },
        { keywords: ["all", "everything"], nextId: "any_subject" },
      ],
      fallbackId: "any_subject",
    },
    {
      id: "same_subject",
      aiMessage: "Math is fun! I like solving problems. Do you want to study together at recess?",
      aiMessageZh: "數學很好玩！我喜歡解題。你下課要一起唸書嗎？",
      responses: [
        { keywords: ["yes", "sure", "ok", "great", "let's"], nextId: "recess_plan" },
        { keywords: ["no", "play", "don't"], nextId: "recess_play" },
      ],
      fallbackId: "recess_plan",
    },
    {
      id: "english_subject",
      aiMessage: "English is cool! I like learning new words. What English word did you learn recently?",
      aiMessageZh: "英文很酷！我喜歡學新單字。你最近學了什麼英文字？",
      responses: [
        { keywords: ["*"], nextId: "nice_word" },
      ],
      fallbackId: "nice_word",
    },
    {
      id: "science_subject",
      aiMessage: "Science is awesome! We did an experiment last week. Did you like it?",
      aiMessageZh: "自然科學太棒了！我們上星期做了實驗。你喜歡嗎？",
      responses: [
        { keywords: ["yes", "like", "love", "fun", "cool"], nextId: "recess_plan" },
        { keywords: ["no", "boring", "don't"], nextId: "recess_play" },
      ],
      fallbackId: "recess_plan",
    },
    {
      id: "fun_subject",
      aiMessage: "That's such a fun subject! I wish we had more of it. What do you want to do at recess?",
      aiMessageZh: "那個科目好好玩！真希望上更多。你下課想做什麼？",
      responses: [
        { keywords: ["play", "run", "game", "ball", "tag", "jump"], nextId: "recess_play" },
        { keywords: ["study", "read", "homework", "library"], nextId: "recess_plan" },
        { keywords: ["talk", "chat", "friend"], nextId: "recess_talk" },
      ],
      fallbackId: "recess_play",
    },
    {
      id: "any_subject",
      aiMessage: "Every subject is interesting! What do you want to do during recess today?",
      aiMessageZh: "每個科目都很有趣！你今天下課想做什麼？",
      responses: [
        { keywords: ["play", "run", "game", "ball", "tag"], nextId: "recess_play" },
        { keywords: ["study", "read", "homework"], nextId: "recess_plan" },
        { keywords: ["talk", "chat"], nextId: "recess_talk" },
      ],
      fallbackId: "recess_play",
    },
    {
      id: "nice_word",
      aiMessage: "That's a cool word! I should learn it too. Hey, the bell is ringing. What do you want to do at recess?",
      aiMessageZh: "那是個好字！我也該學。嘿，鐘響了。你下課想做什麼？",
      responses: [
        { keywords: ["play", "run", "game", "ball"], nextId: "recess_play" },
        { keywords: ["study", "read", "homework"], nextId: "recess_plan" },
      ],
      fallbackId: "recess_play",
    },
    {
      id: "recess_plan",
      aiMessage: "Great! Let's go to the library together. We can study and then play after. See you!",
      aiMessageZh: "太好了！我們一起去圖書館吧。我們可以先讀書再去玩。待會見！",
      responses: [],
      isEnd: true,
    },
    {
      id: "recess_play",
      aiMessage: "Awesome! Let's play together! I love recess. See you on the playground!",
      aiMessageZh: "太棒了！我們一起玩！我最愛下課了。在操場見！",
      responses: [],
      isEnd: true,
    },
    {
      id: "recess_talk",
      aiMessage: "Sure! Let's chat and eat our snacks together. It's going to be a great day!",
      aiMessageZh: "好啊！我們一起聊天吃點心。今天會很棒！",
      responses: [],
      isEnd: true,
    },
  ],
};

const doctorScenario: Scenario = {
  id: "doctor",
  title: "At the Doctor",
  titleZh: "看醫生",
  icon: "🏥",
  aiRole: "Doctor",
  aiRoleZh: "醫生",
  userRole: "Patient",
  userRoleZh: "病人",
  starterMessage: "Hello! I'm Dr. Smith. What's the matter? How are you feeling today?",
  starterMessageZh: "你好！我是史密斯醫生。怎麼了？你今天感覺怎麼樣？",
  vocabulary: [
    { word: "headache", meaning: "頭痛" },
    { word: "stomach", meaning: "肚子" },
    { word: "fever", meaning: "發燒" },
    { word: "medicine", meaning: "藥" },
    { word: "rest", meaning: "休息" },
  ],
  level: "medium",
  dialogTree: [
    {
      id: "start",
      aiMessage: "Hello! I'm Dr. Smith. What's the matter? How are you feeling today?",
      aiMessageZh: "你好！我是史密斯醫生。怎麼了？你今天感覺怎麼樣？",
      responses: [
        { keywords: ["head", "headache"], nextId: "headache" },
        { keywords: ["stomach", "tummy", "belly", "hurt"], nextId: "stomachache" },
        { keywords: ["cough", "cold", "sneeze", "nose", "runny"], nextId: "cold" },
        { keywords: ["fever", "hot", "temperature"], nextId: "fever" },
        { keywords: ["sick", "bad", "not good", "terrible", "not well"], nextId: "what_symptom" },
        { keywords: ["hello", "hi", "good"], nextId: "greet_doctor" },
      ],
      fallbackId: "what_symptom",
    },
    {
      id: "greet_doctor",
      aiMessage: "Hello! It's nice to meet you. Can you tell me what's wrong? Where does it hurt?",
      aiMessageZh: "你好！很高興見到你。你可以告訴我哪裡不舒服嗎？",
      responses: [
        { keywords: ["head", "headache"], nextId: "headache" },
        { keywords: ["stomach", "tummy", "belly"], nextId: "stomachache" },
        { keywords: ["cough", "cold", "sneeze", "nose"], nextId: "cold" },
        { keywords: ["fever", "hot"], nextId: "fever" },
      ],
      fallbackId: "what_symptom",
    },
    {
      id: "what_symptom",
      aiMessage: "I'm sorry you're not feeling well. Can you tell me more? Do you have a headache, a stomachache, or a cough?",
      aiMessageZh: "你不舒服我很抱歉。能告訴我更多嗎？你是頭痛、肚子痛還是咳嗽？",
      responses: [
        { keywords: ["head", "headache"], nextId: "headache" },
        { keywords: ["stomach", "tummy", "belly"], nextId: "stomachache" },
        { keywords: ["cough", "cold", "sneeze", "throat", "nose"], nextId: "cold" },
        { keywords: ["fever", "hot"], nextId: "fever" },
      ],
      fallbackId: "headache",
    },
    {
      id: "headache",
      aiMessage: "I see, you have a headache. How long have you had it? Since this morning?",
      aiMessageZh: "我知道了，你頭痛。已經多久了？從今天早上開始的嗎？",
      responses: [
        { keywords: ["morning", "today", "yes", "since"], nextId: "headache_check" },
        { keywords: ["yesterday", "long", "days", "week"], nextId: "headache_long" },
        { keywords: ["just", "now", "little", "just now"], nextId: "headache_check" },
      ],
      fallbackId: "headache_check",
    },
    {
      id: "headache_check",
      aiMessage: "Let me check. Did you drink enough water today? Sometimes headaches come from not drinking enough water.",
      aiMessageZh: "讓我看看。你今天有喝足夠的水嗎？有時候頭痛是因為喝水不夠。",
      responses: [
        { keywords: ["yes", "drink", "water", "did"], nextId: "headache_medicine" },
        { keywords: ["no", "didn't", "forgot", "not"], nextId: "drink_water" },
      ],
      fallbackId: "headache_medicine",
    },
    {
      id: "headache_long",
      aiMessage: "Oh, that's a long time. Do you also have a fever?",
      aiMessageZh: "哦，那很久了。你有發燒嗎？",
      responses: [
        { keywords: ["yes", "fever", "hot"], nextId: "fever" },
        { keywords: ["no", "don't", "not"], nextId: "headache_medicine" },
      ],
      fallbackId: "headache_medicine",
    },
    {
      id: "drink_water",
      aiMessage: "You should drink more water! Here, have some water. And I'll give you some medicine for the headache.",
      aiMessageZh: "你應該多喝水！來，喝點水。我會給你一些治頭痛的藥。",
      responses: [
        { keywords: ["thank", "thanks", "ok", "sure"], nextId: "rest_advice" },
      ],
      fallbackId: "rest_advice",
    },
    {
      id: "headache_medicine",
      aiMessage: "I'll give you some medicine. Take it after lunch. You should also rest a little bit.",
      aiMessageZh: "我給你一些藥。午飯後吃。你也應該休息一下。",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "rest_advice" },
        { keywords: ["how", "when", "much"], nextId: "medicine_instructions" },
      ],
      fallbackId: "rest_advice",
    },
    {
      id: "stomachache",
      aiMessage: "Oh no, a stomachache! What did you eat today? Did you eat breakfast?",
      aiMessageZh: "哦不，肚子痛！你今天吃了什麼？有吃早餐嗎？",
      responses: [
        { keywords: ["yes", "ate", "eat", "breakfast"], nextId: "stomach_what" },
        { keywords: ["no", "didn't", "skip", "not"], nextId: "stomach_empty" },
        { keywords: ["too much", "a lot", "candy", "ice cream", "junk"], nextId: "stomach_toomuch" },
      ],
      fallbackId: "stomach_what",
    },
    {
      id: "stomach_what",
      aiMessage: "I see. Did you eat anything cold or spicy? Sometimes that can hurt your stomach.",
      aiMessageZh: "我知道了。你有吃冰的或辣的東西嗎？有時候那會讓肚子痛。",
      responses: [
        { keywords: ["yes", "cold", "ice", "spicy"], nextId: "stomach_toomuch" },
        { keywords: ["no", "normal", "regular"], nextId: "stomach_medicine" },
      ],
      fallbackId: "stomach_medicine",
    },
    {
      id: "stomach_empty",
      aiMessage: "An empty stomach can hurt! You should eat something light, like bread or crackers. I'll give you some medicine too.",
      aiMessageZh: "空腹會痛！你應該吃一些清淡的東西，像麵包或蘇打餅。我也會給你一些藥。",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "rest_advice" },
      ],
      fallbackId: "rest_advice",
    },
    {
      id: "stomach_toomuch",
      aiMessage: "I think your stomach is upset. Drink warm water and rest. I'll give you some medicine.",
      aiMessageZh: "我覺得你的肚子不舒服。喝溫水然後休息。我給你一些藥。",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "rest_advice" },
      ],
      fallbackId: "rest_advice",
    },
    {
      id: "stomach_medicine",
      aiMessage: "Here is some stomach medicine. Take it after eating. And drink warm water, not cold!",
      aiMessageZh: "這是一些胃藥。飯後吃。然後喝溫水，不要冰的！",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "rest_advice" },
      ],
      fallbackId: "rest_advice",
    },
    {
      id: "cold",
      aiMessage: "Sounds like you have a cold. Do you have a runny nose or a sore throat?",
      aiMessageZh: "聽起來你感冒了。你有流鼻水或喉嚨痛嗎？",
      responses: [
        { keywords: ["nose", "runny", "yes"], nextId: "cold_medicine" },
        { keywords: ["throat", "sore", "hurt"], nextId: "cold_medicine" },
        { keywords: ["both", "all", "yes"], nextId: "cold_medicine" },
        { keywords: ["cough", "coughing"], nextId: "cold_medicine" },
      ],
      fallbackId: "cold_medicine",
    },
    {
      id: "cold_medicine",
      aiMessage: "I'll give you cold medicine. Make sure to drink lots of warm water and get plenty of sleep tonight!",
      aiMessageZh: "我給你感冒藥。記得多喝溫水，今晚好好睡覺！",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "rest_advice" },
        { keywords: ["how", "when"], nextId: "medicine_instructions" },
      ],
      fallbackId: "rest_advice",
    },
    {
      id: "fever",
      aiMessage: "Let me take your temperature... Oh, you have a small fever. You need to rest at home today.",
      aiMessageZh: "讓我量你的體溫...哦，你有一點發燒。你今天需要在家休息。",
      responses: [
        { keywords: ["ok", "rest", "home", "sure"], nextId: "rest_advice" },
        { keywords: ["school", "class", "test", "can't"], nextId: "must_rest" },
      ],
      fallbackId: "rest_advice",
    },
    {
      id: "must_rest",
      aiMessage: "I know you want to go to school, but your health is more important! Rest today and you can go back tomorrow.",
      aiMessageZh: "我知道你想去上學，但健康更重要！今天休息，明天再去。",
      responses: [
        { keywords: ["ok", "fine", "sure", "yes"], nextId: "rest_advice" },
      ],
      fallbackId: "rest_advice",
    },
    {
      id: "medicine_instructions",
      aiMessage: "Take the medicine three times a day: morning, afternoon, and night. Always take it after eating. OK?",
      aiMessageZh: "一天吃三次藥：早上、下午和晚上。一定要飯後吃。好嗎？",
      responses: [
        { keywords: ["ok", "yes", "understand", "got", "thank"], nextId: "rest_advice" },
      ],
      fallbackId: "rest_advice",
    },
    {
      id: "rest_advice",
      aiMessage: "Remember: drink lots of water, eat healthy food, and get lots of sleep. You'll feel better soon! Take care!",
      aiMessageZh: "記住：多喝水、吃健康食物、多睡覺。你很快就會好的！保重！",
      responses: [],
      isEnd: true,
    },
  ],
};

const directionsScenario: Scenario = {
  id: "directions",
  title: "Asking Directions",
  titleZh: "問路",
  icon: "🗺️",
  aiRole: "Local Person",
  aiRoleZh: "路人",
  userRole: "Traveler",
  userRoleZh: "旅客",
  starterMessage: "Hi there! You look lost. Can I help you find something?",
  starterMessageZh: "嗨！你看起來迷路了。需要幫你找什麼嗎？",
  vocabulary: [
    { word: "where", meaning: "在哪裡" },
    { word: "turn left", meaning: "左轉" },
    { word: "turn right", meaning: "右轉" },
    { word: "straight", meaning: "直走" },
    { word: "next to", meaning: "旁邊" },
  ],
  level: "medium",
  dialogTree: [
    {
      id: "start",
      aiMessage: "Hi there! You look lost. Can I help you find something?",
      aiMessageZh: "嗨！你看起來迷路了。需要幫你找什麼嗎？",
      responses: [
        { keywords: ["library", "book"], nextId: "library_dir" },
        { keywords: ["park", "playground"], nextId: "park_dir" },
        { keywords: ["store", "shop", "supermarket", "market"], nextId: "store_dir" },
        { keywords: ["school"], nextId: "school_dir" },
        { keywords: ["hospital", "doctor", "clinic"], nextId: "hospital_dir" },
        { keywords: ["restaurant", "food", "eat", "hungry"], nextId: "restaurant_dir" },
        { keywords: ["where", "find", "looking", "lost", "how", "go"], nextId: "where_to" },
        { keywords: ["yes", "help", "please"], nextId: "where_to" },
        { keywords: ["hello", "hi", "thank"], nextId: "greet_dir" },
      ],
      fallbackId: "where_to",
    },
    {
      id: "greet_dir",
      aiMessage: "Hello! Where do you want to go? There's a library, a park, a store, and a restaurant near here!",
      aiMessageZh: "你好！你想去哪裡？附近有圖書館、公園、商店和餐廳！",
      responses: [
        { keywords: ["library"], nextId: "library_dir" },
        { keywords: ["park"], nextId: "park_dir" },
        { keywords: ["store", "shop"], nextId: "store_dir" },
        { keywords: ["restaurant", "food", "eat"], nextId: "restaurant_dir" },
      ],
      fallbackId: "where_to",
    },
    {
      id: "where_to",
      aiMessage: "Where would you like to go? The library, the park, a store, a restaurant, or the school?",
      aiMessageZh: "你想去哪裡？圖書館、公園、商店、餐廳還是學校？",
      responses: [
        { keywords: ["library"], nextId: "library_dir" },
        { keywords: ["park"], nextId: "park_dir" },
        { keywords: ["store", "shop"], nextId: "store_dir" },
        { keywords: ["school"], nextId: "school_dir" },
        { keywords: ["restaurant", "food"], nextId: "restaurant_dir" },
        { keywords: ["hospital", "doctor"], nextId: "hospital_dir" },
      ],
      fallbackId: "library_dir",
    },
    {
      id: "library_dir",
      aiMessage: "The library? Sure! Go straight for two blocks, then turn left. It's the big building with a blue door. You can't miss it!",
      aiMessageZh: "圖書館？好的！直走兩個路口，然後左轉。是一棟有藍色門的大建築。你不會錯過的！",
      responses: [
        { keywords: ["straight", "left", "block", "repeat", "again"], nextId: "library_confirm" },
        { keywords: ["far", "long", "how", "minute", "walk"], nextId: "library_time" },
        { keywords: ["thank", "thanks", "got", "ok"], nextId: "goodbye_dir" },
      ],
      fallbackId: "library_confirm",
    },
    {
      id: "library_confirm",
      aiMessage: "Yes! Go straight, then turn left at the second block. The library has a blue door. It's about 5 minutes walking!",
      aiMessageZh: "對！直走，然後在第二個路口左轉。圖書館有藍色的門。走路大約 5 分鐘！",
      responses: [
        { keywords: ["thank", "thanks", "got", "ok"], nextId: "goodbye_dir" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "library_time",
      aiMessage: "It's about 5 minutes on foot. Not far at all! Just go straight and turn left.",
      aiMessageZh: "走路大約 5 分鐘。一點都不遠！直走然後左轉就到了。",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "goodbye_dir" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "park_dir",
      aiMessage: "The park is close! Turn right here and walk straight. You'll see it on your left. It has a big tree at the entrance!",
      aiMessageZh: "公園很近！在這裡右轉然後直走。你會在左邊看到它。入口有一棵大樹！",
      responses: [
        { keywords: ["right", "straight", "left", "tree", "repeat"], nextId: "park_confirm" },
        { keywords: ["far", "long", "how", "minute"], nextId: "park_time" },
        { keywords: ["thank", "thanks", "ok"], nextId: "goodbye_dir" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "park_confirm",
      aiMessage: "Right! Turn right, then go straight. The park is on your left side. Look for the big tree! About 3 minutes.",
      aiMessageZh: "對！右轉然後直走。公園在你的左邊。找那棵大樹！大約 3 分鐘。",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "goodbye_dir" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "park_time",
      aiMessage: "Just 3 minutes! It's very close. Turn right and go straight.",
      aiMessageZh: "只要 3 分鐘！很近的。右轉然後直走。",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "goodbye_dir" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "store_dir",
      aiMessage: "There's a store right around the corner! Go straight and turn right at the traffic light. It's next to the bakery.",
      aiMessageZh: "轉角就有一家商店！直走，在紅綠燈右轉。在麵包店旁邊。",
      responses: [
        { keywords: ["thank", "thanks", "ok", "got"], nextId: "goodbye_dir" },
        { keywords: ["bakery", "bread", "where"], nextId: "store_more" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "store_more",
      aiMessage: "The bakery has a red sign, and the store is right next to it. You'll smell the fresh bread — that's how you know you're close!",
      aiMessageZh: "麵包店有個紅色招牌，商店就在旁邊。你會聞到新鮮麵包的味道 — 那就知道快到了！",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "goodbye_dir" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "school_dir",
      aiMessage: "The school is on Maple Street! Go straight for three blocks and turn left. You'll see the school playground on the right.",
      aiMessageZh: "學校在楓樹街上！直走三個路口然後左轉。你會在右邊看到學校操場。",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "goodbye_dir" },
        { keywords: ["far", "long", "how"], nextId: "school_time" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "school_time",
      aiMessage: "It's about 10 minutes walking. You can also take Bus Number 5 — it stops right in front of the school!",
      aiMessageZh: "走路大約 10 分鐘。你也可以搭 5 號公車 — 就停在學校前面！",
      responses: [
        { keywords: ["thank", "thanks", "ok", "bus"], nextId: "goodbye_dir" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "hospital_dir",
      aiMessage: "The hospital is on Main Street. Turn left here, go straight past the bank, and you'll see it. It's the white building.",
      aiMessageZh: "醫院在主街上。這裡左轉，直走經過銀行就看到了。是那棟白色建築。",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "goodbye_dir" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "restaurant_dir",
      aiMessage: "There's a great restaurant called Sunny Cafe! Go straight and it's on the right side, between the bookstore and the flower shop.",
      aiMessageZh: "有一家很棒的餐廳叫陽光咖啡！直走，在右邊，書店和花店中間。",
      responses: [
        { keywords: ["thank", "thanks", "ok"], nextId: "goodbye_dir" },
        { keywords: ["what", "food", "menu", "good"], nextId: "restaurant_food" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "restaurant_food",
      aiMessage: "They have amazing pizza and pasta! And their ice cream is the best in town. You should try it!",
      aiMessageZh: "他們的披薩和義大利麵超好吃！冰淇淋是鎮上最好的。你應該試試！",
      responses: [
        { keywords: ["thank", "thanks", "ok", "great", "try"], nextId: "goodbye_dir" },
      ],
      fallbackId: "goodbye_dir",
    },
    {
      id: "goodbye_dir",
      aiMessage: "You're welcome! Have a great day! If you get lost again, just ask someone. People here are very friendly!",
      aiMessageZh: "不客氣！祝你有美好的一天！如果又迷路了，就問別人。這裡的人都很友善！",
      responses: [],
      isEnd: true,
    },
  ],
};

const friendsScenario: Scenario = {
  id: "friends",
  title: "Making Friends",
  titleZh: "交朋友",
  icon: "🎉",
  aiRole: "New Kid",
  aiRoleZh: "新同學",
  userRole: "You",
  userRoleZh: "你",
  starterMessage: "Hi! I'm new here. My name is Alex. What's your name?",
  starterMessageZh: "嗨！我是新來的。我叫 Alex。你叫什麼名字？",
  vocabulary: [
    { word: "name", meaning: "名字" },
    { word: "hobby", meaning: "興趣" },
    { word: "play", meaning: "玩" },
    { word: "friend", meaning: "朋友" },
    { word: "together", meaning: "一起" },
  ],
  level: "easy",
  dialogTree: [
    {
      id: "start",
      aiMessage: "Hi! I'm new here. My name is Alex. What's your name?",
      aiMessageZh: "嗨！我是新來的。我叫 Alex。你叫什麼名字？",
      responses: [
        { keywords: ["name", "is", "my", "i'm", "i am", "call"], nextId: "nice_name" },
        { keywords: ["hello", "hi", "hey", "welcome"], nextId: "nice_name" },
      ],
      fallbackId: "nice_name",
    },
    {
      id: "nice_name",
      aiMessage: "Nice to meet you! How old are you? I'm 10 years old.",
      aiMessageZh: "很高興認識你！你幾歲？我 10 歲。",
      responses: [
        { keywords: ["7", "8", "9", "10", "11", "12", "year", "old", "same", "too"], nextId: "ask_hobby" },
      ],
      fallbackId: "ask_hobby",
    },
    {
      id: "ask_hobby",
      aiMessage: "Cool! What do you like to do for fun? I like playing video games and drawing!",
      aiMessageZh: "酷！你平常喜歡做什麼？我喜歡打電動和畫畫！",
      responses: [
        { keywords: ["game", "video", "play", "computer", "switch", "phone"], nextId: "games_talk" },
        { keywords: ["draw", "art", "paint", "color"], nextId: "art_talk" },
        { keywords: ["sport", "soccer", "basketball", "baseball", "swim", "run", "ball", "bike", "ride"], nextId: "sports_talk" },
        { keywords: ["read", "book", "story", "comic", "manga"], nextId: "books_talk" },
        { keywords: ["music", "sing", "piano", "guitar", "dance"], nextId: "music_talk" },
        { keywords: ["cook", "bake", "food", "eat"], nextId: "food_talk" },
      ],
      fallbackId: "any_hobby",
    },
    {
      id: "any_hobby",
      aiMessage: "That sounds fun! I like trying new things. What's your favorite thing to do after school?",
      aiMessageZh: "聽起來好好玩！我喜歡嘗試新事物。你放學後最喜歡做什麼？",
      responses: [
        { keywords: ["game", "play", "computer"], nextId: "games_talk" },
        { keywords: ["sport", "soccer", "basketball", "run", "swim"], nextId: "sports_talk" },
        { keywords: ["read", "book", "study"], nextId: "books_talk" },
        { keywords: ["draw", "art", "paint"], nextId: "art_talk" },
        { keywords: ["music", "sing", "dance"], nextId: "music_talk" },
      ],
      fallbackId: "games_talk",
    },
    {
      id: "games_talk",
      aiMessage: "I love games too! What's your favorite game? I really like Minecraft!",
      aiMessageZh: "我也喜歡打電動！你最喜歡什麼遊戲？我很喜歡 Minecraft！",
      responses: [
        { keywords: ["minecraft", "same", "too", "me too"], nextId: "same_interest" },
        { keywords: ["*"], nextId: "cool_game" },
      ],
      fallbackId: "cool_game",
    },
    {
      id: "cool_game",
      aiMessage: "That's a cool game! Maybe we can play together sometime. Do you have any pets?",
      aiMessageZh: "那個遊戲好酷！也許我們可以一起玩。你有養寵物嗎？",
      responses: [
        { keywords: ["yes", "dog", "cat", "fish", "bird", "hamster", "rabbit", "pet"], nextId: "pet_talk" },
        { keywords: ["no", "don't", "not", "want"], nextId: "no_pet" },
      ],
      fallbackId: "pet_talk",
    },
    {
      id: "sports_talk",
      aiMessage: "I like sports too! I'm learning to play basketball. Do you want to play together sometime?",
      aiMessageZh: "我也喜歡運動！我正在學打籃球。你要一起玩嗎？",
      responses: [
        { keywords: ["yes", "sure", "ok", "great", "love", "let's"], nextId: "play_together" },
        { keywords: ["no", "don't", "can't"], nextId: "what_else" },
      ],
      fallbackId: "play_together",
    },
    {
      id: "books_talk",
      aiMessage: "Reading is awesome! What kind of books do you like? I like adventure stories!",
      aiMessageZh: "閱讀太棒了！你喜歡什麼書？我喜歡冒險故事！",
      responses: [
        { keywords: ["adventure", "same", "too"], nextId: "same_interest" },
        { keywords: ["*"], nextId: "cool_book" },
      ],
      fallbackId: "cool_book",
    },
    {
      id: "cool_book",
      aiMessage: "That sounds interesting! Maybe you can recommend a book to me. Do you have any pets at home?",
      aiMessageZh: "聽起來好有趣！也許你可以推薦一本書給我。你家有養寵物嗎？",
      responses: [
        { keywords: ["yes", "dog", "cat", "fish", "pet"], nextId: "pet_talk" },
        { keywords: ["no", "don't", "not"], nextId: "no_pet" },
      ],
      fallbackId: "pet_talk",
    },
    {
      id: "art_talk",
      aiMessage: "I love drawing too! I like to draw animals. What do you like to draw?",
      aiMessageZh: "我也喜歡畫畫！我喜歡畫動物。你喜歡畫什麼？",
      responses: [
        { keywords: ["animal", "same", "too"], nextId: "same_interest" },
        { keywords: ["*"], nextId: "cool_draw" },
      ],
      fallbackId: "cool_draw",
    },
    {
      id: "cool_draw",
      aiMessage: "Cool! We should draw together sometime. Hey, do you have any brothers or sisters?",
      aiMessageZh: "酷！我們應該一起畫畫。嘿，你有兄弟姊妹嗎？",
      responses: [
        { keywords: ["yes", "brother", "sister", "sibling"], nextId: "family_talk" },
        { keywords: ["no", "only", "don't"], nextId: "only_child" },
      ],
      fallbackId: "family_talk",
    },
    {
      id: "music_talk",
      aiMessage: "Music is so fun! Do you play any instruments? I'm learning the piano!",
      aiMessageZh: "音樂好好玩！你有學什麼樂器嗎？我在學鋼琴！",
      responses: [
        { keywords: ["piano", "same", "too"], nextId: "same_interest" },
        { keywords: ["*"], nextId: "play_together" },
      ],
      fallbackId: "play_together",
    },
    {
      id: "food_talk",
      aiMessage: "I love food too! What's your favorite food? Mine is pizza!",
      aiMessageZh: "我也喜歡吃！你最喜歡什麼食物？我最喜歡披薩！",
      responses: [
        { keywords: ["pizza", "same", "too", "me too"], nextId: "same_interest" },
        { keywords: ["*"], nextId: "play_together" },
      ],
      fallbackId: "play_together",
    },
    {
      id: "same_interest",
      aiMessage: "No way, me too! We have so much in common! I think we're going to be great friends!",
      aiMessageZh: "不會吧，我也是！我們有好多共同點！我覺得我們會變成好朋友！",
      responses: [
        { keywords: ["yes", "friend", "great", "cool", "awesome", "me too", "agree"], nextId: "be_friends" },
        { keywords: ["*"], nextId: "be_friends" },
      ],
      fallbackId: "be_friends",
    },
    {
      id: "pet_talk",
      aiMessage: "Aw, that's cute! I want a dog but my mom says maybe later. What's your pet's name?",
      aiMessageZh: "好可愛！我想養狗但媽媽說以後再說。你的寵物叫什麼名字？",
      responses: [
        { keywords: ["*"], nextId: "be_friends" },
      ],
      fallbackId: "be_friends",
    },
    {
      id: "no_pet",
      aiMessage: "Me neither! But I really want one. Maybe a cat or a dog. Do you want a pet?",
      aiMessageZh: "我也沒有！但我很想養。可能養貓或狗。你想養寵物嗎？",
      responses: [
        { keywords: ["yes", "want", "dog", "cat", "love"], nextId: "be_friends" },
        { keywords: ["no", "don't"], nextId: "be_friends" },
      ],
      fallbackId: "be_friends",
    },
    {
      id: "family_talk",
      aiMessage: "That's nice! I have a little sister. She's really funny. It sounds like we have a lot in common!",
      aiMessageZh: "真好！我有一個小妹妹。她很搞笑。聽起來我們有很多共同點！",
      responses: [
        { keywords: ["*"], nextId: "be_friends" },
      ],
      fallbackId: "be_friends",
    },
    {
      id: "only_child",
      aiMessage: "That's OK! I sometimes wish I was an only child too. My sister takes my stuff! Haha. Want to be friends?",
      aiMessageZh: "沒關係！我有時也希望是獨生子。我妹妹會拿我的東西！哈哈。要做朋友嗎？",
      responses: [
        { keywords: ["yes", "sure", "ok", "friend", "of course"], nextId: "be_friends" },
        { keywords: ["*"], nextId: "be_friends" },
      ],
      fallbackId: "be_friends",
    },
    {
      id: "play_together",
      aiMessage: "We should hang out more! Want to play together at recess tomorrow?",
      aiMessageZh: "我們應該多一起玩！明天下課要一起玩嗎？",
      responses: [
        { keywords: ["yes", "sure", "ok", "great", "see"], nextId: "be_friends" },
        { keywords: ["*"], nextId: "be_friends" },
      ],
      fallbackId: "be_friends",
    },
    {
      id: "what_else",
      aiMessage: "That's OK! We can do something else. What do you want to do?",
      aiMessageZh: "沒關係！我們可以做別的。你想做什麼？",
      responses: [
        { keywords: ["*"], nextId: "be_friends" },
      ],
      fallbackId: "be_friends",
    },
    {
      id: "be_friends",
      aiMessage: "I'm so happy I met you! Let's be best friends! See you tomorrow at school! Bye!",
      aiMessageZh: "認識你好開心！我們做最好的朋友吧！明天學校見！掰掰！",
      responses: [],
      isEnd: true,
    },
  ],
};

// ===== 匯出所有情境 =====

export const scenarios: Scenario[] = [
  storeScenario,
  foodScenario,
  schoolScenario,
  doctorScenario,
  directionsScenario,
  friendsScenario,
];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

/**
 * 根據使用者輸入，在對話樹中找到最佳匹配的下一個節點
 */
export function findNextNode(
  scenario: Scenario,
  currentNodeId: string,
  userMessage: string
): DialogNode | null {
  const currentNode = scenario.dialogTree.find((n) => n.id === currentNodeId);
  if (!currentNode || currentNode.isEnd) return null;

  const lowerMsg = userMessage.toLowerCase().trim();

  // 嘗試關鍵字匹配
  for (const response of currentNode.responses) {
    // 萬用匹配
    if (response.keywords.includes("*")) {
      const nextNode = scenario.dialogTree.find((n) => n.id === response.nextId);
      if (nextNode) return nextNode;
    }

    // 關鍵字匹配
    const matched = response.keywords.some((keyword) => {
      const lowerKey = keyword.toLowerCase();
      return lowerMsg.includes(lowerKey);
    });

    if (matched) {
      const nextNode = scenario.dialogTree.find((n) => n.id === response.nextId);
      if (nextNode) return nextNode;
    }
  }

  // 使用 fallback
  if (currentNode.fallbackId) {
    return scenario.dialogTree.find((n) => n.id === currentNode.fallbackId) || null;
  }

  return null;
}
