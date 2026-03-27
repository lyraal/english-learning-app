import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = (session.user as any).id;
    const classId = params.id;

    // Verify teacher owns this class (or export all if id is "all")
    let targetClasses;
    if (classId === "all") {
      targetClasses = await prisma.class.findMany({
        where: { teacherId },
        include: {
          students: {
            include: {
              student: {
                include: {
                  practiceRecords: { where: { score: { not: null } } },
                  spellingRecords: true,
                  writingSubmissions: true,
                  assignmentSubmissions: true,
                },
              },
            },
          },
        },
      });
    } else {
      const cls = await prisma.class.findFirst({
        where: { id: classId, teacherId },
        include: {
          students: {
            include: {
              student: {
                include: {
                  practiceRecords: { where: { score: { not: null } } },
                  spellingRecords: true,
                  writingSubmissions: true,
                  assignmentSubmissions: true,
                },
              },
            },
          },
        },
      });
      if (!cls) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }
      targetClasses = [cls];
    }

    // Build CSV
    const headers = [
      "學生姓名",
      "班級",
      "閱讀平均分",
      "單字平均分",
      "口說平均分",
      "寫作平均分",
      "總練習次數",
      "完成率",
      "最後登入時間",
    ];

    const rows: string[][] = [];

    for (const cls of targetClasses) {
      for (const enrollment of cls.students) {
        const student = enrollment.student;
        const practices = student.practiceRecords;
        const spellings = student.spellingRecords;
        const writings = student.writingSubmissions;
        const submissions = student.assignmentSubmissions;

        // Reading average
        const readingPractices = practices.filter((p) => p.type === "reading");
        const readingAvg = readingPractices.length > 0
          ? Math.round(readingPractices.reduce((s, p) => s + (p.score || 0), 0) / readingPractices.length)
          : 0;

        // Vocabulary average (spelling accuracy)
        const correctSpellings = spellings.filter((s) => s.isCorrect).length;
        const vocabAvg = spellings.length > 0
          ? Math.round((correctSpellings / spellings.length) * 100)
          : 0;

        // Speaking average
        const speakingPractices = practices.filter((p) => p.type === "speaking");
        const speakingAvg = speakingPractices.length > 0
          ? Math.round(speakingPractices.reduce((s, p) => s + (p.score || 0), 0) / speakingPractices.length)
          : 0;

        // Writing average
        const writingAvg = writings.length > 0
          ? Math.round(writings.reduce((s, w) => s + (w.score || 0), 0) / writings.length)
          : 0;

        // Total practices
        const totalPractices = practices.length + spellings.length + writings.length;

        // Completion rate (completed submissions / total submissions)
        const completedSubmissions = submissions.filter((s) => s.status === "completed").length;
        const completionRate = submissions.length > 0
          ? Math.round((completedSubmissions / submissions.length) * 100)
          : 0;

        // Last login
        const lastLogin = student.lastActiveAt
          ? new Date(student.lastActiveAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
          : "未登入";

        rows.push([
          student.name,
          cls.name,
          String(readingAvg),
          String(vocabAvg),
          String(speakingAvg),
          String(writingAvg),
          String(totalPractices),
          `${completionRate}%`,
          lastLogin,
        ]);
      }
    }

    // Generate CSV string with BOM for Excel compatibility
    const BOM = "\uFEFF";
    const csvContent =
      BOM +
      headers.join(",") +
      "\n" +
      rows
        .map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const className = classId === "all" ? "全部班級" : targetClasses[0]?.name || "班級";
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${className}_成績報告_${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
