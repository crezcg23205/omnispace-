import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: { id, workspaceId: user.currentWorkspace.id },
      include: {
        client: true,
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            tags: { include: { tag: true } },
          },
          orderBy: { dueDate: "asc" },
        },
        documents: {
          select: { id: true, title: true, icon: true, updatedAt: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const activities = await prisma.activity.findMany({
      where: {
        workspaceId: user.currentWorkspace.id,
        entityType: "project",
        entityId: id,
      },
      include: {
        actor: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ project, activities });
  } catch (error: any) {
    console.error("Fetch project details error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.clientId !== undefined) updateData.clientId = body.clientId || null;
    if (body.progress !== undefined) updateData.progress = Number(body.progress);
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: { client: true },
    });

    await logActivity({
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      action: "updated_project",
      entityType: "project",
      entityId: id,
      entityTitle: project.name,
      details: `${user.name} updated project "${project.name}".`,
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await prisma.project.findFirst({
      where: { id, workspaceId: user.currentWorkspace.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.delete({ where: { id } });

    await logActivity({
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      action: "deleted_project",
      entityType: "project",
      entityId: id,
      entityTitle: project.name,
      details: `${user.name} deleted project "${project.name}".`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
