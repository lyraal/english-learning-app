"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { formatDate } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  type: string;
  status: string;
  dueDate: string | null;
  class: { name: string };
  article: { title: string } | null;
  _count: { submissions: number };
  createdAt: string;
}

interface ClassInfo {
  id: string;
  name: string;
  students: Array<{ studentId: string; student: { id: string; name: string } }>;
}

interface ArticleInfo {
  id: string;
  title: string;
}

type BatchStep = "config" | "preview";

const ASSIGNMENT_TYPES = [
  { value: "READING", label: "閱讀", icon: "📖" },
  { value: "VOCABULARY", label: "單字", icon: "✏️" },
  { value: "SPEAKING", label: "口說", icon: "🎤" },
  { value: "WRITING", label: "寫作", icon: "📝" },
];

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [articles, setArticles] = useState<ArticleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Batch form state
  const [batchStep, setBatchStep] = useState<BatchStep>("config");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["READING"]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [articleId, setArticleId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectMode, setSelectMode] = useState<"class" | "student">("class");

  useEffect(() => {
    fetchAssignments();
    fetchClasses();
    fetchArticles();
  }, []);

  async function fetchAssignments() {
    try {
      const res = await fetch("/api/assignments");
      if (res.ok) setAssignments(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function fetchClasses() {
    try {
      const res = await fetch("/api/classes?includeStudents=true");
      if (res.ok) setClasses(await res.json());
    } catch {}
  }

  async function fetchArticles() {
    try {
      const res = await fetch("/api/articles");
      if (res.ok) setArticles(await res.json());
    } catch {}
  }

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function toggleClass(classId: string) {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId]
    );
  }

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((s) => s !== studentId) : [...prev, studentId]
    );
  }

  function selectAllStudentsInClass(classId: string) {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return;
    const ids = cls.students.map((s) => s.studentId);
    setSelectedStudentIds((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !ids.includes(id));
      return Array.from(new Set([...prev, ...ids]));
    });
  }

  // Compute preview data
  function getPreviewData() {
    const targetClasses = selectMode === "class"
      ? classes.filter((c) => selectedClassIds.includes(c.id))
      : [];
    const targetStudents = selectMode === "student"
      ? classes.flatMap((c) => c.students).filter((s) => selectedStudentIds.includes(s.studentId))
      : [];

    const studentCount = selectMode === "class"
      ? targetClasses.reduce((sum, c) => sum + c.students.length, 0)
      : targetStudents.length;

    const totalAssignments = selectedTypes.length * (selectMode === "class" ? selectedClassIds.length : 1);

    return { targetClasses, targetStudents, studentCount, totalAssignments };
  }

  function canProceedToPreview() {
    if (!title.trim()) return false;
    if (selectedTypes.length === 0) return false;
    if (selectMode === "class" && selectedClassIds.length === 0) return false;
    if (selectMode === "student" && selectedStudentIds.length === 0) return false;
    return true;
  }

  async function handleBatchCreate() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          types: selectedTypes,
          classIds: selectMode === "class" ? selectedClassIds : [],
          studentIds: selectMode === "student" ? selectedStudentIds : [],
          articleId: articleId || null,
          dueDate: dueDate || null,
        }),
      });
      if (res.ok) {
        resetForm();
        fetchAssignments();
      } else {
        alert("指派失敗，請重試");
      }
    } catch {
      alert("指派失敗，請重試");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setBatchStep("config");
    setTitle("");
    setDescription("");
    setSelectedTypes(["READING"]);
    setSelectedClassIds([]);
    setSelectedStudentIds([]);
    setArticleId("");
    setDueDate("");
    setSelectMode("class");
  }

  const preview = getPreviewData();

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📋 作業指派</h1>
          <button onClick={() => { setShowForm(!showForm); setBatchStep("config"); }} className="btn-admin-primary">
            + 批量指派作業
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            {batchStep === "config" ? (
              <>
                <h2 className="font-bold text-gray-800 mb-4">批量指派作業</h2>
                <div className="space-y-5">
                  {/* Title & Description */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">作業名稱</label>
                      <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-admin" placeholder="例：第三單元練習" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">說明（選填）</label>
                      <input value={description} onChange={(e) => setDescription(e.target.value)} className="input-admin" placeholder="作業說明..." />
                    </div>
                  </div>

                  {/* Assignment Types - Checkbox Multi-select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">作業類型（可複選）</label>
                    <div className="flex flex-wrap gap-2">
                      {ASSIGNMENT_TYPES.map((t) => (
                        <label
                          key={t.value}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                            selectedTypes.includes(t.value)
                              ? "border-primary-400 bg-primary-50 text-primary-700"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(t.value)}
                            onChange={() => toggleType(t.value)}
                            className="sr-only"
                          />
                          <span>{t.icon}</span>
                          <span className="text-sm font-medium">{t.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Article & Due Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">指定文章（選填）</label>
                      <select value={articleId} onChange={(e) => setArticleId(e.target.value)} className="input-admin">
                        <option value="">-- 不指定 --</option>
                        {articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
                      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-admin" />
                    </div>
                  </div>

                  {/* Select Mode Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">指派對象</label>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setSelectMode("class")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectMode === "class" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        按班級選擇
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectMode("student")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectMode === "student" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        按學生選擇
                      </button>
                    </div>

                    {selectMode === "class" ? (
                      <div className="flex flex-wrap gap-2">
                        {classes.map((c) => (
                          <label
                            key={c.id}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                              selectedClassIds.includes(c.id)
                                ? "border-primary-400 bg-primary-50 text-primary-700"
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedClassIds.includes(c.id)}
                              onChange={() => toggleClass(c.id)}
                              className="sr-only"
                            />
                            <span>🏫</span>
                            <span className="text-sm font-medium">{c.name}</span>
                            <span className="text-xs text-gray-400">({c.students.length}人)</span>
                          </label>
                        ))}
                        {classes.length === 0 && (
                          <p className="text-sm text-gray-400">尚未建立班級</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {classes.map((c) => (
                          <div key={c.id}>
                            <div className="flex items-center gap-2 mb-1">
                              <button
                                type="button"
                                onClick={() => selectAllStudentsInClass(c.id)}
                                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                              >
                                {c.students.every((s) => selectedStudentIds.includes(s.studentId)) ? "取消全選" : "全選"}
                              </button>
                              <span className="text-sm font-medium text-gray-700">🏫 {c.name}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 ml-4">
                              {c.students.map((s) => (
                                <label
                                  key={s.studentId}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                                    selectedStudentIds.includes(s.studentId)
                                      ? "border-primary-400 bg-primary-50 text-primary-700"
                                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedStudentIds.includes(s.studentId)}
                                    onChange={() => toggleStudent(s.studentId)}
                                    className="sr-only"
                                  />
                                  <span>{s.student.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setBatchStep("preview")}
                      disabled={!canProceedToPreview()}
                      className="btn-admin-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      預覽指派內容
                    </button>
                    <button type="button" onClick={resetForm} className="btn-admin-secondary">取消</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-bold text-gray-800 mb-4">確認指派內容</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">作業名稱</span>
                      <span className="text-sm font-medium">{title}</span>
                    </div>
                    {description && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">說明</span>
                        <span className="text-sm">{description}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">作業類型</span>
                      <span className="text-sm font-medium">
                        {selectedTypes.map((t) => ASSIGNMENT_TYPES.find((at) => at.value === t)?.label).join("、")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">指派對象</span>
                      <span className="text-sm font-medium">
                        {selectMode === "class"
                          ? `${selectedClassIds.length} 個班級（共 ${preview.studentCount} 位學生）`
                          : `${selectedStudentIds.length} 位學生`
                        }
                      </span>
                    </div>
                    {articleId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">指定文章</span>
                        <span className="text-sm">{articles.find((a) => a.id === articleId)?.title}</span>
                      </div>
                    )}
                    {dueDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">截止日期</span>
                        <span className="text-sm">{formatDate(dueDate)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">將建立作業數</span>
                        <span className="text-sm font-bold text-primary-600">
                          {selectedTypes.length} 種類型 × {selectMode === "class" ? selectedClassIds.length + " 個班級" : "1 批"} = {preview.totalAssignments} 份作業
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Class/Student details */}
                  {selectMode === "class" && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">班級明細：</p>
                      {preview.targetClasses.map((c) => (
                        <p key={c.id} className="text-sm text-gray-500 ml-2">
                          🏫 {c.name}（{c.students.length} 位學生）
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleBatchCreate}
                      disabled={submitting}
                      className="btn-admin-primary disabled:opacity-50"
                    >
                      {submitting ? "指派中..." : "確認指派"}
                    </button>
                    <button type="button" onClick={() => setBatchStep("config")} className="btn-admin-secondary">
                      返回修改
                    </button>
                    <button type="button" onClick={resetForm} className="btn-admin-secondary">取消</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-400 text-center py-8">載入中...</p>
          ) : assignments.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <span className="text-4xl block mb-3">📋</span>
              <p className="text-gray-500">尚未指派任何作業</p>
            </div>
          ) : (
            assignments.map((a) => (
              <div key={a.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                <span className="text-2xl">
                  {a.type === "READING" ? "📖" : a.type === "SPEAKING" ? "🎤" : a.type === "VOCABULARY" ? "✏️" : a.type === "WRITING" ? "📝" : "📋"}
                </span>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{a.title}</h3>
                  <p className="text-xs text-gray-500">
                    {a.class.name} · {a.article?.title || "綜合練習"} · {a._count.submissions} 人已提交
                  </p>
                </div>
                <div className="text-right">
                  {a.dueDate && (
                    <p className="text-xs text-gray-400">截止：{formatDate(a.dueDate)}</p>
                  )}
                  <span className={`text-xs font-bold ${a.status === "ACTIVE" ? "text-success-600" : "text-gray-400"}`}>
                    {a.status === "ACTIVE" ? "進行中" : a.status === "CLOSED" ? "已結束" : "草稿"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
