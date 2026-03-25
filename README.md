# EnglishBuddy 英文聽說小幫手

國小低年級英文聽說線上學習系統 — Phase 1 MVP

## 快速開始

### 前置需求
- Node.js 18+
- PostgreSQL 15+
- npm

### 安裝步驟

```bash
# 1. 安裝相依套件
npm install

# 2. 設定環境變數
cp .env.example .env
# 編輯 .env，填入你的 PostgreSQL 連線字串和 NEXTAUTH_SECRET

# 3. 建立資料庫
npx prisma db push

# 4. 匯入初始教材資料
npm run db:seed

# 5. 啟動開發伺服器
npm run dev
```

開啟 http://localhost:3000

### 測試帳號

| 角色 | 帳號 | 密碼 |
|------|------|------|
| 老師 | teacher@test.com | 123456 |
| 學生 | student1 | 123456 |
| 學生 | student2 | 123456 |
| 學生 | student3 | 123456 |

## 功能概覽

### 學生端
- **文章閱讀** — 分級文章、TTS 朗讀、逐句高亮、點擊查詞
- **單字練習** — 聽音拼字、圖片配對、字母排列遊戲
- **口說練習** — 錄音 + Web Speech API 語音辨識 + 即時評分
- **個人進度** — 練習紀錄、分數趨勢、徽章成就

### 老師後台
- **班級管理** — 建立班級、邀請碼
- **學生管理** — 新增學生、查看活躍狀態
- **教材管理** — 新增/編輯文章與單字
- **作業指派** — 指定班級、截止日期
- **學生報告** — 成績總覽、口說/拼字分析

## 技術棧

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth.js
- Web Speech API
- Zustand
