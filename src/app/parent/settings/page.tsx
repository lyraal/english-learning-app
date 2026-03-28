"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

export default function ParentSettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async () => {
    setError("");
    setMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("請填寫所有欄位");
      return;
    }
    if (newPassword.length < 4) {
      setError("新密碼至少需要 4 個字元");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("新密碼與確認密碼不一致");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("密碼已成功更新！");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "更新失敗");
      }
    } catch {
      setError("更新失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">⚙️</span>
        <h1 className="text-xl font-bold text-slate-800">帳號設定</h1>
      </div>

      {/* 帳號資訊 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <h2 className="text-base font-semibold text-slate-700 mb-3">帳號資訊</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">姓名</span>
            <span className="font-medium text-slate-800">{user?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">帳號</span>
            <span className="font-medium text-slate-800">{user?.email || "—"}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">角色</span>
            <span className="font-medium text-emerald-600">家長</span>
          </div>
        </div>
      </div>

      {/* 修改密碼 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <h2 className="text-base font-semibold text-slate-700 mb-4">修改密碼</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">舊密碼</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
              placeholder="輸入目前密碼"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">新密碼</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
              placeholder="輸入新密碼（至少 4 字元）"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">確認新密碼</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
              placeholder="再次輸入新密碼"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full py-2.5 bg-emerald-500 text-white rounded-lg font-semibold text-sm hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "更新中..." : "更新密碼"}
          </button>
          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}
          {message && (
            <p className="text-sm text-center text-green-600">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
