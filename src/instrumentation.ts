export async function register() {
  // 防休眠 Keep-Alive（Render Free Tier）
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_URL) {
    setInterval(() => {
      fetch(RENDER_URL).catch(() => {});
    }, 14 * 60 * 1000);
    console.log("🏓 Keep-alive 已啟動");
  }
}
