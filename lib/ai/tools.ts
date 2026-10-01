import { prisma } from "../prisma";
import { logActivity, createNotification, parseMentionsAndNotify } from "../activity";
import { sendTaskAssignmentTelegramNotification } from "../telegram";

export interface ToolContext {
  workspaceId: string;
  userId: string;
  userName: string;
}

// Function declarations schema for Gemini
export const aiToolDeclarations = [
  {
    name: "search_tasks",
    description: "Search for tasks in the company workspace by title, status, priority, assignee name, or project name.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        query: { type: "STRING" as const, description: "Text to search in task title or description" },
        status: { type: "STRING" as const, description: "Task status: Backlog, Todo, In Progress, Review, Done, Cancelled" },
        priority: { type: "STRING" as const, description: "Task priority: No Priority, Low, Medium, High, Urgent" },
        assigneeName: { type: "STRING" as const, description: "Name of the person assigned to the task" },
        projectName: { type: "STRING" as const, description: "Name of the associated project" },
        clientName: { type: "STRING" as const, description: "Name of the client associated with the task (e.g. 'Danil', 'Kamila', 'Keyko', 'Study')" },
      },
    },
  },
  {
    name: "create_task",
    description: "Create a new task in the workspace database. Grounded in real workspace projects and team members.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        title: { type: "STRING" as const, description: "The task title (required)" },
        description: { type: "STRING" as const, description: "Detailed description of the task. Can include @Name mentions" },
        status: { type: "STRING" as const, description: "Status: Backlog, Todo, In Progress, Review, Done, Cancelled. Default is Todo" },
        priority: { type: "STRING" as const, description: "Priority: No Priority, Low, Medium, High, Urgent. Default is Medium" },
        assigneeName: { type: "STRING" as const, description: "Full or first name of team member to assign (e.g. 'Ali', 'Aziz')" },
        projectName: { type: "STRING" as const, description: "Name of project to link this task to (e.g. 'Smartcast Media Platform')" },
        clientName: { type: "STRING" as const, description: "Name of client to link this task to (e.g. 'Smartcast Inc.')" },
        dueDate: { type: "STRING" as const, description: "Due date in ISO format or relative (e.g. 2026-10-02 or tomorrow)" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description: "Update an existing task in the workspace database (change status, priority, assignee, due date, or title).",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        taskId: { type: "STRING" as const, description: "Task ID if known" },
        taskTitleQuery: { type: "STRING" as const, description: "Task title to look up if taskId is unknown" },
        title: { type: "STRING" as const, description: "New title for the task" },
        status: { type: "STRING" as const, description: "New status: Backlog, Todo, In Progress, Review, Done, Cancelled" },
        priority: { type: "STRING" as const, description: "New priority: No Priority, Low, Medium, High, Urgent" },
        assigneeName: { type: "STRING" as const, description: "New assignee name (e.g. 'Aziz', 'Ali', 'Muhammadamin')" },
        dueDate: { type: "STRING" as const, description: "New due date" },
      },
    },
  },
  {
    name: "delete_task",
    description: "Delete a task from the workspace. Requires user confirmation if not explicitly confirmed.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        taskId: { type: "STRING" as const, description: "The ID of the task to delete" },
        taskTitleQuery: { type: "STRING" as const, description: "Title of the task if ID unknown" },
        confirmed: { type: "BOOLEAN" as const, description: "True if the user has confirmed deletion" },
      },
    },
  },
  {
    name: "get_overdue_tasks",
    description: "Fetch all overdue tasks in the workspace (due date in the past and not Done/Cancelled).",
    parameters: {
      type: "OBJECT" as const,
      properties: {},
    },
  },
  {
    name: "get_my_tasks",
    description: "Get tasks currently assigned to the logged-in user.",
    parameters: {
      type: "OBJECT" as const,
      properties: {},
    },
  },
  {
    name: "search_projects",
    description: "Search and list company projects with their status, client, and progress.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        query: { type: "STRING" as const, description: "Project name or description query" },
        status: { type: "STRING" as const, description: "Status: Planning, Active, On Hold, Completed, Archived" },
      },
    },
  },
  {
    name: "create_project",
    description: "Create a new project in the workspace.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        name: { type: "STRING" as const, description: "Project name (required)" },
        description: { type: "STRING" as const, description: "Project description and scope" },
        clientName: { type: "STRING" as const, description: "Client company name to associate" },
        deadline: { type: "STRING" as const, description: "Project target deadline" },
      },
      required: ["name"],
    },
  },
  {
    name: "search_clients",
    description: "Search clients database for company name, contact person, or notes.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        query: { type: "STRING" as const, description: "Client name, company, or contact query" },
      },
    },
  },
  {
    name: "search_documents",
    description: "Search company wiki, SOPs, brand guidelines, and documents.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        query: { type: "STRING" as const, description: "Keywords to search in document titles and contents" },
      },
    },
  },
  {
    name: "create_page",
    description: "Create a new document/page in the Notion-style company wiki.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        title: { type: "STRING" as const, description: "Page title (required)" },
        content: { type: "STRING" as const, description: "Initial text content or outline" },
      },
      required: ["title"],
    },
  },
  {
    name: "get_team_members",
    description: "Get all members of the company workspace with their roles and departments.",
    parameters: {
      type: "OBJECT" as const,
      properties: {},
    },
  },
  {
    name: "remove_team_member",
    description: "Remove one or all other team members from the company workspace. Can delete/remove all members except the current user when requested ('barchani uchir', 'faqat meni qoldir', 'remove all except me').",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        memberName: { type: "STRING" as const, description: "Name of the team member to remove" },
        removeAllExceptMe: { type: "BOOLEAN" as const, description: "Set to true if user wants to remove all members from the workspace except themselves" },
      },
    },
  },
  {
    name: "add_comment",
    description: "Add a comment to a task.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        taskId: { type: "STRING" as const, description: "The ID of the task" },
        taskTitleQuery: { type: "STRING" as const, description: "Task title if ID is unknown" },
        content: { type: "STRING" as const, description: "Comment message text" },
      },
      required: ["content"],
    },
  },
  {
    name: "search_workspace",
    description: "Global search across tasks, projects, clients, team members, and documents for a unified summary.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        query: { type: "STRING" as const, description: "Global query term (e.g. 'Smartcast')" },
      },
      required: ["query"],
    },
  },
];

