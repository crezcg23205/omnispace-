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
    const client = await prisma.client.findFirst({
      where: { id, workspaceId: user.currentWorkspace.id },
      include: {
        projects: {
          include: {
            tasks: { select: { id: true, status: true } },
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            project: { select: { id: true, name: true } },
          },
          orderBy: { dueDate: "asc" },
        },
        documents: {
          select: { id: true, title: true, icon: true, updatedAt: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error: any) {
    console.error("Fetch client details error:", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
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

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: body.name,
        company: body.company,
        contact: body.contact,
        email: body.email,
        phone: body.phone,
        notes: body.notes,
      },
    });

    await logActivity({
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      action: "updated_client",
      entityType: "client",
      entityId: id,
      entityTitle: client.name,
      details: `${user.name} updated client "${client.name}".`,
    });

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
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
    const client = await prisma.client.findFirst({
      where: { id, workspaceId: user.currentWorkspace.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });

    await logActivity({
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      action: "deleted_client",
      entityType: "client",
      entityId: id,
      entityTitle: client.name,
      details: `${user.name} deleted client "${client.name}".`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete client error:", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
