"use client";

import { useState, useEffect } from "react";

interface NotificationPrefs {
  dailySummary: boolean;
  badge: boolean;
  streak: boolean;
  assignment: boolean;
  inactive: boolean;
}

const NOTIFICATION_TYPES = [
  { key: "dailySummary" as const, icon: "📚", title: "每日學習摘要", desc: "孩子今天練習了什麼、分數多少" },
  { key: "badge" as const, icon: "🏆", title: "獲得新徽章", desc: "孩子解鎖新成就時通知" },
  { key: "streak" as const, icon: "🔥", title: "連續學習里程碑", desc: "連續 3 天、7 天、14 天、30 天" },
  { key: "assignment" as const, icon: "✅", title: "作業完成", desc: "孩子完成老師指派的作業" },
  { key: "inactive" as const, icon: "⚠️", title: "未登入提醒", desc: "超過 3 天未練習時提醒" },
];

export default function ParentNotificationsPage() {
  const [connected, setConnected] = useState(false);
  const [bindingCode, setBindingCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    dailySummary: true, badge: true, streak: true, assignment: true, inactive: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => { checkStatus(); }, []);

  async function checkStatus() {
    try {
      const res = await fetch("/api/notifications/settings");
      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected);
        if (data.prefs) setPrefs(data.prefs);
      }
    } catch {} finally { setLoading(false); }
  }

  async function handleGenerateCode() {
    setGenerating(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/notifications/line", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-code" }),
      });
      const data = await res.json();
      if (res.ok) {
        setBindingCode(data.code);
        setMessage("綁定碼已產生！請按照下方步驟完成 LINE 綁定。");
      } else {
        setError(data.error || "產生綁定碼失敗");
      }
    } catch { setError("產生綁定碼失敗"); }
    finally { setGenerating(false); }
  }

  async function handleDisconnect() {
    if (!confirm("確定要解除 LINE 通知綁定嗎？")) return;
    try {
      const res = await fetch("/api/notifications/line", { method: "DELETE" });
      if (res.ok) {
        setConnected(false);
        setBindingCode("");
        setMessage("已解除 LINE 通知綁定");
      }
    } catch {}
  }

  async function handleTest() {
    setTesting(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) setMessage("測試通知已發送，請檢查 LINE！");
      else setError(data.error || "發送失敗");
    } catch { setError("發送失敗"); }
    finally { setTesting(false); }
  }

  async function handleTogglePref(key: keyof NotificationPrefs) {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setSavingPrefs(true);
    try {
      await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });
    } catch { setPrefs(prefs); }
    finally { setSavingPrefs(false); }
  }

  if (loading) return <div className="p-6 text-center text-gray-400">載入中...</div>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-6">🔔 通知設定</h1>

      {/* LINE 綁定狀態 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">💬</span>
          <div>
            <h2 className="font-bold text-gray-800">LINE 通知</h2>
            <p className="text-sm text-gray-500">
              {connected ? "✅ 已綁定 — 您會收到孩子的學習進度通知" : "尚未綁定"}
            </p>
          </div>
          {connected && (
            <span className="ml-auto bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">已連結</span>
          )}
        </div>

        {connected ? (
          <div className="flex gap-2">
            <button onClick={handleTest} disabled={testing}
              className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 disabled:opacity-50">
              {testing ? "發送中..." : "📩 發送測試通知"}
            </button>
            <button onClick={handleDisconnect}
              className="py-2 px-4 rounded-lg border border-red-200 text-red-500 text-sm hover:bg-red-50">
              解除綁定
            </button>
          </div>
        ) : (
          <div>
            {bindingCode ? (
              <div className="bg-green-50 rounded-lg p-4 text-center mb-3">
                <p className="text-sm text-gray-600 mb-2">您的綁定碼：</p>
                <p className="text-3xl font-black text-green-600 tracking-widest">{bindingCode}</p>
                <p className="text-xs text-gray-400 mt-2">此碼 10 分鐘內有效</p>
              </div>
            ) : (
              <button onClick={handleGenerateCode} disabled={generating}
                className="w-full py-3 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600 disabled:opacity-50">
                {generating ? "產生中..." : "🔗 產生綁定碼"}
              </button>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
      </div>

      {/* 綁定步驟說明 */}
      {!connected && (
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mb-6">
          <h3 className="font-bold text-blue-800 mb-3">📖 如何綁定 LINE 通知？</h3>
          <ol className="space-y-3 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span>點擊上方「產生綁定碼」取得 6 位數綁定碼</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span>用手機 LINE 搜尋並加入「<strong>美語課輔 AI 助理</strong>」為好友</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span>在 LINE 對話中傳送綁定碼（例如：123456）</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <span>收到「綁定成功」訊息即完成！重新整理此頁面確認狀態。</span>
            </li>
          </ol>
        </div>
      )}

      {/* 通知類型開關 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-800 mb-4">📋 通知類型設定</h3>
        <div className="space-y-1">
          {NOTIFICATION_TYPES.map((nt) => (
            <div key={nt.key} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <span className="text-xl">{nt.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-700">{nt.title}</p>
                <p className="text-xs text-gray-400">{nt.desc}</p>
              </div>
              <button
                onClick={() => handleTogglePref(nt.key)}
                disabled={savingPrefs || !connected}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  prefs[nt.key] && connected ? "bg-green-500" : "bg-gray-300"
                } ${!connected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  prefs[nt.key] && connected ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>
          ))}
        </div>
        {!connected && (
          <p className="text-xs text-gray-400 mt-3">請先綁定 LINE 才能調整通知設定</p>
        )}
      </div>
    </div>
  );
}
