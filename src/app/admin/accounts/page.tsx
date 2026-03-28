"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

interface Account {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "學生",
  TEACHER: "老師",
  ADMIN: "管理員",
  PARENT: "家長",
};

const ROLE_COLORS: Record<string, string> = {
  STUDENT: "bg-blue-100 text-blue-700",
  TEACHER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
  PARENT: "bg-green-100 text-green-700",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // 新增帳號 modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // 重設密碼 modal
  const [resetTarget, setResetTarget] = useState<Account | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  // 操作訊息
  const [actionMsg, setActionMsg] = useState("");

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/accounts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // 搜尋（按 Enter 或按鈕）
  const handleSearch = () => {
    setSearch(searchInput);
  };

  // 新增帳號
  const handleCreate = async () => {
    setCreateError("");
    if (!createForm.name || !createForm.password || !createForm.role) {
      setCreateError("請填寫必要欄位");
      return;
    }
    if (!createForm.username && !createForm.email) {
      setCreateError("請至少填寫帳號或 Email");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({ name: "", username: "", email: "", password: "", role: "STUDENT" });
        setActionMsg(`已新增帳號：${data.name}`);
        fetchAccounts();
        setTimeout(() => setActionMsg(""), 3000);
      } else {
        setCreateError(data.error || "新增失敗");
      }
    } catch {
      setCreateError("新增失敗，請稍後再試");
    } finally {
      setCreateLoading(false);
    }
  };

  // 重設密碼
  const handleResetPassword = async () => {
    if (!resetTarget || !resetPassword) return;
    setResetLoading(true);
    setResetMsg("");
    try {
      const res = await fetch(`/api/admin/accounts/${resetTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", newPassword: resetPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetMsg(data.message);
        setResetPassword("");
        setTimeout(() => {
          setResetTarget(null);
          setResetMsg("");
        }, 2000);
      } else {
        setResetMsg(data.error || "重設失敗");
      }
    } catch {
      setResetMsg("操作失敗");
    } finally {
      setResetLoading(false);
    }
  };

  // 停用/啟用
  const handleToggleStatus = async (account: Account) => {
    try {
      const res = await fetch(`/api/admin/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-status" }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message);
        fetchAccounts();
        setTimeout(() => setActionMsg(""), 3000);
      } else {
        setActionMsg(data.error || "操作失敗");
        setTimeout(() => setActionMsg(""), 3000);
      }
    } catch {
      setActionMsg("操作失敗");
      setTimeout(() => setActionMsg(""), 3000);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 標題列 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">帳號管理</h1>
            <p className="text-sm text-gray-500 mt-1">管理所有使用者帳號</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <span>+</span> 新增帳號
          </button>
        </div>

        {/* 操作訊息 */}
        {actionMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {actionMsg}
          </div>
        )}

        {/* 篩選列 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-wrap gap-3 items-center">
          {/* 角色篩選 */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="">所有角色</option>
            <option value="STUDENT">學生</option>
            <option value="TEACHER">老師</option>
            <option value="ADMIN">管理員</option>
            <option value="PARENT">家長</option>
          </select>

          {/* 搜尋 */}
          <div className="flex-1 min-w-[200px] flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="搜尋姓名或帳號..."
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              搜尋
            </button>
          </div>

          <span className="text-sm text-gray-400">
            共 {accounts.length} 個帳號
          </span>
        </div>

        {/* 帳號列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">載入中...</div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">沒有找到帳號</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">姓名</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">帳號</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">角色</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">狀態</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">建立日期</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{account.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {account.username || account.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ROLE_COLORS[account.role] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ROLE_LABELS[account.role] || account.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          account.isActive ? "bg-green-400" : "bg-red-400"
                        }`}
                      />
                      <span className={account.isActive ? "text-green-600" : "text-red-500"}>
                        {account.isActive ? "啟用" : "停用"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(account.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setResetTarget(account)}
                          className="px-3 py-1.5 text-xs bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors font-medium"
                        >
                          重設密碼
                        </button>
                        <button
                          onClick={() => handleToggleStatus(account)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                            account.isActive
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {account.isActive ? "停用" : "啟用"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 新增帳號 Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新增帳號</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">角色 *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  <option value="STUDENT">學生</option>
                  <option value="TEACHER">老師</option>
                  <option value="PARENT">家長</option>
                  <option value="ADMIN">管理員</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">姓名 *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="輸入姓名"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">帳號（username）</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="輸入帳號"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="輸入 Email"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">密碼 *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="設定密碼（至少 4 字元）"
                />
              </div>

              {createError && (
                <p className="text-sm text-red-500">{createError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError("");
                  }}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createLoading}
                  className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {createLoading ? "建立中..." : "建立帳號"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 重設密碼 Modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">重設密碼</h3>
            <p className="text-sm text-gray-500 mb-4">
              為 <span className="font-semibold text-gray-700">{resetTarget.name}</span> 設定新密碼
            </p>
            <div className="space-y-3">
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                placeholder="輸入新密碼（至少 4 字元）"
              />
              {resetMsg && (
                <p className={`text-sm ${resetMsg.includes("已重設") ? "text-green-600" : "text-red-500"}`}>
                  {resetMsg}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setResetTarget(null);
                    setResetPassword("");
                    setResetMsg("");
                  }}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading || !resetPassword}
                  className="flex-1 py-2 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                >
                  {resetLoading ? "重設中..." : "確認重設"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
