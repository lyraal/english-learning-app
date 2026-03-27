"use client";

export default function NotificationsPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-4">通知</h2>
      <div className="bg-white rounded-xl p-8 text-center text-slate-400">
        <div className="text-4xl mb-3">🔔</div>
        <p>目前沒有新通知</p>
        <p className="text-sm mt-1">當孩子完成里程碑時會通知您</p>
      </div>
    </div>
  );
}