// Helper to parse dates like "tomorrow", "Friday", or ISO string
function parseNaturalDate(input?: string): Date | null {
  if (!input) return null;
  const lower = input.toLowerCase().trim();
  const now = new Date();

  if (lower === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
  }
  if (lower === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return d;
  }
  if (lower === "friday") {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(18, 0, 0, 0);
    return d;
  }
  if (lower === "next week") {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d;
  }

  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Tool implementation handler
export async function executeAITool(
  name: string,
  args: Record<string, any>,
  context: ToolContext
): Promise<any> {
  const { workspaceId, userId, userName } = context;

  switch (name) {
    case "search_tasks": {
      const where: any = { workspaceId };
      if (args.status) where.status = { equals: args.status };
      if (args.priority) where.priority = { equals: args.priority };
      if (args.query) {
        where.OR = [
          { title: { contains: args.query } },
          { description: { contains: args.query } },
          { client: { name: { contains: args.query } } },
        ];
      }
      if (args.clientName) {
        where.client = {
          name: { contains: args.clientName },
        };
      }
      if (args.assigneeName) {
        const userCount = await prisma.user.count({
          where: { name: { contains: args.assigneeName } },
        });
        if (userCount > 0) {
          where.assignee = {
            name: { contains: args.assigneeName },
          };
        } else {
          where.OR = [
            { title: { contains: args.assigneeName } },
            { client: { name: { contains: args.assigneeName } } },
          ];
        }
      }
      if (args.projectName) {
        where.project = {
          name: { contains: args.projectName },
        };
      }

      const tasks = await prisma.task.findMany({
        where,
        take: 15,
        orderBy: { dueDate: "asc" },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
        },
      });

      return {
        count: tasks.length,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignee: t.assignee?.name ?? "Unassigned",
          project: t.project?.name ?? "None",
          dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
          url: `/tasks?taskId=${t.id}`,
        })),
      };
    }

    case "create_task": {
      let assigneeId: string | undefined;
      let projectId: string | undefined;
      let clientId: string | undefined;

      // Resolve assignee by name if provided
      if (args.assigneeName) {
        const member = await prisma.workspaceMember.findFirst({
          where: {
            workspaceId,
            user: { name: { contains: args.assigneeName } },
          },
          include: { user: true },
        });
        if (member) assigneeId = member.userId;
      }

      // Resolve project if provided
      if (args.projectName) {
        const proj = await prisma.project.findFirst({
          where: {
            workspaceId,
            name: { contains: args.projectName },
          },
        });
        if (proj) {
          projectId = proj.id;
          if (proj.clientId) clientId = proj.clientId;
        }
      }

      // Resolve client if provided
      if (args.clientName) {
        const cl = await prisma.client.findFirst({
          where: {
            workspaceId,
            OR: [
              { name: { contains: args.clientName } },
              { company: { contains: args.clientName } },
            ],
          },
        });
        if (cl) clientId = cl.id;
      }

      const dueDate = parseNaturalDate(args.dueDate);

      const task = await prisma.task.create({
        data: {
          workspaceId,
          creatorId: userId,
          title: args.title,
          description: args.description ?? "",
          status: args.status ?? "Todo",
          priority: args.priority ?? "Medium",
          assigneeId,
          projectId,
          clientId,
          dueDate,
        },
        include: {
          assignee: true,
          project: true,
          client: true,
        },
      });

      // Log activity
      await logActivity({
        workspaceId,
        actorId: userId,
        action: "created_task",
        entityType: "task",
        entityId: task.id,
        entityTitle: task.title,
        details: `${userName} created task "${task.title}" via AI Assistant.`,
      });

      // Notify assignee if assigned
      if (assigneeId) {
        if (assigneeId !== userId) {
          await createNotification({
            workspaceId,
            userId: assigneeId,
            actorId: userId,
            type: "task_assigned",
            title: "New Task Assigned",
            message: `${userName} assigned you "${task.title}"`,
            link: `/tasks?taskId=${task.id}`,
          });
        }
        await sendTaskAssignmentTelegramNotification({
          taskTitle: task.title,
          taskId: task.id,
          assigneeId,
          creatorName: userName,
          projectName: task.project?.name,
          clientName: task.client?.name,
          priority: task.priority,
          dueDate: task.dueDate,
        });
      }

      // Parse mentions in description
      if (task.description) {
        await parseMentionsAndNotify({
          content: task.description,
          workspaceId,
          actorId: userId,
          actorName: userName,
          entityType: "task",
          entityTitle: task.title,
          link: `/tasks?taskId=${task.id}`,
        });
      }

      return {
        success: true,
        message: `Task "${task.title}" has been created successfully.`,
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assignee: task.assignee?.name ?? "Unassigned",
          project: task.project?.name ?? "None",
          dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : null,
          url: `/tasks?taskId=${task.id}`,
        },
      };
    }

    case "update_task": {
      // Find task by ID or title query
      let task = null;
      if (args.taskId) {
        task = await prisma.task.findFirst({
          where: { id: args.taskId, workspaceId },
        });
      } else if (args.taskTitleQuery) {
        task = await prisma.task.findFirst({
          where: {
            workspaceId,
            title: { contains: args.taskTitleQuery },
          },
        });
      }

      if (!task) {
        return {
          error: "Task not found",
          message: `Could not find a matching task to update in this workspace.`,
        };
      }

      const updateData: any = {};
      if (args.title) updateData.title = args.title;
      if (args.status) updateData.status = args.status;
      if (args.priority) updateData.priority = args.priority;
      if (args.dueDate) updateData.dueDate = parseNaturalDate(args.dueDate);

      if (args.assigneeName) {
        const member = await prisma.workspaceMember.findFirst({
          where: {
            workspaceId,
            user: { name: { contains: args.assigneeName } },
          },
        });
        if (member) updateData.assigneeId = member.userId;
      }

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: updateData,
        include: {
          assignee: true,
          project: true,
        },
      });

      // Log activity
      const changes = [];
      if (args.status) changes.push(`status to ${args.status}`);
      if (args.priority) changes.push(`priority to ${args.priority}`);
      if (args.assigneeName) changes.push(`assignee to ${updated.assignee?.name}`);
      if (args.dueDate) changes.push(`due date to ${args.dueDate}`);

      await logActivity({
        workspaceId,
        actorId: userId,
        action: "updated_task",
        entityType: "task",
        entityId: updated.id,
        entityTitle: updated.title,
        details: `${userName} updated task "${updated.title}": ${changes.join(", ")}`,
      });

      if (args.assigneeName && updated.assigneeId) {
        if (updated.assigneeId !== userId) {
          await createNotification({
            workspaceId,
            userId: updated.assigneeId,
            actorId: userId,
            type: "task_assigned",
            title: "Task Assigned",
            message: `${userName} assigned you "${updated.title}"`,
            link: `/tasks?taskId=${updated.id}`,
          });
        }
        await sendTaskAssignmentTelegramNotification({
          taskTitle: updated.title,
          taskId: updated.id,
          assigneeId: updated.assigneeId,
          creatorName: userName,
          projectName: updated.project?.name,
          priority: updated.priority,
          dueDate: updated.dueDate,
        });
      }

      return {
        success: true,
        message: `Task "${updated.title}" updated successfully: ${changes.join(", ")}.`,
        task: {
          id: updated.id,
          title: updated.title,
          status: updated.status,
          priority: updated.priority,
          assignee: updated.assignee?.name ?? "Unassigned",
          project: updated.project?.name ?? "None",
          dueDate: updated.dueDate ? updated.dueDate.toISOString().split("T")[0] : null,
          url: `/tasks?taskId=${updated.id}`,
        },
      };
    }

    case "delete_task": {
      let task = null;
      if (args.taskId) {
        task = await prisma.task.findFirst({
          where: { id: args.taskId, workspaceId },
        });
      } else if (args.taskTitleQuery) {
        task = await prisma.task.findFirst({
          where: { workspaceId, title: { contains: args.taskTitleQuery } },
        });
      }

      if (!task) {
        return { error: "Task not found" };
      }

      // Check confirmation safety system (Requirement #23)
      if (!args.confirmed) {
        return {
          requiresConfirmation: true,
          action: "delete_task",
          taskId: task.id,
          taskTitle: task.title,
          prompt: `Are you sure you want to permanently delete task "${task.title}"?`,
        };
      }

      await prisma.task.delete({
        where: { id: task.id },
      });

      await logActivity({
        workspaceId,
        actorId: userId,
        action: "deleted_task",
        entityType: "task",
        entityId: task.id,
        entityTitle: task.title,
        details: `${userName} deleted task "${task.title}".`,
      });

      return {
        success: true,
        message: `Task "${task.title}" was permanently deleted.`,
      };
    }

    case "get_overdue_tasks": {
      const now = new Date();
      const tasks = await prisma.task.findMany({
        where: {
          workspaceId,
          dueDate: { lt: now },
          status: { notIn: ["Done", "Cancelled"] },
        },
        include: {
          assignee: true,
          project: true,
        },
        orderBy: { dueDate: "asc" },
      });

      return {
        count: tasks.length,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignee: t.assignee?.name ?? "Unassigned",
          project: t.project?.name ?? "None",
          dueDate: t.dueDate?.toISOString().split("T")[0],
          url: `/tasks?taskId=${t.id}`,
        })),
      };
    }

    case "get_my_tasks": {
      const tasks = await prisma.task.findMany({
        where: {
          workspaceId,
          assigneeId: userId,
          status: { notIn: ["Done", "Cancelled"] },
        },
        include: {
          project: true,
        },
        orderBy: { dueDate: "asc" },
      });

      return {
        count: tasks.length,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          project: t.project?.name ?? "None",
          dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
          url: `/tasks?taskId=${t.id}`,
        })),
      };
    }

    case "search_projects": {
      const where: any = { workspaceId };
      if (args.status) where.status = args.status;
      if (args.query) {
        where.OR = [
          { name: { contains: args.query } },
          { description: { contains: args.query } },
        ];
      }

      const projects = await prisma.project.findMany({
        where,
        include: {
          client: true,
          tasks: { select: { id: true, status: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      return {
        count: projects.length,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          progress: `${p.progress}%`,
          client: p.client?.name ?? "None",
          tasksCount: p.tasks.length,
          completedTasks: p.tasks.filter((t) => t.status === "Done").length,
          url: `/projects?projectId=${p.id}`,
        })),
      };
    }

    case "create_project": {
      let clientId: string | undefined;
      if (args.clientName) {
        const client = await prisma.client.findFirst({
          where: {
            workspaceId,
            OR: [
              { name: { contains: args.clientName } },
              { company: { contains: args.clientName } },
            ],
          },
        });
        if (client) clientId = client.id;
      }

      const deadline = parseNaturalDate(args.deadline);

      const proj = await prisma.project.create({
        data: {
          workspaceId,
          name: args.name,
          description: args.description ?? "",
          status: "Active",
          clientId,
          deadline,
          progress: 0,
        },
        include: { client: true },
      });

      await logActivity({
        workspaceId,
        actorId: userId,
        action: "created_project",
        entityType: "project",
        entityId: proj.id,
        entityTitle: proj.name,
        details: `${userName} created project "${proj.name}".`,
      });

      return {
        success: true,
        message: `Project "${proj.name}" created successfully.`,
        project: {
          id: proj.id,
          name: proj.name,
          status: proj.status,
          client: proj.client?.name ?? "None",
          url: `/projects?projectId=${proj.id}`,
        },
      };
    }

    case "search_clients": {
      const where: any = { workspaceId };
      if (args.query) {
        where.OR = [
          { name: { contains: args.query } },
          { company: { contains: args.query } },
          { contact: { contains: args.query } },
        ];
      }

      const clients = await prisma.client.findMany({
        where,
        include: {
          projects: { select: { id: true, name: true } },
          tasks: { select: { id: true, title: true, status: true } },
        },
      });

      return {
        count: clients.length,
        clients: clients.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          contact: c.contact,
          email: c.email,
          phone: c.phone,
          projects: c.projects.map((p) => p.name),
          activeTasks: c.tasks.filter((t) => t.status !== "Done").length,
          url: `/clients?clientId=${c.id}`,
        })),
      };
    }

    case "search_documents": {
      const where: any = { workspaceId, isArchived: false };
      if (args.query) {
        where.OR = [
          { title: { contains: args.query } },
          { content: { contains: args.query } },
        ];
      }

      const docs = await prisma.document.findMany({
        where,
        include: { author: { select: { name: true } } },
      });

      return {
        count: docs.length,
        documents: docs.map((d) => ({
          id: d.id,
          title: d.title,
          icon: d.icon,
          author: d.author.name,
          url: `/documents?docId=${d.id}`,
        })),
      };
    }

    case "create_page": {
      const doc = await prisma.document.create({
        data: {
          workspaceId,
          authorId: userId,
          title: args.title,
          content: JSON.stringify([
            { id: "b1", type: "heading", level: 1, content: args.title },
            { id: "b2", type: "paragraph", content: args.content || "Start typing page contents..." },
          ]),
        },
      });

      await logActivity({
        workspaceId,
        actorId: userId,
        action: "created_document",
        entityType: "document",
        entityId: doc.id,
        entityTitle: doc.title,
        details: `${userName} created document "${doc.title}".`,
      });

      return {
        success: true,
        message: `Page "${doc.title}" created successfully.`,
        document: {
          id: doc.id,
          title: doc.title,
          url: `/documents?docId=${doc.id}`,
        },
      };
    }

    case "get_team_members": {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              tasksAssigned: {
                where: { workspaceId, status: { notIn: ["Done", "Cancelled"] } },
                select: { id: true },
              },
            },
          },
        },
      });

      return {
        count: members.length,
        members: members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          department: m.user.department,
          activeTasksCount: m.user.tasksAssigned.length,
        })),
      };
    }

    case "remove_team_member": {
      if (args.removeAllExceptMe) {
        const otherMembers = await prisma.workspaceMember.findMany({
          where: {
            workspaceId,
            userId: { not: userId },
          },
          include: { user: true },
        });

        if (otherMembers.length === 0) {
          return {
            success: true,
            message: `Jamoada sizdan (${userName}) boshqa hech kim yo'q. Siz yagona a'zosiz.`,
          };
        }

        const otherUserIds = otherMembers.map((m) => m.userId);

        // Unassign tasks from removed members in this workspace
        await prisma.task.updateMany({
          where: {
            workspaceId,
            assigneeId: { in: otherUserIds },
          },
          data: { assigneeId: null },
        });

        // Delete workspace memberships
        await prisma.workspaceMember.deleteMany({
          where: {
            workspaceId,
            userId: { not: userId },
          },
        });

        const removedNames = otherMembers.map((m) => m.user.name).join(", ");

        await logActivity({
          workspaceId,
          actorId: userId,
          action: "removed_member",
          entityType: "workspace",
          entityId: workspaceId,
          entityTitle: "Team Cleanup",
          details: `${userName} removed all members except themselves: ${removedNames}.`,
        });

        return {
          success: true,
          message: `Jamoa a'zolari muvaffaqiyatli o'chirildi (${otherMembers.length} kishi): ${removedNames}. Hozirda faqat siz (${userName}) qoldingiz.`,
          removedCount: otherMembers.length,
        };
      }

      if (!args.memberName) {
        return { error: "Iltimos, o'chirmoqchi bo'lgan a'zo ismini ko'rsating." };
      }

      const targetMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          user: { name: { contains: args.memberName } },
        },
        include: { user: true },
      });

      if (!targetMember) {
        return { error: `"${args.memberName}" ismli jamoa a'zosi topilmadi.` };
      }

      if (targetMember.userId === userId) {
        return { error: "Siz o'zingizni jamoa guruhidan o'chira olmaysiz." };
      }

      await prisma.task.updateMany({
        where: { workspaceId, assigneeId: targetMember.userId },
        data: { assigneeId: null },
      });

      await prisma.workspaceMember.delete({
        where: { id: targetMember.id },
      });

      await logActivity({
        workspaceId,
        actorId: userId,
        action: "removed_member",
        entityType: "user",
        entityId: targetMember.userId,
        entityTitle: targetMember.user.name,
        details: `${userName} removed ${targetMember.user.name} from the workspace.`,
      });

      return {
        success: true,
        message: `"${targetMember.user.name}" muvaffaqiyatli jamoa guruhidan o'chirildi.`,
      };
    }

    case "add_comment": {
      let task = null;
      if (args.taskId) {
        task = await prisma.task.findFirst({
          where: { id: args.taskId, workspaceId },
        });
      } else if (args.taskTitleQuery) {
        task = await prisma.task.findFirst({
          where: { workspaceId, title: { contains: args.taskTitleQuery } },
        });
      }

      if (!task) {
        return { error: "Task not found for comment" };
      }

      const comment = await prisma.comment.create({
        data: {
          taskId: task.id,
          authorId: userId,
          content: args.content,
        },
      });

      await logActivity({
        workspaceId,
        actorId: userId,
        action: "commented",
        entityType: "task",
        entityId: task.id,
        entityTitle: task.title,
        details: `${userName} commented on "${task.title}": "${args.content.slice(0, 60)}"`,
      });

      if (task.assigneeId && task.assigneeId !== userId) {
        await createNotification({
          workspaceId,
          userId: task.assigneeId,
          actorId: userId,
          type: "comment",
          title: "New Comment",
          message: `${userName} commented on "${task.title}"`,
          link: `/tasks?taskId=${task.id}`,
        });
      }

      await parseMentionsAndNotify({
        content: args.content,
        workspaceId,
        actorId: userId,
        actorName: userName,
        entityType: "comment",
        entityTitle: task.title,
        link: `/tasks?taskId=${task.id}`,
      });

      return {
        success: true,
        message: `Comment added to "${task.title}".`,
      };
    }

    case "search_workspace": {
      const q = args.query;
      const [tasks, projects, clients, documents] = await Promise.all([
        prisma.task.findMany({
          where: {
            workspaceId,
            OR: [{ title: { contains: q } }, { description: { contains: q } }],
          },
          take: 5,
        }),
        prisma.project.findMany({
          where: {
            workspaceId,
            OR: [{ name: { contains: q } }, { description: { contains: q } }],
          },
          take: 5,
        }),
        prisma.client.findMany({
          where: {
            workspaceId,
            OR: [
              { name: { contains: q } },
              { company: { contains: q } },
              { notes: { contains: q } },
            ],
          },
          take: 5,
        }),
        prisma.document.findMany({
          where: {
            workspaceId,
            isArchived: false,
            OR: [{ title: { contains: q } }, { content: { contains: q } }],
          },
          take: 5,
        }),
      ]);

      return {
        query: q,
        tasks: tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, url: `/tasks?taskId=${t.id}` })),
        projects: projects.map((p) => ({ id: p.id, name: p.name, status: p.status, url: `/projects?projectId=${p.id}` })),
        clients: clients.map((c) => ({ id: c.id, name: c.name, company: c.company, url: `/clients?clientId=${c.id}` })),
        documents: documents.map((d) => ({ id: d.id, title: d.title, url: `/documents?docId=${d.id}` })),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
