/**
 * 通知系統 — 組裝訊息並發送到家長的 LINE
 * 會先檢查家長的通知偏好設定，只發送啟用的通知類型
 */

import prisma from "./prisma";
import { sendLineNotify } from "./line-notify";

// 通知偏好類型
interface NotificationPrefs {
  dailySummary: boolean;
  badge: boolean;
  streak: boolean;
  assignment: boolean;
  inactive: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  dailySummary: true,
  badge: true,
  streak: true,
  assignment: true,
  inactive: true,
};

// Fire-and-forget：不阻塞主流程
export function notifyAsync(fn: () => Promise<void>) {
  fn().catch((err) => console.error("[notifications] Error:", err));
}

/**
 * 通知家長：孩子獲得新徽章
 */
export async function notifyBadgeEarned(studentId: string, badgeTitle: string, badgeIcon: string, points: number) {
  const parents = await getParentTokensWithPrefs(studentId, "badge");
  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true } });
  if (!student || parents.length === 0) return;

  const msg = `\n🏆 恭喜！${student.name} 獲得新徽章！\n${badgeIcon} ${badgeTitle}\n+${points} 積分！繼續加油！💪`;

  for (const token of parents) {
    await sendLineNotify(token, msg);
  }
}

/**
 * 通知家長：連續學習天數里程碑
 */
export async function notifyStreakMilestone(studentId: string, days: number) {
  const parents = await getParentTokensWithPrefs(studentId, "streak");
  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true } });
  if (!student || parents.length === 0) return;

  const msg = `\n🔥 太棒了！${student.name} 已經連續學習 ${days} 天！\n堅持就是勝利，繼續保持！💪`;

  for (const token of parents) {
    await sendLineNotify(token, msg);
  }
}

/**
 * 通知家長：作業完成
 */
export async function notifyAssignmentCompleted(studentId: string, assignmentTitle: string, score?: number) {
  const parents = await getParentTokensWithPrefs(studentId, "assignment");
  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true } });
  if (!student || parents.length === 0) return;

  let msg = `\n✅ ${student.name} 完成了作業「${assignmentTitle}」`;
  if (score !== undefined) msg += `\n📊 分數：${score} 分`;
  msg += "\n做得好！👍";

  for (const token of parents) {
    await sendLineNotify(token, msg);
  }
}

/**
 * 發送每日學習摘要
 */
export async function sendDailySummary(studentId: string) {
  const parents = await getParentTokensWithPrefs(studentId, "dailySummary");
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { name: true, streak: true, points: true },
  });
  if (!student || parents.length === 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRecords = await prisma.practiceRecord.findMany({
    where: { studentId, createdAt: { gte: today } },
  });

  if (todayRecords.length === 0) return; // 今天沒練習就不發

  const reading = todayRecords.filter((r) => r.type === "reading").length;
  const speaking = todayRecords.filter((r) => r.type === "speaking");
  const vocab = todayRecords.filter((r) => r.type === "vocabulary").length;
  const writing = todayRecords.filter((r) => r.type === "writing").length;

  const speakingAvg = speaking.length > 0
    ? Math.round(speaking.reduce((s, r) => s + (r.score || 0), 0) / speaking.length)
    : 0;

  // 今日完成的任務數
  const todayMissions = await prisma.dailyMission.findMany({
    where: {
      userId: studentId,
      date: today,
    },
  });
  const completedMissions = todayMissions.filter((m) => m.completed).length;
  const totalMissions = todayMissions.length;

  let msg = `\n📚 英文學習日報\n👧 ${student.name} 今日學習摘要：`;
  if (reading > 0) msg += `\n✅ 閱讀 ${reading} 篇文章`;
  if (speaking.length > 0) msg += `\n✅ 口說練習 ${speaking.length} 次（平均 ${speakingAvg} 分）`;
  if (vocab > 0) msg += `\n✅ 單字練習 ${vocab} 次`;
  if (writing > 0) msg += `\n✅ 寫作練習 ${writing} 次`;
  if (totalMissions > 0) msg += `\n✅ 完成每日任務 ${completedMissions}/${totalMissions}`;
  msg += `\n🔥 連續學習 ${student.streak} 天`;
  msg += `\n⭐ 累積 ${student.points} 積分`;

  for (const token of parents) {
    await sendLineNotify(token, msg);
  }
}

/**
 * 通知家長：孩子長時間未登入
 */
export async function notifyInactive(studentId: string, days: number) {
  const parents = await getParentTokensWithPrefs(studentId, "inactive");
  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true } });
  if (!student || parents.length === 0) return;

  const msg = `\n⚠️ 提醒：${student.name} 已經 ${days} 天沒有練習英文了\n學習貴在持之以恆，今天花 10 分鐘練習吧！📖`;

  for (const token of parents) {
    await sendLineNotify(token, msg);
  }
}

/**
 * 老師手動發送自訂訊息（不受偏好限制）
 */
export async function sendCustomMessage(studentIds: string[], message: string) {
  let sent = 0;
  for (const studentId of studentIds) {
    const parents = await getParentTokens(studentId);
    for (const token of parents) {
      const ok = await sendLineNotify(token, `\n📢 老師通知\n${message}`);
      if (ok) sent++;
    }
  }
  return sent;
}

/**
 * 發送測試通知（不受偏好限制）
 */
export async function sendTestNotification(token: string, studentName?: string) {
  const name = studentName || "您的孩子";
  const msg = `\n🧪 測試通知\n這是一則測試訊息，確認您可以正常收到 ${name} 的學習進度通知。\n\n如果您看到這則訊息，表示 LINE 通知功能正常運作！✅`;
  return sendLineNotify(token, msg);
}

// ===== 內部工具 =====

/** 取得家長 tokens（不檢查偏好，用於老師自訂訊息） */
async function getParentTokens(studentId: string): Promise<string[]> {
  const links = await prisma.parentChild.findMany({
    where: { childId: studentId },
    include: { parent: { select: { lineNotifyToken: true } } },
  });
  return links
    .map((l) => l.parent.lineNotifyToken)
    .filter((t): t is string => !!t);
}

/** 取得家長 tokens（檢查偏好設定） */
async function getParentTokensWithPrefs(studentId: string, prefKey: keyof NotificationPrefs): Promise<string[]> {
  const links = await prisma.parentChild.findMany({
    where: { childId: studentId },
    include: { parent: { select: { lineNotifyToken: true, notificationPrefs: true } } },
  });

  return links
    .filter((l) => {
      if (!l.parent.lineNotifyToken) return false;
      // 解析偏好設定
      let prefs: NotificationPrefs = { ...DEFAULT_PREFS };
      if (l.parent.notificationPrefs) {
        try {
          prefs = { ...DEFAULT_PREFS, ...JSON.parse(l.parent.notificationPrefs) };
        } catch {}
      }
      return prefs[prefKey];
    })
    .map((l) => l.parent.lineNotifyToken!)
    ;
}
