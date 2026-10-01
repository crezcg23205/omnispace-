import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password, workspaceName } = await request.json();

    if (!name || !email || !password || !workspaceName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.random().toString(36).substring(2, 6);

    // Create user and workspace transactionally
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: cleanEmail,
          passwordHash,
          role: "Owner",
          department: "Management",
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug,
          icon: "🚀",
          members: {
            create: {
              userId: user.id,
              role: "Owner",
            },
          },
        },
      });

      // Default tags
      await tx.tag.createMany({
        data: [
          { workspaceId: workspace.id, name: "Engineering", color: "#3b82f6" },
          { workspaceId: workspace.id, name: "Design", color: "#ec4899" },
          { workspaceId: workspace.id, name: "Urgent", color: "#ef4444" },
          { workspaceId: workspace.id, name: "Marketing", color: "#f59e0b" },
        ],
      });

      // Default wiki page
      await tx.document.create({
        data: {
          workspaceId: workspace.id,
          authorId: user.id,
          title: "Welcome to " + workspaceName,
          icon: "👋",
          content: JSON.stringify([
            { id: "b1", type: "heading", level: 1, content: "Welcome to your new workspace!" },
            { id: "b2", type: "paragraph", content: "OmniSpace is your team's single operating system for tasks, projects, wiki documents, and AI-assisted workflows." },
            { id: "b3", type: "heading", level: 2, content: "Quick Start" },
            { id: "b4", type: "todo", content: "Invite team members in the Team section", completed: false },
            { id: "b5", type: "todo", content: "Create your first project", completed: false },
            { id: "b6", type: "todo", content: "Try asking Gemini AI to organize your priorities", completed: false },
          ]),
        },
      });

      return { user, workspace };
    });

    const token = await signSessionToken({
      userId: result.user.id,
      email: result.user.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        workspace: result.workspace,
      },
    });

    response.cookies.set("omnispace_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    response.cookies.set("omnispace_active_ws", result.workspace.id, {
      path: "/",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
