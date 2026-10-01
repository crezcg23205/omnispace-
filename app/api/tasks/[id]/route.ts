import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity, createNotification, parseMentionsAndNotify } from "@/lib/activity";
import { sendTaskAssignmentTelegramNotification } from "@/lib/telegram";

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
    const task = await prisma.task.findFirst({
      where: { id, workspaceId: user.currentWorkspace.id },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true, department: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        project: true,
        client: true,
        tags: { include: { tag: true } },
        subtasks: { orderBy: { position: "asc" } },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true, role: true } },
            replies: {
              include: {
                author: { select: { id: true, name: true, avatar: true } },
              },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: "desc" },
        },
        attachments: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Also get task activities
    const activities = await prisma.activity.findMany({
      where: {
        workspaceId: user.currentWorkspace.id,
        entityType: "task",
        entityId: task.id,
      },
      include: {
        actor: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ task, activities });
  } catch (error: any) {
    console.error("Fetch task details error:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
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
    const existing = await prisma.task.findFirst({
      where: { id, workspaceId: user.currentWorkspace.id },
      include: { assignee: true, project: true, client: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};
    const changes: string[] = [];

    if (body.title !== undefined) {
      updateData.title = body.title.trim();
      changes.push(`title to "${body.title}"`);
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.status !== undefined && body.status !== existing.status) {
      updateData.status = body.status;
      changes.push(`status to ${body.status}`);

      // Notify assignee if status changed by someone else
      if (existing.assigneeId && existing.assigneeId !== user.id) {
        await createNotification({
          workspaceId: user.currentWorkspace.id,
          userId: existing.assigneeId,
          actorId: user.id,
          type: "status_changed",
          title: "Task Status Updated",
          message: `${user.name} changed status of "${existing.title}" to ${body.status}`,
          link: `/tasks?taskId=${existing.id}`,
        });
      }
    }
    if (body.priority !== undefined && body.priority !== existing.priority) {
      updateData.priority = body.priority;
      changes.push(`priority to ${body.priority}`);
    }
    if (body.assigneeId !== undefined && body.assigneeId !== existing.assigneeId) {
      updateData.assigneeId = body.assigneeId || null;
      if (body.assigneeId) {
        const newAssignee = await prisma.user.findUnique({ where: { id: body.assigneeId } });
        changes.push(`assignee to ${newAssignee?.name}`);
        if (body.assigneeId !== user.id) {
          await createNotification({
            workspaceId: user.currentWorkspace.id,
            userId: body.assigneeId,
            actorId: user.id,
            type: "task_assigned",
            title: "Task Assigned",
            message: `${user.name} assigned you "${existing.title}"`,
            link: `/tasks?taskId=${existing.id}`,
          });
        }

        // Send real-time Telegram notification to assignee & admin
        await sendTaskAssignmentTelegramNotification({
          taskTitle: existing.title,
          taskId: existing.id,
          assigneeId: body.assigneeId,
          creatorName: user.name,
          projectName: existing.project?.name,
          clientName: existing.client?.name,
          priority: existing.priority,
          dueDate: existing.dueDate,
        });
      } else {
        changes.push("unassigned");
      }
    }
    if (body.projectId !== undefined) {
      updateData.projectId = body.projectId || null;
    }
    if (body.clientId !== undefined) {
      updateData.clientId = body.clientId || null;
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      changes.push(`due date to ${body.dueDate ? body.dueDate.split("T")[0] : "None"}`);
    }
    if (body.position !== undefined) {
      updateData.position = body.position;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: true,
        project: true,
        client: true,
        tags: { include: { tag: true } },
        subtasks: true,
      },
    });

    if (changes.length > 0) {
      await logActivity({
        workspaceId: user.currentWorkspace.id,
        actorId: user.id,
        action: body.status !== undefined && body.status !== existing.status ? "updated_status" : "updated_task",
        entityType: "task",
        entityId: id,
        entityTitle: updatedTask.title,
        details: `${user.name} updated "${updatedTask.title}": ${changes.join(", ")}.`,
      });
    }

    // Check for mentions if description was edited
    if (body.description) {
      await parseMentionsAndNotify({
        content: body.description,
        workspaceId: user.currentWorkspace.id,
        actorId: user.id,
        actorName: user.name,
        entityType: "task",
        entityTitle: updatedTask.title,
        link: `/tasks?taskId=${updatedTask.id}`,
      });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
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
    const task = await prisma.task.findFirst({
      where: { id, workspaceId: user.currentWorkspace.id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    await logActivity({
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      action: "deleted_task",
      entityType: "task",
      entityId: id,
      entityTitle: task.title,
      details: `${user.name} deleted task "${task.title}".`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
