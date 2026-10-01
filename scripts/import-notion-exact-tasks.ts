import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Syncing tasks from Notion screenshot into OmniSpace SQLite database...");

  // 1. Get Workspace
  const workspace = await prisma.workspace.findFirst({
    where: { slug: "crez" },
  });

  if (!workspace) {
    throw new Error("Workspace 'crez' not found!");
  }

  // 2. Ensure Users (Muxammadraxim Baxriddin and crez)
  let muxammadraxim = await prisma.user.findFirst({
    where: { name: "Muxammadraxim Baxriddin" },
  });

  if (!muxammadraxim) {
    muxammadraxim = await prisma.user.create({
      data: {
        name: "Muxammadraxim Baxriddin",
        email: "muxammadraxim@company.com",
        passwordHash: "$2b$10$q8vjIWRUP6ue7zKePAn3PulcJYQ7WCuih9QpPLoItQvS/T9gc846a",
        department: "Production",
        role: "Member",
      },
    });
  }

  const crez = await prisma.user.findFirst({
    where: { email: "crez@company.com" },
  });

  if (!crez) {
    throw new Error("User 'crez' not found!");
  }

  // Ensure workspace membership for Muxammadraxim
  const muxMembership = await prisma.workspaceMember.findFirst({
    where: { workspaceId: workspace.id, userId: muxammadraxim.id },
  });
  if (!muxMembership) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: muxammadraxim.id,
        role: "Member",
      },
    });
    console.log("✓ Added Muxammadraxim Baxriddin to CREZ Workspace members.");
  }

  // 3. Map Clients & Projects
  const clients = await prisma.client.findMany({
    where: { workspaceId: workspace.id },
  });
  const clientMap = new Map<string, string>();
  clients.forEach((c) => clientMap.set(c.name.toLowerCase(), c.id));

  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id },
  });
  const projectMap = new Map<string, string>();
  projects.forEach((p) => {
    // map client name to project
    clients.forEach((c) => {
      if (p.name.toLowerCase().includes(c.name.toLowerCase())) {
        projectMap.set(c.name.toLowerCase(), p.id);
      }
    });
  });

  // 4. Delete old tasks in this workspace
  const deletedTasks = await prisma.task.deleteMany({
    where: { workspaceId: workspace.id },
  });
  console.log(`✓ Cleared ${deletedTasks.count} previous tasks.`);

  // 5. Raw Notion Tasks data strictly copied from user's screenshot
  const rawTasks = [
    // --- IN PROGRESS ---
    {
      title: "Danil — Video 7",
      client: "Danil",
      status: "In Progress",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Kamila — Video 3",
      client: "Kamila",
      status: "In Progress",
      priority: "Medium",
      deadline: new Date(2026, 9, 1, 16, 0), // 01/10/2026 4:00 PM
      assignee: muxammadraxim.id,
      videoNumber: null,
    },
    {
      title: "Keyko — Vidoo 1",
      client: "Keyko",
      status: "In Progress",
      priority: "High",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Study — Video 6",
      client: "Study",
      status: "In Progress",
      priority: "Medium",
      deadline: null,
      assignee: muxammadraxim.id,
      videoNumber: "6",
    },

    // --- NOT STARTED ---
    {
      title: "Danil — Video 8",
      client: "Danil",
      status: "Not Started",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Kamila — Video 4",
      client: "Kamila",
      status: "Not Started",
      priority: "Medium",
      deadline: new Date(2026, 9, 2, 16, 0), // 02/10/2026 4:00 PM
      assignee: muxammadraxim.id,
      videoNumber: null,
    },
    {
      title: "Kamila — Video 5",
      client: "Kamila",
      status: "Not Started",
      priority: "Medium",
      deadline: new Date(2026, 9, 3, 16, 0), // 03/10/2026 4:00 PM
      assignee: muxammadraxim.id,
      videoNumber: null,
    },
    {
      title: "Keyko — Vidoo 2",
      client: "Keyko",
      status: "Not Started",
      priority: "Low",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Ruslan — Video 6",
      client: "Ruslan",
      status: "Not Started",
      priority: "Medium",
      deadline: new Date(2026, 9, 1, 12, 0), // 01/10/2026 12:00 PM
      assignee: null,
      videoNumber: "6",
    },
    {
      title: "SFAD 2 animation",
      client: "SFAD",
      status: "Not Started",
      priority: "High",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },

    // --- DONE ---
    {
      title: "Bashkent — Video 1",
      client: "Bashkent",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: muxammadraxim.id,
      videoNumber: null,
    },
    {
      title: "Bashkent — Video 2",
      client: "Bashkent",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: muxammadraxim.id,
      videoNumber: null,
    },
    {
      title: "Bashkent — Video 3",
      client: "Bashkent",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Bashkent — Video 4",
      client: "Bashkent",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Bashkent — Video 5",
      client: "Bashkent",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Bashkent — Video 6",
      client: "Bashkent",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Danil — Video 1",
      client: "Danil",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Danil — Video 2",
      client: "Danil",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Danil — Video 3",
      client: "Danil",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Danil — Video 4",
      client: "Danil",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Danil — Video 5",
      client: "Danil",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Danil — Video 6",
      client: "Danil",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Doniyor aka — Video 1",
      client: "Doniyor aka",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: muxammadraxim.id,
      videoNumber: "1",
    },
    {
      title: "Doniyor aka — Video 2",
      client: "Doniyor aka",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: muxammadraxim.id,
      videoNumber: "2",
    },
    {
      title: "Doniyor aka — Video 3",
      client: "Doniyor aka",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: muxammadraxim.id,
      videoNumber: "3",
    },
    {
      title: "Kamila — Video 1",
      client: "Kamila",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: muxammadraxim.id,
      videoNumber: null,
    },
    {
      title: "Kamila — Video 2",
      client: "Kamila",
      status: "Done",
      priority: "Medium",
      deadline: new Date(2026, 8, 30, 16, 0), // 30/09/2026 4:00 PM (month 8 is Sept)
      assignee: muxammadraxim.id,
      videoNumber: null,
    },
    {
      title: "Ruslan — Video 5",
      client: "Ruslan",
      status: "Done",
      priority: "High",
      deadline: new Date(2026, 8, 30, 12, 0), // 30/09/2026 12:00 PM
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Ruslan 1",
      client: "Ruslan",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: crez.id,
      videoNumber: null,
    },
    {
      title: "Ruslan 2",
      client: "Ruslan",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Ruslan 3",
      client: "Ruslan",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "Ruslan 4",
      client: "Ruslan",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: null,
      videoNumber: null,
    },
    {
      title: "SFAD — Video 1",
      client: "SFAD",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: muxammadraxim.id,
      videoNumber: null,
    },
    {
      title: "SFAD — Video 2",
      client: "SFAD",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: muxammadraxim.id,
      videoNumber: null,
    },
    {
      title: "SFAD — Video 3",
      client: "SFAD",
      status: "Done",
      priority: "Medium",
      deadline: null,
      assignee: muxammadraxim.id,
      videoNumber: null,
    },
  ];

  console.log(`Creating ${rawTasks.length} tasks matching Notion screenshot...`);

  for (let i = 0; i < rawTasks.length; i++) {
    const item = rawTasks[i];
    const cId = clientMap.get(item.client.toLowerCase()) || null;
    const pId = projectMap.get(item.client.toLowerCase()) || null;

    await prisma.task.create({
      data: {
        workspaceId: workspace.id,
        creatorId: crez.id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        clientId: cId,
        projectId: pId,
        dueDate: item.deadline,
        videoNumber: item.videoNumber,
        assigneeId: item.assignee,
        position: i,
      },
    });
  }

  console.log(`✓ Successfully imported all ${rawTasks.length} tasks!`);

  // 6. Update Project Progress Rollups
  for (const project of projects) {
    const pTasks = await prisma.task.findMany({
      where: { projectId: project.id },
    });
    const total = pTasks.length;
    const completed = pTasks.filter((t) => t.status === "Done").length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await prisma.project.update({
      where: { id: project.id },
      data: { progress },
    });

    console.log(`  - Project '${project.name}': ${completed}/${total} tasks completed (${progress}%)`);
  }

  console.log("🎉 All 35 Notion tasks imported and fully relational!");
}

main()
  .catch((e) => {
    console.error("Error importing tasks:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
