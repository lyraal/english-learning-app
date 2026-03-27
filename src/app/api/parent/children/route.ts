export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  if (role !== "PARENT") {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  // Get children through ParentChild relation
  const relations = await prisma.parentChild.findMany({
    where: { parentId: userId },
    include: {
      child: {
        include: {
          practiceRecords: {
            where: {
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
            select: { id: true, duration: true },
          },
        },
      },
    },
  });

  // Calculate weekly minutes for each child
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const children = await Promise.all(
    relations.map(async (rel) => {
      const weeklyRecords = await prisma.practiceRecord.findMany({
        where: {
          studentId: rel.child.id,
          createdAt: { gte: weekStart },
        },
        select: { duration: true },
      });

      const weeklyMinutes = Math.round(
        weeklyRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / 60
      );

      return {
        id: rel.child.id,
        name: rel.child.name,
        avatar: rel.child.avatar,
        points: rel.child.points,
        streak: rel.child.streak,
        lastActiveAt: rel.child.lastActiveAt,
        todayPracticeCount: rel.child.practiceRecords.length,
        weeklyMinutes,
      };
    })
  );

  return NextResponse.json({ children });
}
