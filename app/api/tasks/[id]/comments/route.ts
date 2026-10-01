import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity, createNotification, parseMentionsAndNotify } from "@/lib/activity";

export async function POST(
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

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId: id,
        authorId: user.id,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // Log activity
    await logActivity({
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      action: "commented",
      entityType: "task",
      entityId: id,
      entityTitle: task.title,
      details: `${user.name} commented on "${task.title}".`,
    });

    // Notify task assignee
    if (task.assigneeId && task.assigneeId !== user.id) {
      await createNotification({
        workspaceId: user.currentWorkspace.id,
        userId: task.assigneeId,
        actorId: user.id,
        type: "comment",
        title: "New Task Comment",
        message: `${user.name} commented on "${task.title}": "${content.slice(0, 50)}..."`,
        link: `/tasks?taskId=${id}`,
      });
    }

    // Parse mentions
    await parseMentionsAndNotify({
      content,
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      actorName: user.name,
      entityType: "comment",
      entityTitle: task.title,
      link: `/tasks?taskId=${id}`,
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
