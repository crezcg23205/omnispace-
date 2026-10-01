import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const unreadCount = await prisma.notification.count({
      where: {
        workspaceId: user.currentWorkspace.id,
        userId: user.id,
        read: false,
      },
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        department: user.department,
        role: user.role,
        currentRole: user.currentRole,
        currentWorkspace: user.currentWorkspace,
        workspaces: user.memberships.map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          icon: m.workspace.icon,
          role: m.role,
        })),
        unreadNotificationsCount: unreadCount,
      },
    });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json({ authenticated: false, error: "Internal error" }, { status: 500 });
  }
}
