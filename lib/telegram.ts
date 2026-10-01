import { prisma } from "./prisma";

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || "8933811768:AAHUEgMkVwrNaN-Ucy3xm5BuKE-zFdhCjoo";
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "5725671264";

function escapeHtml(text: string = ""): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendTelegramMessage(chatId: string | number, text: string) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return null;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: String(chatId),
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Telegram send error:", error);
    return null;
  }
}

/**
 * Notifies via Telegram when a task is assigned to a team member
 */
export async function sendTaskAssignmentTelegramNotification({
  taskTitle,
  taskId,
  assigneeId,
  creatorName,
  projectName,
  clientName,
  priority,
  dueDate,
}: {
  taskTitle: string;
  taskId: string;
  assigneeId: string;
  creatorName?: string;
  projectName?: string | null;
  clientName?: string | null;
  priority?: string | null;
  dueDate?: Date | string | null;
}) {
  try {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, name: true, telegramChatId: true },
    });

    if (!assignee) return;

    const formattedDate = dueDate
      ? new Date(dueDate).toLocaleString("uz-UZ", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Belgilanmagan";

    const clientOrProject = clientName || projectName || "Umumiy";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const message = [
      `📌 <b>Yangi vazifa biriktirildi!</b>`,
      ``,
      `📝 <b>Vazifa:</b> ${escapeHtml(taskTitle)}`,
      `👤 <b>Mas'ul xodim:</b> ${escapeHtml(assignee.name)}`,
      `🏢 <b>Loyiha / Mijoz:</b> ${escapeHtml(clientOrProject)}`,
      `🔥 <b>Prioritet:</b> ${escapeHtml(priority || "Medium")}`,
      `⏰ <b>Muddat:</b> ${formattedDate}`,
      creatorName ? `✍️ <b>Biriktiruvchi:</b> ${escapeHtml(creatorName)}` : "",
      ``,
      `🔗 <a href="${appUrl}/tasks?taskId=${taskId}">OmniSpace'da ko'rish</a>`,
    ]
      .filter(Boolean)
      .join("\n");

    const targets = new Set<string>();
    if (assignee.telegramChatId) {
      targets.add(String(assignee.telegramChatId));
    }
    // Always notify the designated admin as well
    if (TELEGRAM_ADMIN_CHAT_ID) {
      targets.add(String(TELEGRAM_ADMIN_CHAT_ID));
    }

    for (const chatId of targets) {
      await sendTelegramMessage(chatId, message);
    }
  } catch (err) {
    console.error("Failed to send task assignment telegram notification:", err);
  }
}

/**
 * Notifies via Telegram when a user is @mentioned in task descriptions, comments, or notes
 */
export async function sendMentionTelegramNotification({
  mentionedUserId,
  actorName,
  entityType,
  entityTitle,
  content,
  link,
}: {
  mentionedUserId: string;
  actorName: string;
  entityType: string;
  entityTitle: string;
  content: string;
  link: string;
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: mentionedUserId },
      select: { id: true, name: true, telegramChatId: true },
    });

    if (!user) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const snippet = content.length > 250 ? content.slice(0, 250) + "..." : content;

    const message = [
      `💬 <b>Sizni OmniSpace'da belgilashdi (@mention)!</b>`,
      ``,
      `👤 <b>Muallif:</b> ${escapeHtml(actorName)}`,
      `📌 <b>Joylashuv:</b> ${escapeHtml(entityType.toUpperCase())} — "${escapeHtml(entityTitle)}"`,
      `📝 <b>Xabar matni:</b>`,
      `<i>"${escapeHtml(snippet)}"</i>`,
      ``,
      `🔗 <a href="${appUrl}${link}">Havolaga o'tish</a>`,
    ].join("\n");

    const targets = new Set<string>();
    if (user.telegramChatId) {
      targets.add(String(user.telegramChatId));
    }
    if (TELEGRAM_ADMIN_CHAT_ID) {
      targets.add(String(TELEGRAM_ADMIN_CHAT_ID));
    }

    for (const chatId of targets) {
      await sendTelegramMessage(chatId, message);
    }
  } catch (err) {
    console.error("Failed to send mention telegram notification:", err);
  }
}
