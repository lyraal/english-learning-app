import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import {
  seedArticles,
  seedTeacher,
  seedStudents,
  seedClass,
} from "../src/data/seed-articles";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 開始 seed 資料...");

  // Clean existing data
  await prisma.pointHistory.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.spellingRecord.deleteMany();
  await prisma.practiceRecord.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.word.deleteMany();
  await prisma.classStudent.deleteMany();
  await prisma.class.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();

  console.log("  ✅ 清除舊資料完成");

  // Create teacher
  const teacher = await prisma.user.create({
    data: {
      name: seedTeacher.name,
      email: seedTeacher.email,
      password: await hash(seedTeacher.password, 10),
      role: seedTeacher.role,
      avatar: "👩‍🏫",
    },
  });
  console.log(`  ✅ 建立老師：${teacher.name} (${teacher.email})`);

  // Create students
  const students = [];
  for (const s of seedStudents) {
    const student = await prisma.user.create({
      data: {
        name: s.name,
        username: s.username,
        password: await hash(s.password, 10),
        role: "STUDENT",
        points: Math.floor(Math.random() * 200),
        streak: Math.floor(Math.random() * 10),
        avatar: ["😊", "😎", "🤓"][students.length % 3],
      },
    });
    students.push(student);
    console.log(`  ✅ 建立學生：${student.name} (${student.username})`);
  }

  // Create class
  const classRoom = await prisma.class.create({
    data: {
      name: seedClass.name,
      gradeLevel: seedClass.gradeLevel,
      description: seedClass.description,
      teacherId: teacher.id,
    },
  });
  console.log(`  ✅ 建立班級：${classRoom.name}`);

  // Add students to class
  for (const student of students) {
    await prisma.classStudent.create({
      data: { classId: classRoom.id, studentId: student.id },
    });
  }
  console.log(`  ✅ 將 ${students.length} 位學生加入班級`);

  // Create articles with words and exercises
  for (const articleData of seedArticles) {
    const article = await prisma.article.create({
      data: {
        title: articleData.title,
        titleZh: articleData.titleZh,
        content: articleData.content,
        contentZh: articleData.contentZh,
        level: articleData.level,
        gradeLevel: articleData.gradeLevel,
        topic: articleData.topic,
        authorId: teacher.id,
        isPublished: true,
      },
    });

    // Create words
    for (const wordData of articleData.words) {
      await prisma.word.create({
        data: {
          ...wordData,
          articleId: article.id,
        },
      });
    }

    // Create exercises
    for (const exerciseData of articleData.exercises) {
      await prisma.exercise.create({
        data: {
          ...exerciseData,
          articleId: article.id,
        },
      });
    }

    console.log(
      `  ✅ 建立文章：${article.title} (${articleData.words.length} 單字, ${articleData.exercises.length} 練習題)`
    );
  }

  // Create sample practice records for demo
  const articles = await prisma.article.findMany();
  for (const student of students) {
    for (let i = 0; i < 3; i++) {
      const article = articles[Math.floor(Math.random() * articles.length)];
      await prisma.practiceRecord.create({
        data: {
          studentId: student.id,
          articleId: article.id,
          type: ["speaking", "reading", "vocabulary"][i % 3],
          score: Math.floor(Math.random() * 40) + 60,
          accuracy: Math.floor(Math.random() * 30) + 70,
          fluency: Math.floor(Math.random() * 30) + 65,
          completeness: Math.floor(Math.random() * 20) + 80,
          duration: Math.floor(Math.random() * 120) + 30,
        },
      });
    }
  }
  console.log("  ✅ 建立範例練習紀錄");

  console.log("\n🎉 Seed 完成！");
  console.log(`   老師帳號：${seedTeacher.email} / ${seedTeacher.password}`);
  console.log(`   學生帳號：student1 / 123456`);
}

main()
  .catch((e) => {
    console.error("❌ Seed 失敗：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
