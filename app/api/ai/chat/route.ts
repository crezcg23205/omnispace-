import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askGemini } from "@/lib/ai/gemini";
import { ToolContext } from "@/lib/ai/tools";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, conversationId, customApiKey } = body;

    if (!prompt || prompt.trim() === "") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const workspaceId = user.currentWorkspace.id;

    // Get or create conversation
    let conv = null;
    if (conversationId) {
      conv = await prisma.aIConversation.findFirst({
        where: { id: conversationId, workspaceId, userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 12,
          },
        },
      });
    }

    if (!conv) {
      conv = await prisma.aIConversation.create({
        data: {
          workspaceId,
          userId: user.id,
          title: prompt.slice(0, 40) + (prompt.length > 40 ? "..." : ""),
        },
        include: { messages: true },
      });
    }

    // Prepare message history
    const history = (conv.messages || []).map((m) => ({
      role: m.role as "user" | "assistant" | "system" | "tool",
      content: m.content,
    }));

    // Record user message
    await prisma.aIMessage.create({
      data: {
        conversationId: conv.id,
        role: "user",
        content: prompt.trim(),
      },
    });

    const context: ToolContext = {
      workspaceId,
      userId: user.id,
      userName: user.name,
    };

    // Ask Gemini AI
    const aiResult = await askGemini(prompt.trim(), history, context, customApiKey);

    // Record assistant message
    const assistantMsg = await prisma.aIMessage.create({
      data: {
        conversationId: conv.id,
        role: "assistant",
        content: aiResult.content,
        toolCalls: aiResult.toolCalls ? JSON.stringify(aiResult.toolCalls) : null,
        toolResults: aiResult.toolResults ? JSON.stringify(aiResult.toolResults) : null,
        pendingConfirmation: aiResult.pendingConfirmation
          ? JSON.stringify(aiResult.pendingConfirmation)
          : null,
      },
    });

    return NextResponse.json({
      success: true,
      conversationId: conv.id,
      message: assistantMsg,
      content: aiResult.content,
      toolCalls: aiResult.toolCalls,
      toolResults: aiResult.toolResults,
      pendingConfirmation: aiResult.pendingConfirmation,
    });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "AI is temporarily unavailable. Please retry shortly." },
      { status: 500 }
    );
  }
}
