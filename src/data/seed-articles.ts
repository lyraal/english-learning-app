/**
 * 初始教材數據 — 5 篇範例文章
 * 對應 PRD 中的低年級教材範例
 */

export const seedArticles = [
  {
    title: "My Pet Cat",
    titleZh: "我的寵物貓",
    content:
      "I have a cat. My cat is white. Her name is Mimi. Mimi likes to play. She likes to eat fish. Mimi is my best friend.",
    contentZh:
      "我有一隻貓。我的貓是白色的。她的名字叫咪咪。咪咪喜歡玩。她喜歡吃魚。咪咪是我最好的朋友。",
    level: "LEVEL1" as const,
    gradeLevel: 1,
    topic: "動物",
    words: [
      { word: "cat", phonetic: "/kæt/", translation: "貓", exampleSentence: "I have a cat.", orderIndex: 0 },
      { word: "white", phonetic: "/waɪt/", translation: "白色的", exampleSentence: "My cat is white.", orderIndex: 1 },
      { word: "name", phonetic: "/neɪm/", translation: "名字", exampleSentence: "Her name is Mimi.", orderIndex: 2 },
      { word: "play", phonetic: "/pleɪ/", translation: "玩", exampleSentence: "Mimi likes to play.", orderIndex: 3 },
      { word: "fish", phonetic: "/fɪʃ/", translation: "魚", exampleSentence: "She likes to eat fish.", orderIndex: 4 },
      { word: "friend", phonetic: "/frɛnd/", translation: "朋友", exampleSentence: "Mimi is my best friend.", orderIndex: 5 },
    ],
    exercises: [
      { type: "spelling", question: "聽音拼字：貓", answer: "cat", orderIndex: 0 },
      { type: "picture_match", question: "看到貓的圖片，選出正確答案", options: JSON.stringify(["cat", "dog", "bird"]), answer: "cat", orderIndex: 1 },
      { type: "read_aloud", question: "跟讀：I have a cat.", answer: "I have a cat.", orderIndex: 2 },
      { type: "qa", question: "What color is Mimi?", answer: "Mimi is white.", orderIndex: 3 },
    ],
  },
  {
    title: "My Family",
    titleZh: "我的家庭",
    content:
      "This is my family. I have a mom and a dad. I have a brother. His name is Tom. We are happy. I love my family.",
    contentZh:
      "這是我的家庭。我有一個媽媽和一個爸爸。我有一個哥哥。他的名字叫 Tom。我們很快樂。我愛我的家人。",
    level: "LEVEL1" as const,
    gradeLevel: 1,
    topic: "家庭",
    words: [
      { word: "family", phonetic: "/ˈfæməli/", translation: "家庭", exampleSentence: "This is my family.", orderIndex: 0 },
      { word: "mom", phonetic: "/mɑm/", translation: "媽媽", exampleSentence: "I have a mom.", orderIndex: 1 },
      { word: "dad", phonetic: "/dæd/", translation: "爸爸", exampleSentence: "I have a dad.", orderIndex: 2 },
      { word: "brother", phonetic: "/ˈbrʌðər/", translation: "哥哥/弟弟", exampleSentence: "I have a brother.", orderIndex: 3 },
      { word: "happy", phonetic: "/ˈhæpi/", translation: "快樂的", exampleSentence: "We are happy.", orderIndex: 4 },
      { word: "love", phonetic: "/lʌv/", translation: "愛", exampleSentence: "I love my family.", orderIndex: 5 },
    ],
    exercises: [
      { type: "spelling", question: "聽音拼字：媽媽", answer: "mom", orderIndex: 0 },
      { type: "picture_match", question: "看到一家人的圖片，選出正確答案", options: JSON.stringify(["family", "school", "park"]), answer: "family", orderIndex: 1 },
      { type: "read_aloud", question: "跟讀：I love my family.", answer: "I love my family.", orderIndex: 2 },
      { type: "spelling", question: "字母排列拼出 happy", answer: "happy", orderIndex: 3 },
    ],
  },
  {
    title: "At the Park",
    titleZh: "在公園",
    content:
      "Today is sunny. I go to the park with my friends. We run and jump. I play on the swing. My friend plays on the slide. We drink water. The park is fun!",
    contentZh:
      "今天是晴天。我和朋友一起去公園。我們跑步和跳躍。我在鞦韆上玩。我的朋友在溜滑梯上玩。我們喝水。公園好好玩！",
    level: "LEVEL2" as const,
    gradeLevel: 2,
    topic: "戶外活動",
    words: [
      { word: "sunny", phonetic: "/ˈsʌni/", translation: "晴朗的", exampleSentence: "Today is sunny.", orderIndex: 0 },
      { word: "park", phonetic: "/pɑrk/", translation: "公園", exampleSentence: "I go to the park.", orderIndex: 1 },
      { word: "run", phonetic: "/rʌn/", translation: "跑", exampleSentence: "We run and jump.", orderIndex: 2 },
      { word: "jump", phonetic: "/dʒʌmp/", translation: "跳", exampleSentence: "We run and jump.", orderIndex: 3 },
      { word: "swing", phonetic: "/swɪŋ/", translation: "鞦韆", exampleSentence: "I play on the swing.", orderIndex: 4 },
      { word: "slide", phonetic: "/slaɪd/", translation: "溜滑梯", exampleSentence: "My friend plays on the slide.", orderIndex: 5 },
      { word: "water", phonetic: "/ˈwɔtər/", translation: "水", exampleSentence: "We drink water.", orderIndex: 6 },
      { word: "fun", phonetic: "/fʌn/", translation: "好玩的", exampleSentence: "The park is fun!", orderIndex: 7 },
    ],
    exercises: [
      { type: "spelling", question: "聽音拼字：鞦韆", answer: "swing", orderIndex: 0 },
      { type: "picture_match", question: "看到溜滑梯的圖片，選出正確答案", options: JSON.stringify(["slide", "swing", "run", "jump"]), answer: "slide", orderIndex: 1 },
      { type: "read_aloud", question: "朗讀整篇文章", answer: "Today is sunny. I go to the park with my friends. We run and jump. I play on the swing. My friend plays on the slide. We drink water. The park is fun!", orderIndex: 2 },
      { type: "qa", question: "What do you play on at the park?", answer: "I play on the swing.", orderIndex: 3 },
    ],
  },
  {
    title: "My School Day",
    titleZh: "我的上學日",
    content:
      "I wake up at seven. I eat breakfast. Then I go to school. I have English class in the morning. I eat lunch at twelve. After school, I do my homework. I go to bed at nine.",
    contentZh:
      "我七點起床。我吃早餐。然後我去上學。早上我有英文課。我十二點吃午餐。放學後我做功課。我九點上床睡覺。",
    level: "LEVEL2" as const,
    gradeLevel: 2,
    topic: "學校生活",
    words: [
      { word: "wake up", phonetic: "/weɪk ʌp/", translation: "起床", exampleSentence: "I wake up at seven.", orderIndex: 0 },
      { word: "breakfast", phonetic: "/ˈbrɛkfəst/", translation: "早餐", exampleSentence: "I eat breakfast.", orderIndex: 1 },
      { word: "school", phonetic: "/skul/", translation: "學校", exampleSentence: "I go to school.", orderIndex: 2 },
      { word: "morning", phonetic: "/ˈmɔrnɪŋ/", translation: "早上", exampleSentence: "I have English class in the morning.", orderIndex: 3 },
      { word: "lunch", phonetic: "/lʌntʃ/", translation: "午餐", exampleSentence: "I eat lunch at twelve.", orderIndex: 4 },
      { word: "homework", phonetic: "/ˈhoʊmˌwɝk/", translation: "功課", exampleSentence: "I do my homework.", orderIndex: 5 },
    ],
    exercises: [
      { type: "spelling", question: "聽音拼字：學校", answer: "school", orderIndex: 0 },
      { type: "picture_match", question: "看到小朋友吃早餐的圖，選出正確答案", options: JSON.stringify(["breakfast", "lunch", "dinner", "school"]), answer: "breakfast", orderIndex: 1 },
      { type: "read_aloud", question: "跟讀：I wake up at seven.", answer: "I wake up at seven.", orderIndex: 2 },
    ],
  },
  {
    title: "Fruit Party",
    titleZh: "水果派對",
    content:
      'Today we have a fruit party at school. There are many fruits on the table. I can see red apples, yellow bananas, and purple grapes. My favorite fruit is the strawberry. It is sweet and yummy. "Do you like oranges?" my teacher asks. "Yes, I do!" I say. We all enjoy the fruit party.',
    contentZh:
      "今天我們在學校有一個水果派對。桌上有很多水果。我可以看到紅色的蘋果、黃色的香蕉和紫色的葡萄。我最喜歡的水果是草莓。它又甜又好吃。「你喜歡柳丁嗎？」老師問。「是的，我喜歡！」我說。我們都很享受水果派對。",
    level: "LEVEL3" as const,
    gradeLevel: 3,
    topic: "食物/水果",
    words: [
      { word: "fruit", phonetic: "/frut/", translation: "水果", exampleSentence: "We have a fruit party.", orderIndex: 0 },
      { word: "table", phonetic: "/ˈteɪbəl/", translation: "桌子", exampleSentence: "There are many fruits on the table.", orderIndex: 1 },
      { word: "apple", phonetic: "/ˈæpəl/", translation: "蘋果", exampleSentence: "I can see red apples.", orderIndex: 2 },
      { word: "banana", phonetic: "/bəˈnænə/", translation: "香蕉", exampleSentence: "I can see yellow bananas.", orderIndex: 3 },
      { word: "grape", phonetic: "/ɡreɪp/", translation: "葡萄", exampleSentence: "I can see purple grapes.", orderIndex: 4 },
      { word: "strawberry", phonetic: "/ˈstrɔˌbɛri/", translation: "草莓", exampleSentence: "My favorite fruit is the strawberry.", orderIndex: 5 },
      { word: "sweet", phonetic: "/swit/", translation: "甜的", exampleSentence: "It is sweet and yummy.", orderIndex: 6 },
      { word: "orange", phonetic: "/ˈɔrɪndʒ/", translation: "柳丁", exampleSentence: "Do you like oranges?", orderIndex: 7 },
      { word: "enjoy", phonetic: "/ɪnˈdʒɔɪ/", translation: "享受", exampleSentence: "We all enjoy the fruit party.", orderIndex: 8 },
    ],
    exercises: [
      { type: "spelling", question: "聽音拼字：草莓", answer: "strawberry", orderIndex: 0 },
      { type: "picture_match", question: "看到各種水果圖片，配對正確單字", options: JSON.stringify(["apple", "banana", "grape", "strawberry"]), answer: "apple", orderIndex: 1 },
      { type: "read_aloud", question: '朗讀對話："Do you like oranges?" "Yes, I do!"', answer: "Do you like oranges? Yes, I do!", orderIndex: 2 },
      { type: "qa", question: "What color are the bananas?", answer: "The bananas are yellow.", orderIndex: 3 },
    ],
  },
];

export const seedTeacher = {
  name: "王老師",
  email: "teacher@test.com",
  password: "123456",
  role: "TEACHER" as const,
};

export const seedStudents = [
  { name: "小明", username: "student1", password: "123456" },
  { name: "小美", username: "student2", password: "123456" },
  { name: "小華", username: "student3", password: "123456" },
];

export const seedClass = {
  name: "一年甲班",
  gradeLevel: 1,
  description: "測試班級",
};
