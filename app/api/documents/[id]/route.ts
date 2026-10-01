import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity, parseMentionsAndNotify } from "@/lib/activity";

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
    const document = await prisma.document.findFirst({
      where: { id, workspaceId: user.currentWorkspace.id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        project: true,
        client: true,
        parent: { select: { id: true, title: true } },
        children: { select: { id: true, title: true, icon: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error: any) {
    console.error("Fetch document details error:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
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
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.content !== undefined) {
      updateData.content = typeof body.content === "string" ? body.content : JSON.stringify(body.content);
    }
    if (body.parentId !== undefined) updateData.parentId = body.parentId || null;
    if (body.projectId !== undefined) updateData.projectId = body.projectId || null;
    if (body.clientId !== undefined) updateData.clientId = body.clientId || null;
    if (body.isArchived !== undefined) updateData.isArchived = body.isArchived;

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
    });

    if (body.content) {
      // Check for mentions in document content
      await parseMentionsAndNotify({
        content: typeof body.content === "string" ? body.content : JSON.stringify(body.content),
        workspaceId: user.currentWorkspace.id,
        actorId: user.id,
        actorName: user.name,
        entityType: "document",
        entityTitle: document.title,
        link: `/documents?docId=${document.id}`,
      });
    }

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    console.error("Update document error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
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
    const document = await prisma.document.findFirst({
      where: { id, workspaceId: user.currentWorkspace.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await prisma.document.delete({ where: { id } });

    await logActivity({
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      action: "deleted_document",
      entityType: "document",
      entityId: id,
      entityTitle: document.title,
      details: `${user.name} deleted document "${document.title}".`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
