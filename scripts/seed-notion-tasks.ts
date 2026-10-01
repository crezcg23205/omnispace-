import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function seedNotionStyle() {
  console.log("Seeding exact Notion Workspace tasks from screenshot...");

  // Get active workspace or create CREZ
  let workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: "CREZ Workspace", slug: "crez", icon: "📁" },
    });
  }

  // Ensure Muxammadraxim Baxriddin and crez users exist
  const passwordHash = await bcrypt.hash("password123", 10);

  const muxammadraxim = await prisma.user.upsert({
    where: { email: "muxammadraxim@company.com" },
    update: { name: "Muxammadraxim Baxriddin" },
    create: {
      name: "Muxammadraxim Baxriddin",
      email: "muxammadraxim@company.com",
      passwordHash,
      department: "Production",
      role: "Member",
    },
  });

  const crezUser = await prisma.user.upsert({
    where: { email: "crez@company.com" },
    update: { name: "crez" },
    create: {
      name: "crez",
      email: "crez@company.com",
      passwordHash,
      department: "Management",
      role: "Owner",
    },
  });

  // Ensure workspace memberships
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: muxammadraxim.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: muxammadraxim.id,
      role: "Member",
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: crezUser.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: crezUser.id,
      role: "Owner",
    },
  });

  // Clients mapping
  const clientNames = [
    { name: "Danil", company: "Danil" },
    { name: "Kamila", company: "Kamila" },
    { name: "Keyko", company: "Keyko" },
    { name: "Study", company: "Study" },
    { name: "Ruslan", company: "Ruslan" },
    { name: "SFAD", company: "SFAD" },
    { name: "Bashkent", company: "Bashkent" },
    { name: "Doniyor aka", company: "Doniyor aka" },
  ];

  const clientMap = new Map<string, string>();
  for (const c of clientNames) {
    let client = await prisma.client.findFirst({
      where: { workspaceId: workspace.id, name: c.name },
    });
    if (!client) {
      client = await prisma.client.create({
        data: { workspaceId: workspace.id, name: c.name, company: c.company },
      });
    }
    clientMap.set(c.name, client.id);
  }

  // Clear existing tasks
  await prisma.subtask.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskTag.deleteMany();
  await prisma.task.deleteMany();

  // Tasks from screenshot
  const tasksData = [
    // --- IN PROGRESS ---
    {
      title: "Danil — Video 7",
      client: "Danil",
      status: "In Progress",
      priority: "Medium",
      assigneeId: muxammadraxim.id,
      dueDate: null,
      videoNumber: null,
    },
    {
      title: "Kamila — Video 3",
      client: "Kamila",
      status: "In Progress",
      priority: "Medium",
      dueDate: new Date("2026-10-01T16:00:00"),
      videoNumber: null,
    },
    {
      title: "Keyko — Video 1",
      client: "Keyko",
      status: "In Progress",
      priority: "High",
      dueDate: null,
      videoNumber: null,
    },
    {
      title: "Study — Video 6",
      client: "Study",
      status: "In Progress",
      priority: "Medium",
      assigneeId: muxammadraxim.id,
      dueDate: null,
      videoNumber: "6",
    },

    // --- NOT STARTED ---
    {
      title: "Danil — Video 8",
      client: "Danil",
      status: "Not Started",
      priority: "Medium",
      dueDate: null,
      videoNumber: null,
    },
    {
      title: "Kamila — Video 4",
      client: "Kamila",
      status: "Not Started",
      priority: "Medium",
      assigneeId: muxammadraxim.id,
      dueDate: new Date("2026-10-02T16:00:00"),
      videoNumber: null,
    },
    {
      title: "Kamila — Video 5",
      client: "Kamila",
      status: "Not Started",
      priority: "Medium",
      assigneeId: muxammadraxim.id,
      dueDate: new Date("2026-10-03T16:00:00"),
      videoNumber: null,
    },
    {
      title: "Keyko — Video 2",
      client: "Keyko",
      status: "Not Started",
      priority: "Low",
      dueDate: null,
      videoNumber: null,
    },
    {
      title: "Ruslan — Video 6",
      client: "Ruslan",
      status: "Not Started",
      priority: "Medium",
      dueDate: new Date("2026-10-01T12:00:00"),
      videoNumber: "6",
    },
    {
      title: "SFAD 2 animation",
      client: "SFAD",
      status: "Not Started",
      priority: "High",
      dueDate: null,
      videoNumber: null,
    },

    // --- DONE ---
    { title: "Bashkent — Video 1", client: "Bashkent", status: "Done", priority: "Medium", assigneeId: muxammadraxim.id },
    { title: "Bashkent — Video 2", client: "Bashkent", status: "Done", priority: "Medium", assigneeId: muxammadraxim.id },
    { title: "Bashkent — Video 3", client: "Bashkent", status: "Done", priority: "Medium" },
    { title: "Bashkent — Video 4", client: "Bashkent", status: "Done", priority: "Medium" },
    { title: "Bashkent — Video 5", client: "Bashkent", status: "Done", priority: "Medium" },
    { title: "Bashkent — Video 6", client: "Bashkent", status: "Done", priority: "Medium" },
    { title: "Danil — Video 1", client: "Danil", status: "Done", priority: "Medium" },
    { title: "Danil — Video 2", client: "Danil", status: "Done", priority: "Medium" },
    { title: "Danil — Video 3", client: "Danil", status: "Done", priority: "Medium" },
    { title: "Danil — Video 4", client: "Danil", status: "Done", priority: "Medium" },
    { title: "Danil — Video 5", client: "Danil", status: "Done", priority: "Medium" },
    { title: "Danil — Video 6", client: "Danil", status: "Done", priority: "Medium" },
    { title: "Doniyor aka — Video 1", client: "Doniyor aka", status: "Done", priority: "Medium", assigneeId: muxammadraxim.id, videoNumber: "1" },
    { title: "Doniyor aka — Video 2", client: "Doniyor aka", status: "Done", priority: "Medium", assigneeId: muxammadraxim.id, videoNumber: "2" },
    { title: "Doniyor aka — Video 3", client: "Doniyor aka", status: "Done", priority: "Medium", assigneeId: muxammadraxim.id, videoNumber: "3" },
    { title: "Kamila — Video 1", client: "Kamila", status: "Done", priority: "Medium", assigneeId: muxammadraxim.id },
    { title: "Kamila — Video 2", client: "Kamila", status: "Done", priority: "Medium", assigneeId: muxammadraxim.id, dueDate: new Date("2026-09-30T16:00:00") },
    { title: "Ruslan — Video 5", client: "Ruslan", status: "Done", priority: "High", dueDate: new Date("2026-09-30T12:00:00") },
    { title: "Ruslan 1", client: "Ruslan", status: "Done", priority: "Medium", assigneeId: crezUser.id },
    { title: "Ruslan 2", client: "Ruslan", status: "Done", priority: "Medium" },
    { title: "Ruslan 3", client: "Ruslan", status: "Done", priority: "Medium" },
    { title: "Ruslan 4", client: "Ruslan", status: "Done", priority: "Medium" },
  ];

  for (let i = 0; i < tasksData.length; i++) {
    const t = tasksData[i];
    await prisma.task.create({
      data: {
        workspaceId: workspace.id,
        creatorId: crezUser.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        clientId: clientMap.get(t.client) || null,
        assigneeId: t.assigneeId || null,
        dueDate: t.dueDate || null,
        videoNumber: t.videoNumber || null,
        position: i,
      },
    });
  }

  console.log(`Successfully seeded ${tasksData.length} Notion-style tasks!`);
  await prisma.$disconnect();
}

seedNotionStyle();
