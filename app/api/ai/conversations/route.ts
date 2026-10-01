import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: {
        workspaceId: user.currentWorkspace.id,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error("Fetch AI conversations error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await prisma.aIConversation.create({
      data: {
        workspaceId: user.currentWorkspace.id,
        userId: user.id,
        title: "New Chat",
      },
    });

    return NextResponse.json({ success: true, conversation });
  } catch (error: any) {
    console.error("Create AI conversation error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
