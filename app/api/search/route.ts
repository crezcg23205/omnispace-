import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 1) {
      return NextResponse.json({ results: [] });
    }

    const workspaceId = user.currentWorkspace.id;

    const [tasks, projects, clients, docs, members] = await Promise.all([
      prisma.task.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
        include: { assignee: true, project: true },
        take: 6,
      }),
      prisma.project.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.client.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: q } },
            { company: { contains: q } },
            { contact: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.document.findMany({
        where: {
          workspaceId,
          isArchived: false,
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
          ],
        },
        take: 5,
      }),
      prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          user: {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { department: { contains: q } },
            ],
          },
        },
        include: { user: true },
        take: 4,
      }),
    ]);

    const results = [
      ...tasks.map((t) => ({
        id: t.id,
        type: "TASK",
        title: t.title,
        subtitle: `Status: ${t.status} • Priority: ${t.priority}${t.assignee ? ` • ${t.assignee.name}` : ""}`,
        url: `/tasks?taskId=${t.id}`,
      })),
      ...projects.map((p) => ({
        id: p.id,
        type: "PROJECT",
        title: p.name,
        subtitle: `Status: ${p.status} • Progress: ${p.progress}%`,
        url: `/projects?projectId=${p.id}`,
      })),
      ...clients.map((c) => ({
        id: c.id,
        type: "CLIENT",
        title: c.name,
        subtitle: `${c.company}${c.email ? ` • ${c.email}` : ""}`,
        url: `/clients?clientId=${c.id}`,
      })),
      ...docs.map((d) => ({
        id: d.id,
        type: "DOCUMENT",
        title: d.title,
        subtitle: `Document / Wiki page ${d.icon || ""}`,
        url: `/documents?docId=${d.id}`,
      })),
      ...members.map((m) => ({
        id: m.userId,
        type: "MEMBER",
        title: m.user.name,
        subtitle: `${m.role} • ${m.user.department || "General"} (${m.user.email})`,
        url: `/team`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 });
  }
}
