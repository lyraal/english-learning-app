export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role === "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = (session.user as any).id;
    const data = await req.json();
    const { title, description, types, classIds, studentIds, articleId, dueDate } = data;

    if (!title || !types || types.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const createdAssignments = [];

    // Mode 1: Assign by class - create one assignment per type per class
    if (classIds && classIds.length > 0) {
      for (const classId of classIds) {
        // Verify teacher owns this class
        const cls = await prisma.class.findFirst({
          where: { id: classId, teacherId },
          include: { students: true },
        });
        if (!cls) continue;

        for (const type of types) {
          const assignment = await prisma.assignment.create({
            data: {
              title: types.length > 1 ? `${title}（${getTypeLabel(type)}）` : title,
              description: description || null,
              type,
              classId,
              articleId: articleId || null,
              teacherId,
              dueDate: dueDate ? new Date(dueDate) : null,
            },
          });

          // Create submissions for all students in the class
          const submissionData = cls.students.map((s) => ({
            assignmentId: assignment.id,
            studentId: s.studentId,
          }));

          if (submissionData.length > 0) {
            await prisma.assignmentSubmission.createMany({
              data: submissionData,
              skipDuplicates: true,
            });
          }

          createdAssignments.push(assignment);
        }
      }
    }
    // Mode 2: Assign by individual students
    else if (studentIds && studentIds.length > 0) {
      // Find a class for these students (use first student's class)
      const enrollment = await prisma.classStudent.findFirst({
        where: { studentId: studentIds[0] },
      });

      if (!enrollment) {
        return NextResponse.json({ error: "Students not in any class" }, { status: 400 });
      }

      for (const type of types) {
        const assignment = await prisma.assignment.create({
          data: {
            title: types.length > 1 ? `${title}（${getTypeLabel(type)}）` : title,
            description: description || null,
            type,
            classId: enrollment.classId,
            articleId: articleId || null,
            teacherId,
            dueDate: dueDate ? new Date(dueDate) : null,
          },
        });

        // Create submissions for selected students
        const submissionData = studentIds.map((sid: string) => ({
          assignmentId: assignment.id,
          studentId: sid,
        }));

        await prisma.assignmentSubmission.createMany({
          data: submissionData,
          skipDuplicates: true,
        });

        createdAssignments.push(assignment);
      }
    } else {
      return NextResponse.json({ error: "Must select classes or students" }, { status: 400 });
    }

    return NextResponse.json({
      message: `成功建立 ${createdAssignments.length} 份作業`,
      assignments: createdAssignments,
    }, { status: 201 });
  } catch (error) {
    console.error("Batch assignment error:", error);
    return NextResponse.json({ error: "Failed to create assignments" }, { status: 500 });
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "READING": return "閱讀";
    case "VOCABULARY": return "單字";
    case "SPEAKING": return "口說";
    case "WRITING": return "寫作";
    default: return type;
  }
}
