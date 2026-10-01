import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true },
    });

    return NextResponse.json({
      workspaces: memberships.map((m) => ({
        ...m.workspace,
        role: m.role,
        isCurrent: m.workspaceId === user.currentWorkspace.id,
      })),
    });
  } catch (error: any) {
    console.error("Fetch workspaces error:", error);
    return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, icon = "🏢" } = await request.json();
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Math.random().toString(36).substring(2, 6);

    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        slug,
        icon,
        members: {
          create: {
            userId: user.id,
            role: "Owner",
          },
        },
      },
    });

    const res = NextResponse.json({ success: true, workspace });
    res.cookies.set("omnispace_active_ws", workspace.id, {
      path: "/",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (error: any) {
    console.error("Create workspace error:", error);
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await request.json();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id },
      include: { workspace: true },
    });

    if (!member) {
      return NextResponse.json({ error: "You are not a member of this workspace" }, { status: 403 });
    }

    const res = NextResponse.json({ success: true, workspace: member.workspace });
    res.cookies.set("omnispace_active_ws", workspaceId, {
      path: "/",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (error: any) {
    console.error("Switch workspace error:", error);
    return NextResponse.json({ error: "Failed to switch workspace" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.currentRole !== "Owner" && user.currentRole !== "Admin") {
      return NextResponse.json({ error: "Only Owners and Admins can update workspace settings" }, { status: 403 });
    }

    const { name, icon } = await request.json();
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (icon) updateData.icon = icon;

    const workspace = await prisma.workspace.update({
      where: { id: user.currentWorkspace.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, workspace });
  } catch (error: any) {
    console.error("Update workspace error:", error);
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
}
