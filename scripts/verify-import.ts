import { prisma } from "../lib/prisma";

async function verify() {
  const tasks = await prisma.task.findMany({
    include: { client: true, project: true, assignee: true, attachments: true },
    orderBy: { position: "asc" },
  });

  console.log(`Total tasks: ${tasks.length}`);
  const byStatus: Record<string, number> = {};
  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  }
  console.log("By Status:", byStatus);

  const withAttach = tasks.filter(t => t.attachments.length > 0);
  console.log(`Tasks with attachments (${withAttach.length}):`);
  for (const t of withAttach) {
    console.log(`  - ${t.title}: ${t.attachments.map(a => a.name).join(", ")}`);
  }

  const withDue = tasks.filter(t => t.dueDate);
  console.log(`Tasks with deadlines (${withDue.length}):`);
  for (const t of withDue) {
    console.log(`  - ${t.title} [${t.status}] Due: ${t.dueDate?.toISOString()} | Assigned: ${t.assignee?.name}`);
  }

  await prisma.$disconnect();
}

verify();
