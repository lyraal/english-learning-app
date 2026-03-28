"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  maxStudents: number;
  maxTeachers: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    classes: number;
    articles: number;
  };
}

const PLAN_OPTIONS = [
  { value: "free", label: "免費版", color: "bg-gray-100 text-gray-700" },
  { value: "basic", label: "基本版", color: "bg-blue-100 text-blue-700" },
  { value: "pro", label: "專業版", color: "bg-purple-100 text-purple-700" },
];

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formPlan, setFormPlan] = useState("free");
  const [formMaxStudents, setFormMaxStudents] = useState(30);
  const [formMaxTeachers, setFormMaxTeachers] = useState(3);

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function fetchOrgs() {
    try {
      const res = await fetch("/api/admin/organizations");
      if (res.ok) setOrgs(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormSlug("");
    setFormPlan("free");
    setFormMaxStudents(30);
    setFormMaxTeachers(3);
  }

  function startEdit(org: Organization) {
    setEditingId(org.id);
    setFormName(org.name);
    setFormSlug(org.slug);
    setFormPlan(org.plan);
    setFormMaxStudents(org.maxStudents);
    setFormMaxTeachers(org.maxTeachers);
    setShowCreate(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setShowCreate(false);
    resetForm();
  }

  async function handleCreate() {
    if (!formName || !formSlug) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          slug: formSlug,
          plan: formPlan,
          maxStudents: formMaxStudents,
          maxTeachers: formMaxTeachers,
        }),
      });
      if (res.ok) {
        await fetchOrgs();
        setShowCreate(false);
        resetForm();
      } else {
        const err = await res.json();
        alert(err.error || "建立失敗");
      }
    } catch {
      alert("建立失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editingId || !formName) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          slug: formSlug,
          plan: formPlan,
          maxStudents: formMaxStudents,
          maxTeachers: formMaxTeachers,
        }),
      });
      if (res.ok) {
        await fetchOrgs();
        setEditingId(null);
        resetForm();
      } else {
        const err = await res.json();
        alert(err.error || "更新失敗");
      }
    } catch {
      alert("更新失敗");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(org: Organization) {
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !org.isActive }),
      });
      if (res.ok) await fetchOrgs();
    } catch {
      alert("操作失敗");
    }
  }

  function getPlanBadge(plan: string) {
    const p = PLAN_OPTIONS.find((o) => o.value === plan);
    return p || PLAN_OPTIONS[0];
  }

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "")
      .replace(/[\u4e00-\u9fff]/g, "");
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">補習班管理</h1>
            <p className="text-sm text-gray-500 mt-1">
              管理所有補習班（組織），設定方案和人數上限
            </p>
          </div>
          {!showCreate && !editingId && (
            <button
              onClick={() => {
                resetForm();
                setShowCreate(true);
              }}
              className="btn-admin-primary"
            >
              + 新增補習班
            </button>
          )}
        </div>

        {/* Create / Edit Form */}
        {(showCreate || editingId) && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingId ? "編輯補習班" : "新增補習班"}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  補習班名稱 *
                </label>
                <input
                  type="text"
                  className="input-admin"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingId) setFormSlug(autoSlug(e.target.value));
                  }}
                  placeholder="例：快樂英語補習班"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  識別碼 (slug) *
                </label>
                <input
                  type="text"
                  className="input-admin"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="例：happy-english"
                />
                <p className="text-xs text-gray-400 mt-1">
                  僅限英文小寫、數字和短橫線
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  方案
                </label>
                <select
                  className="input-admin"
                  value={formPlan}
                  onChange={(e) => setFormPlan(e.target.value)}
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    學生上限
                  </label>
                  <input
                    type="number"
                    className="input-admin"
                    value={formMaxStudents}
                    onChange={(e) => setFormMaxStudents(Number(e.target.value))}
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    老師上限
                  </label>
                  <input
                    type="number"
                    className="input-admin"
                    value={formMaxTeachers}
                    onChange={(e) => setFormMaxTeachers(Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={saving || !formName || !formSlug}
                className="btn-admin-primary"
              >
                {saving ? "儲存中..." : editingId ? "更新" : "建立"}
              </button>
              <button onClick={cancelEdit} className="btn-admin-secondary">
                取消
              </button>
            </div>
          </div>
        )}

        {/* Organization List */}
        {loading ? (
          <div className="text-center py-12">
            <span className="text-4xl animate-spin block">⏳</span>
            <p className="text-gray-500 mt-2">載入中...</p>
          </div>
        ) : orgs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
            <span className="text-5xl block mb-3">🏢</span>
            <p className="text-gray-500">尚未建立任何補習班</p>
            <p className="text-sm text-gray-400 mt-1">
              點擊上方按鈕新增第一個補習班
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orgs.map((org) => {
              const plan = getPlanBadge(org.plan);
              return (
                <div
                  key={org.id}
                  className={`bg-white rounded-xl p-5 shadow-sm border transition-colors ${
                    org.isActive
                      ? "border-gray-100"
                      : "border-red-100 bg-red-50/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-2xl">
                        {org.logo || "🏫"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800">
                            {org.name}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.color}`}
                          >
                            {plan.label}
                          </span>
                          {!org.isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                              已停用
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          /{org.slug} · 建立於{" "}
                          {new Date(org.createdAt).toLocaleDateString("zh-TW")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Stats */}
                      <div className="flex gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-primary-600">
                            {org._count.users}
                          </p>
                          <p className="text-xs text-gray-400">用戶</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-success-600">
                            {org._count.classes}
                          </p>
                          <p className="text-xs text-gray-400">班級</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-accent-600">
                            {org._count.articles}
                          </p>
                          <p className="text-xs text-gray-400">教材</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(org)}
                          className="btn-admin-secondary"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => toggleActive(org)}
                          className={
                            org.isActive
                              ? "btn-admin-danger"
                              : "btn-admin bg-green-500 text-white hover:bg-green-600"
                          }
                        >
                          {org.isActive ? "停用" : "啟用"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>學生</span>
                        <span>
                          {org._count.users} / {org.maxStudents}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-primary-400 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (org._count.users / org.maxStudents) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>老師上限</span>
                        <span>{org.maxTeachers}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-accent-400 h-1.5 rounded-full"
                          style={{ width: "20%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
