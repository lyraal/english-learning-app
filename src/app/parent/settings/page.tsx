"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

export default function ParentSettingsPage() {
  const { data: session, update } = useSession();
  const user = session?.user as any;

  // 修改姓名
  const [name, setName] = useState(user?.name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [nameError, setNameError] = useState("");

  // 修改密碼
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    setNameLoading(true);
    setNameMsg("");
    setNameError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setNameMsg("姓名已更新！");
        await update({ name: name.trim() });
      } else {
        const data = await res.json();
        setNameError(data.error || "更新失敗");
      }
    } catch {
      setNameError("更新失敗，請稍後再試");
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError("");
    setPwMsg("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwError("請填寫所有欄位");
      return;
    }
    if (newPassword.length < 4) {
      setPwError("新密碼至少需要 4 個字元");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("新密碼與確認密碼不一致");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg("密碼已成功更新！");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwError(data.error || "更新失敗");
      }
    } catch {
      setPwError("更新失敗，請稍後再試");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
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
            <span className="font-medium text-slate-800">{user?.email || user?.username || "—"}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">角色</span>
            <span className="font-medium text-emerald-600">家長</span>
          </div>
        </div>
      </div>

      {/* 修改姓名 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <h2 className="text-base font-semibold text-slate-700 mb-3">✏️ 修改顯示名稱</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
            placeholder="輸入新的顯示名稱"
          />
          <button
            onClick={handleUpdateName}
            disabled={nameLoading || !name.trim()}
            className="w-full py-2.5 bg-emerald-500 text-white rounded-lg font-semibold text-sm hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {nameLoading ? "更新中..." : "更新名稱"}
          </button>
          {nameError && <p className="text-sm text-center text-red-500">{nameError}</p>}
          {nameMsg && <p className="text-sm text-center text-green-600">{nameMsg}</p>}
        </div>
      </div>

      {/* 修改密碼 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <h2 className="text-base font-semibold text-slate-700 mb-4">🔒 修改密碼</h2>
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
            disabled={pwLoading}
            className="w-full py-2.5 bg-slate-600 text-white rounded-lg font-semibold text-sm hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pwLoading ? "更新中..." : "更新密碼"}
          </button>
          {pwError && <p className="text-sm text-center text-red-500">{pwError}</p>}
          {pwMsg && <p className="text-sm text-center text-green-600">{pwMsg}</p>}
        </div>
      </div>
    </div>
  );
}
