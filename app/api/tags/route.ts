import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      where: { workspaceId: user.currentWorkspace.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error("Fetch tags error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, color = "#3b82f6" } = await request.json();
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Tag name required" }, { status: 400 });
    }

    const tag = await prisma.tag.upsert({
      where: {
        workspaceId_name: {
          workspaceId: user.currentWorkspace.id,
          name: name.trim(),
        },
      },
      update: { color },
      create: {
        workspaceId: user.currentWorkspace.id,
        name: name.trim(),
        color,
      },
    });

    return NextResponse.json({ success: true, tag });
  } catch (error: any) {
    console.error("Create tag error:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
