import { prisma } from "../lib/prisma";

async function main() {
  console.log("Connecting all Notion relational entities (Projects, Clients, Tasks)...");

  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    console.error("No workspace found!");
    process.exit(1);
  }

  // 1. Clean up old unused demo projects and clients
  const oldClients = ["Smartcast Media", "Apex Dynamics", "Nordic Horizon"];
  for (const oc of oldClients) {
    const c = await prisma.client.findFirst({
      where: { workspaceId: workspace.id, name: oc },
    });
    if (c) {
      await prisma.project.deleteMany({ where: { clientId: c.id } });
      await prisma.client.delete({ where: { id: c.id } });
      console.log(`Removed unused demo client and project: ${oc}`);
    }
  }

  // 2. Client to Project mapping for user's real video production lines
  const clientProjectDefinitions = [
    {
      clientName: "Danil",
      projectName: "Danil — Video Series",
      description: "Full episodic video editing, sound design, color grading, and thumbnail packaging for Danil.",
      status: "Active",
      deadline: new Date(Date.now() + 15 * 86400000),
    },
    {
      clientName: "Kamila",
      projectName: "Kamila — Media Campaign",
      description: "Social media video deliverables, lifestyle reels, and short-form content series for Kamila.",
      status: "Active",
      deadline: new Date(Date.now() + 10 * 86400000),
    },
    {
      clientName: "Keyko",
      projectName: "Keyko — Production Hub",
      description: "Commercial promo videos, dynamic transitions, and product showcase edits for Keyko.",
      status: "Active",
      deadline: new Date(Date.now() + 7 * 86400000),
    },
    {
      clientName: "Study",
      projectName: "Study — Educational Series",
      description: "Educational course videos, on-screen typography, and interactive lesson modules.",
      status: "Active",
      deadline: new Date(Date.now() + 20 * 86400000),
    },
    {
      clientName: "Ruslan",
      projectName: "Ruslan — Content Series",
      description: "Documentary vlog series, narrative storytelling, sound mixing, and multi-cam sync for Ruslan.",
      status: "Completed",
      deadline: new Date(Date.now() - 2 * 86400000),
    },
    {
      clientName: "SFAD",
      projectName: "SFAD — 3D & Animation Hub",
      description: "High-end 2D/3D motion graphics, brand identity bumpers, and visual effects animations.",
      status: "Active",
      deadline: new Date(Date.now() + 5 * 86400000),
    },
    {
      clientName: "Bashkent",
      projectName: "Bashkent — Video Production",
      description: "Commercial video spots, promotional campaigns, and brand storytelling deliverables.",
      status: "Completed",
      deadline: new Date(Date.now() - 1 * 86400000),
    },
    {
      clientName: "Doniyor aka",
      projectName: "Doniyor aka — Video Production",
      description: "Personal brand videos, masterclass recordings, and long-form interview series.",
      status: "Active",
      deadline: new Date(Date.now() + 12 * 86400000),
    },
  ];

  for (const def of clientProjectDefinitions) {
    let client = await prisma.client.findFirst({
      where: { workspaceId: workspace.id, name: def.clientName },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          workspaceId: workspace.id,
          name: def.clientName,
          company: `${def.clientName} Productions`,
        },
      });
    }

    // Find or create project
    let project = await prisma.project.findFirst({
      where: { workspaceId: workspace.id, clientId: client.id },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          workspaceId: workspace.id,
          clientId: client.id,
          name: def.projectName,
          description: def.description,
          status: def.status,
          deadline: def.deadline,
        },
      });
      console.log(`Created Project: ${project.name}`);
    } else {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          name: def.projectName,
          description: def.description,
          status: def.status,
        },
      });
    }

    // Link all tasks of this client to this project
    const updateResult = await prisma.task.updateMany({
      where: {
        workspaceId: workspace.id,
        clientId: client.id,
      },
      data: {
        projectId: project.id,
      },
    });

    console.log(`Linked ${updateResult.count} tasks for client "${client.name}" to project "${project.name}"`);

    // Calculate real progress
    const allProjectTasks = await prisma.task.findMany({
      where: { projectId: project.id },
      select: { status: true },
    });

    const total = allProjectTasks.length;
    const completed = allProjectTasks.filter((t) => t.status === "Done").length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await prisma.project.update({
      where: { id: project.id },
      data: { progress },
    });

    console.log(`Project "${project.name}": ${completed}/${total} done (${progress}%)`);
  }

  console.log("Successfully connected all Projects, Clients, and Tasks in Notion relational architecture!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
