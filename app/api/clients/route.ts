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

    const where: any = { workspaceId: user.currentWorkspace.id };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { contact: { contains: search } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        projects: {
          select: { id: true, name: true, status: true, progress: true },
        },
        tasks: {
          select: { id: true, title: true, status: true, priority: true, dueDate: true },
        },
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ clients });
  } catch (error: any) {
    console.error("Fetch clients error:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, company, contact, email, phone, notes } = body;

    if (!name || !company) {
      return NextResponse.json({ error: "Name and company are required" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        workspaceId: user.currentWorkspace.id,
        name: name.trim(),
        company: company.trim(),
        contact: contact?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    await logActivity({
      workspaceId: user.currentWorkspace.id,
      actorId: user.id,
      action: "created_client",
      entityType: "client",
      entityId: client.id,
      entityTitle: client.name,
      details: `${user.name} created client "${client.name}" (${client.company}).`,
    });

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
