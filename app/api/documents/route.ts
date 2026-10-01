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
    const search = searchParams.get("search");

    const where: any = {
      workspaceId: user.currentWorkspace.id,
      isArchived: false,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        children: {
          select: { id: true, title: true, icon: true, parentId: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("Fetch documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title = "Untitled", icon = "📄", parentId, projectId, clientId, content } = body;

    const initialBlocks = content || JSON.stringify([
      { id: "b1", type: "heading", level: 1, content: title },
      { id: "b2", type: "paragraph", content: "Press '/' for commands..." },
    ]);

    const document = await prisma.document.create({
      data: {
        workspaceId: user.currentWorkspace.id,
        authorId: user.id,
        title: title.trim() || "Untitled",
        icon: icon || "📄",
        parentId: parentId || null,
        projectId: projectId || null,
        clientId: clientId || null,
        content: typeof initialBlocks === "string" ? initialBlocks : JSON.stringify(initialBlocks),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      action: "created_document",
      entityType: "document",
      entityId: document.id,
      entityTitle: document.title,
      details: `${user.name} created document "${document.title}".`,
    });

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    console.error("Create document error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
