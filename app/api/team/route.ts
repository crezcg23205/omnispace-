import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: user.currentWorkspace.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
            telegramChatId: true,
            telegramUsername: true,
            createdAt: true,
            tasksAssigned: {
              where: { workspaceId: user.currentWorkspace.id },
              select: { id: true, status: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    const enriched = members.map((m) => {
      const activeTasks = m.user.tasksAssigned.filter((t) => t.status !== "Done" && t.status !== "Cancelled").length;
      const completedTasks = m.user.tasksAssigned.filter((t) => t.status === "Done").length;

      return {
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.role,
        department: m.user.department || "General",
        telegramChatId: m.user.telegramChatId,
        telegramUsername: m.user.telegramUsername,
        joinedAt: m.joinedAt,
        activeTasks,
        completedTasks,
      };
    });

    return NextResponse.json({ members: enriched });
  } catch (error: any) {
    console.error("Fetch team error:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.currentRole !== "Owner" && user.currentRole !== "Admin") {
      return NextResponse.json({ error: "Only Admins and Owners can add members" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role = "Member", department = "General" } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    let targetUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!targetUser) {
      const defaultPassword = await hashPassword("password123");
      targetUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash: defaultPassword,
          department,
          role,
        },
      });
    }

    // Check if already in workspace
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: user.currentWorkspace.id,
        userId: targetUser.id,
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this workspace" }, { status: 400 });
    }

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: user.currentWorkspace.id,
        userId: targetUser.id,
        role,
      },
    });

    await logActivity({
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      action: "added_member",
      entityType: "user",
      entityId: targetUser.id,
      entityTitle: targetUser.name,
      details: `${user.name} added ${targetUser.name} (${role}) to the workspace.`,
    });

    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    console.error("Add team member error:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.currentRole !== "Owner" && user.currentRole !== "Admin") {
      return NextResponse.json({ error: "Only Admins and Owners can update roles" }, { status: 403 });
    }

    const { memberId, role, department, telegramChatId, telegramUsername } = await request.json();

    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId: user.currentWorkspace.id },
      include: { user: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (role) {
      await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { role },
      });
    }

    const userUpdate: any = {};
    if (department !== undefined) userUpdate.department = department;
    if (telegramChatId !== undefined) userUpdate.telegramChatId = telegramChatId ? String(telegramChatId).trim() : null;
    if (telegramUsername !== undefined) userUpdate.telegramUsername = telegramUsername ? String(telegramUsername).trim() : null;

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: member.userId },
        data: userUpdate,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update member error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.currentRole !== "Owner" && user.currentRole !== "Admin") {
      return NextResponse.json({ error: "Only Admins and Owners can remove members" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const removeAllExceptMe = searchParams.get("removeAllExceptMe") === "true";

    const workspaceId = user.currentWorkspace.id;

    if (removeAllExceptMe) {
      // Find all members in this workspace except current user
      const otherMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          userId: { not: user.id },
        },
        include: { user: true },
      });

      const otherUserIds = otherMembers.map((m) => m.userId);

      // Unassign tasks assigned to these users in this workspace
      await prisma.task.updateMany({
        where: {
          workspaceId,
          assigneeId: { in: otherUserIds },
        },
        data: { assigneeId: null },
      });

      // Remove workspace memberships
      await prisma.workspaceMember.deleteMany({
        where: {
          workspaceId,
          userId: { not: user.id },
        },
      });

      await logActivity({
        workspaceId,
        actorId: user.id,
        action: "removed_member",
        entityType: "workspace",
        entityId: workspaceId,
        entityTitle: "Team Cleanup",
        details: `${user.name} removed ${otherMembers.length} team member(s) from the workspace.`,
      });

      return NextResponse.json({
        success: true,
        removedCount: otherMembers.length,
        removedNames: otherMembers.map((m) => m.user.name),
      });
    }

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
      include: { user: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.userId === user.id) {
      return NextResponse.json({ error: "You cannot remove yourself from the workspace" }, { status: 400 });
    }

    // Unassign tasks assigned to this user
    await prisma.task.updateMany({
      where: { workspaceId, assigneeId: member.userId },
      data: { assigneeId: null },
    });

    // Delete membership
    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    await logActivity({
      workspaceId,
      actorId: user.id,
      action: "removed_member",
      entityType: "user",
      entityId: member.userId,
      entityTitle: member.user.name,
      details: `${user.name} removed ${member.user.name} from the workspace.`,
    });

    return NextResponse.json({ success: true, removedName: member.user.name });
  } catch (error: any) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
