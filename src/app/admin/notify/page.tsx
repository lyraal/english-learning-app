"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

interface ClassItem {
  id: string;
  name: string;
  students: { id: string; name: string; hasLine: boolean }[];
}

export default function AdminNotifyPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetchClasses(); }, []);

  async function fetchClasses() {
    try {
      const res = await fetch("/api/admin/notify/classes");
      if (res.ok) {
        setClasses(await res.json());
      }
    } catch {} finally { setLoading(false); }
  }

  function toggleStudent(id: string) {
    const next = new Set(selectedStudents);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudents(next);
  }

  function selectClass(cls: ClassItem) {
    const studentIds = cls.students.filter((s) => s.hasLine).map((s) => s.id);
    const allSelected = studentIds.every((id) => selectedStudents.has(id));
    const next = new Set(selectedStudents);
    if (allSelected) {
      studentIds.forEach((id) => next.delete(id));
    } else {
      studentIds.forEach((id) => next.add(id));
    }
    setSelectedStudents(next);
  }

  function selectAll() {
    const allWithLine = classes.flatMap((c) => c.students.filter((s) => s.hasLine).map((s) => s.id));
    const allSelected = allWithLine.every((id) => selectedStudents.has(id));
    if (allSelected) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(allWithLine));
    }
  }

  async function handleSend() {
    if (selectedStudents.size === 0) { setError("請選擇至少一位學生"); return; }
    if (!message.trim()) { setError("請輸入訊息內容"); return; }

    setSending(true); setError(""); setResult("");
    try {
      const res = await fetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`已成功發送 ${data.sent} 則通知！`);
        setMessage("");
        setSelectedStudents(new Set());
      } else {
        setError(data.error || "發送失敗");
      }
    } catch { setError("發送失敗"); }
    finally { setSending(false); }
  }

  const totalWithLine = classes.reduce((sum, c) => sum + c.students.filter((s) => s.hasLine).length, 0);

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">LINE 通知家長</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-400">載入中...</div>
        ) : (
          <div className="grid gap-6">
            {/* 選擇學生 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">選擇通知對象</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    已選 {selectedStudents.size} 位 / {totalWithLine} 位已綁定 LINE
                  </span>
                  <button onClick={selectAll} className="text-xs text-blue-500 hover:text-blue-700">
                    {selectedStudents.size === totalWithLine && totalWithLine > 0 ? "取消全選" : "全選"}
                  </button>
                </div>
              </div>

              {classes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">尚無班級資料</p>
              ) : (
                <div className="space-y-4">
                  {classes.map((cls) => {
                    const lineStudents = cls.students.filter((s) => s.hasLine);
                    const selectedInClass = cls.students.filter((s) => s.hasLine && selectedStudents.has(s.id)).length;
                    return (
                      <div key={cls.id} className="border border-gray-100 rounded-lg overflow-hidden">
                        <button
                          onClick={() => selectClass(cls)}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                          <span className="text-lg">🏫</span>
                          <span className="font-medium text-sm text-gray-700 flex-1">{cls.name}</span>
                          <span className="text-xs text-gray-400">
                            {selectedInClass}/{lineStudents.length} 已選
                          </span>
                        </button>
                        <div className="px-4 py-2 grid grid-cols-2 gap-1">
                          {cls.students.map((student) => (
                            <label
                              key={student.id}
                              className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm cursor-pointer hover:bg-gray-50 ${
                                !student.hasLine ? "opacity-40 cursor-not-allowed" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudents.has(student.id)}
                                onChange={() => student.hasLine && toggleStudent(student.id)}
                                disabled={!student.hasLine}
                                className="rounded"
                              />
                              <span>{student.name}</span>
                              {!student.hasLine && (
                                <span className="text-xs text-gray-300">未綁定</span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 訊息內容 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-4">訊息內容</h2>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="輸入要發送給家長的訊息..."
                rows={4}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-2">
                訊息會以「📢 老師通知」前綴發送到家長的 LINE
              </p>
            </div>

            {/* 發送按鈕 */}
            <div>
              <button
                onClick={handleSend}
                disabled={sending || selectedStudents.size === 0 || !message.trim()}
                className="w-full py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? "發送中..." : `發送通知（${selectedStudents.size} 位學生的家長）`}
              </button>

              {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}
              {result && <p className="mt-3 text-sm text-green-600 text-center">{result}</p>}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
