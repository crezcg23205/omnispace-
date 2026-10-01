import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { title } = await request.json();

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Subtask title is required" }, { status: 400 });
    }

    const count = await prisma.subtask.count({ where: { taskId: id } });

    const subtask = await prisma.subtask.create({
      data: {
        taskId: id,
        title: title.trim(),
        position: count,
      },
    });

    return NextResponse.json({ success: true, subtask });
  } catch (error: any) {
    console.error("Create subtask error:", error);
    return NextResponse.json({ error: "Failed to create subtask" }, { status: 500 });
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

    const { subtaskId, completed, title } = await request.json();
    if (!subtaskId) {
      return NextResponse.json({ error: "SubtaskId required" }, { status: 400 });
    }

    const updateData: any = {};
    if (completed !== undefined) updateData.completed = completed;
    if (title !== undefined) updateData.title = title;

    const subtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: updateData,
    });

    return NextResponse.json({ success: true, subtask });
  } catch (error: any) {
    console.error("Update subtask error:", error);
    return NextResponse.json({ error: "Failed to update subtask" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subtaskId = searchParams.get("subtaskId");

    if (!subtaskId) {
      return NextResponse.json({ error: "SubtaskId required" }, { status: 400 });
    }

    await prisma.subtask.delete({ where: { id: subtaskId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete subtask error:", error);
    return NextResponse.json({ error: "Failed to delete subtask" }, { status: 500 });
  }
}
