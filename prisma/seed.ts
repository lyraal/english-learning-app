import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import {
  seedArticles,
  seedTeacher,
  seedStudents,
  seedClass,
} from "../src/data/seed-articles";
import { seedArticlesAdvanced } from "../src/data/seed-articles-advanced";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 開始 seed 資料...");

  // Clean existing data (in correct order for FK constraints)
  await prisma.dailyMission.deleteMany();
  await prisma.writingSubmission.deleteMany();
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
  await prisma.parentChild.deleteMany();
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
  const students: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
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

  // Category mapping for existing articles
  const categoryMap: Record<string, string> = {
    "動物": "nature",
    "家庭": "daily_life",
    "戶外活動": "daily_life",
    "學校生活": "daily_life",
    "食物/水果": "daily_life",
  };

  // Create original articles (Level 1-3)
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
        category: categoryMap[articleData.topic || ""] || "daily_life",
        authorId: teacher.id,
        isPublished: true,
      },
    });

    for (const wordData of articleData.words) {
      await prisma.word.create({
        data: { ...wordData, articleId: article.id },
      });
    }

    for (const exerciseData of articleData.exercises) {
      await prisma.exercise.create({
        data: { ...exerciseData, articleId: article.id },
      });
    }

    console.log(
      `  ✅ 建立文章：${article.title} (${articleData.words.length} 單字, ${articleData.exercises.length} 練習題)`
    );
  }

  // Create advanced articles (Level 4-6)
  for (const articleData of seedArticlesAdvanced) {
    const article = await prisma.article.create({
      data: {
        title: articleData.title,
        titleZh: articleData.titleZh,
        content: articleData.content,
        contentZh: articleData.contentZh,
        level: articleData.level,
        gradeLevel: articleData.gradeLevel,
        topic: articleData.topic,
        category: articleData.category,
        authorId: teacher.id,
        isPublished: true,
      },
    });

    for (const wordData of articleData.words) {
      await prisma.word.create({
        data: { ...wordData, articleId: article.id },
      });
    }

    for (const exerciseData of articleData.exercises) {
      await prisma.exercise.create({
        data: { ...exerciseData, articleId: article.id },
      });
    }

    console.log(
      `  ✅ 建立進階文章：${article.title} (Lv.${articleData.gradeLevel}, ${articleData.words.length} 單字, ${articleData.exercises.length} 練習題)`
    );
  }

  // Create sample practice records for demo
  const articles = await prisma.article.findMany();
  for (const student of students) {
    for (let i = 0; i < 5; i++) {
      const article = articles[Math.floor(Math.random() * articles.length)];
      const types = ["speaking", "reading", "vocabulary", "writing"];
      await prisma.practiceRecord.create({
        data: {
          studentId: student.id,
          articleId: article.id,
          type: types[i % types.length],
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

  // Create sample achievements for first student
  if (students.length > 0) {
    await prisma.achievement.create({
      data: {
        studentId: students[0].id,
        badge: "first_speaking",
        title: "初學者",
        icon: "🌟",
      },
    });
    await prisma.achievement.create({
      data: {
        studentId: students[0].id,
        badge: "streak_3",
        title: "連續 3 天",
        icon: "🔥",
      },
    });
    console.log("  ✅ 建立範例徽章");
  }

  // Create parent user
  const parent1 = await prisma.user.create({
    data: {
      name: "王爸爸",
      username: "parent1",
      password: await hash("123456", 10),
      role: "PARENT",
      avatar: "👨",
    },
  });
  console.log(`  ✅ 建立家長：${parent1.name} (${parent1.username})`);

  // Link parent to first student
  if (students.length > 0) {
    await prisma.parentChild.create({
      data: {
        parentId: parent1.id,
        childId: students[0].id,
      },
    });
    console.log(`  ✅ 建立親子關聯：${parent1.name} → ${students[0].name}`);
  }

  console.log("\n🎉 Seed 完成！");
  console.log(`   老師帳號：${seedTeacher.email} / ${seedTeacher.password}`);
  console.log(`   學生帳號：student1 / 123456`);
  console.log(`   家長帳號：parent1 / 123456`);
  console.log(`   共 ${seedArticles.length + seedArticlesAdvanced.length} 篇文章 (Level 1-6)`);
}

main()
  .catch((e) => {
    console.error("❌ Seed 失敗：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
