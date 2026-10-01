import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity, createNotification, parseMentionsAndNotify } from "@/lib/activity";
import { sendTaskAssignmentTelegramNotification } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = user.currentWorkspace.id;

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const projectId = searchParams.get("projectId");
    const clientId = searchParams.get("clientId");
    const client = searchParams.get("client");
    const dueToday = searchParams.get("dueToday");
    const overdue = searchParams.get("overdue");
    const search = searchParams.get("search");
    const myTasks = searchParams.get("myTasks");

    const where: any = { workspaceId };

    if (status && status !== "All") {
      where.status = status;
    }
    if (priority && priority !== "All") {
      where.priority = priority;
    }
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }
    if (myTasks === "true") {
      where.assigneeId = user.id;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (clientId) {
      where.clientId = clientId;
    }
    if (client) {
      where.client = {
        name: { contains: client },
      };
    }
    if (dueToday === "true") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      where.dueDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
    if (overdue === "true") {
      const now = new Date();
      where.dueDate = {
        lt: now,
      };
      where.status = {
        not: "Done",
      };
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { position: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true, department: true },
        },
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, status: true },
        },
        client: {
          select: { id: true, name: true, company: true },
        },
        tags: {
          include: { tag: true },
        },
        subtasks: {
          orderBy: { position: "asc" },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Fetch tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = user.currentWorkspace.id;
    const body = await request.json();

    const {
      title,
      description,
      status = "Todo",
      priority = "Medium",
      assigneeId,
      projectId,
      clientId,
      startDate,
      dueDate,
      tags = [],
      subtasks = [],
    } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        workspaceId,
        creatorId: user.id,
        title: title.trim(),
        description: description || "",
        status,
        priority,
        assigneeId: assigneeId || null,
        projectId: projectId || null,
        clientId: clientId || null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: {
          create: tags.map((tagId: string) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        subtasks: {
          create: subtasks.map((st: { title: string; completed?: boolean }, idx: number) => ({
            title: typeof st === "string" ? st : st.title,
            completed: typeof st === "object" ? Boolean(st.completed) : false,
            position: idx,
          })),
        },
      },
      include: {
        assignee: true,
        project: true,
        client: true,
        tags: { include: { tag: true } },
        subtasks: true,
      },
    });

    // Activity log
    await logActivity({
      workspaceId,
      actorId: user.id,
      action: "created_task",
      entityType: "task",
      entityId: task.id,
      entityTitle: task.title,
      details: `${user.name} created task "${task.title}".`,
    });

    // Notify assignee if assigned
    if (assigneeId) {
      if (assigneeId !== user.id) {
        await createNotification({
          workspaceId,
          userId: assigneeId,
          actorId: user.id,
          type: "task_assigned",
          title: "Task Assigned",
          message: `${user.name} assigned you "${task.title}"`,
          link: `/tasks?taskId=${task.id}`,
        });
      }

      // Send real-time Telegram notification to assignee & admin
      await sendTaskAssignmentTelegramNotification({
        taskTitle: task.title,
        taskId: task.id,
        assigneeId,
        creatorName: user.name,
        projectName: task.project?.name,
        clientName: task.client?.name,
        priority: task.priority,
        dueDate: task.dueDate,
      });
    }

    // Parse mentions in description
    if (description) {
      await parseMentionsAndNotify({
        content: description,
        workspaceId,
        actorId: user.id,
        actorName: user.name,
        entityType: "task",
        entityTitle: task.title,
        link: `/tasks?taskId=${task.id}`,
      });
    }

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
