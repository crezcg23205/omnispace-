import { prisma } from "../lib/prisma";

async function clearTasks() {
  console.log("Clearing all existing tasks...");
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.taskTag.deleteMany();
  const deleted = await prisma.task.deleteMany();
  console.log(`Successfully deleted ${deleted.count} tasks.`);
  await prisma.$disconnect();
}

clearTasks();
