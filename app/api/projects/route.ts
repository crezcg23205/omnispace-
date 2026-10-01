import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = { workspaceId: user.currentWorkspace.id };
    if (status && status !== "All") where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: true,
        tasks: {
          select: { id: true, status: true, priority: true, dueDate: true, assigneeId: true },
        },
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const enriched = projects.map((p) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t) => t.status === "Done").length;
      const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : p.progress;

      return {
        ...p,
        totalTasks,
        completedTasks,
        progress: calculatedProgress,
      };
    });

    return NextResponse.json({ projects: enriched });
  } catch (error: any) {
    console.error("Fetch projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, clientId, status = "Active", startDate, deadline } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        workspaceId: user.currentWorkspace.id,
        name: name.trim(),
        description: description || "",
        clientId: clientId || null,
        status,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        progress: 0,
      },
      include: { client: true },
    });

    await logActivity({
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      action: "created_project",
      entityType: "project",
      entityId: project.id,
      entityTitle: project.name,
      details: `${user.name} created project "${project.name}".`,
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
