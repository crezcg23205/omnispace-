import { prisma } from "./prisma";
import { sendMentionTelegramNotification } from "./telegram";

export async function logActivity({
  workspaceId,
  actorId,
  action,
  entityType,
  entityId,
  entityTitle,
  details,
}: {
  workspaceId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  details?: string;
}) {
  try {
    return await prisma.activity.create({
      data: {
        workspaceId,
        actorId,
        action,
        entityType,
        entityId,
        entityTitle,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
}

export async function createNotification({
  workspaceId,
  userId,
  actorId,
  type,
  title,
  message,
  link,
}: {
  workspaceId: string;
  userId: string;
  actorId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    // Avoid notifying the actor of their own action
    if (actorId && actorId === userId) return null;

    return await prisma.notification.create({
      data: {
        workspaceId,
        userId,
        actorId,
        type,
        title,
        message,
        link,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Extracts @mentions (e.g. "@Ali" or "@Muhammadamin") from text, finds users in workspace,
 * and creates Inbox notifications for them.
 */
export async function parseMentionsAndNotify({
  content,
  workspaceId,
  actorId,
  actorName,
  entityType,
  entityTitle,
  link,
}: {
  content?: string | null;
  workspaceId: string;
  actorId: string;
  actorName: string;
  entityType: "task" | "comment" | "document";
  entityTitle: string;
  link: string;
}) {
  if (!content) return;

  // Match @Word tokens
  const mentionMatches = content.match(/@([a-zA-Z0-9_\-\.]+)/g);
  if (!mentionMatches || mentionMatches.length === 0) return;

  // Clean '@' symbol
  const rawNames = Array.from(new Set(mentionMatches.map((m) => m.slice(1).toLowerCase())));

  // Fetch workspace members to match
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: true },
  });

  for (const member of members) {
    if (member.userId === actorId) continue;
    const firstName = member.user.name.split(" ")[0].toLowerCase();
    const fullNameNormalized = member.user.name.toLowerCase().replace(/\s+/g, "");

    const matched = rawNames.some(
      (n) => n === firstName || n === fullNameNormalized || member.user.email.toLowerCase().startsWith(n)
    );

    if (matched) {
      await createNotification({
        workspaceId,
        userId: member.userId,
        actorId,
        type: "mentioned",
        title: "You were mentioned",
        message: `${actorName} mentioned you in ${entityType} "${entityTitle}"`,
        link,
      });

      // Send real-time Telegram notification
      await sendMentionTelegramNotification({
        mentionedUserId: member.userId,
        actorName,
        entityType,
        entityTitle,
        content: content || "",
        link,
      });
    }
  }
}
