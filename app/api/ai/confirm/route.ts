import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { executeAITool } from "@/lib/ai/tools";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, action, taskId, confirmed } = await request.json();

    if (!confirmed) {
      return NextResponse.json({
        success: true,
        message: "Operation cancelled by user.",
      });
    }

    const context = {
      workspaceId: user.currentWorkspace.id,
      userId: user.id,
      userName: user.name,
    };

    let result = null;
    if (action === "delete_task" && taskId) {
      result = await executeAITool("delete_task", { taskId, confirmed: true }, context);
    }

    if (conversationId && result) {
      await prisma.aIMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: result.message || "Action confirmed and executed successfully.",
        },
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("AI confirm error:", error);
    return NextResponse.json({ error: "Failed to execute confirmed action" }, { status: 500 });
  }
}
