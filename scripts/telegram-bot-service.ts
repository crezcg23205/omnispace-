import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
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

async function sendTelegramMessage(chatId: string | number, text: string) {
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
    return await res.json();
  } catch (e) {
    console.error("Failed to send message:", e);
  }
}

async function processUpdate(update: any) {
  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();
  const fromName = message.from?.first_name || "Foydalanuvchi";
  const username = message.from?.username || null;

  console.log(`[Telegram] Message from ${fromName} (${chatId}): ${text}`);

  // /start
  if (text.startsWith("/start")) {
    // If the chat is the admin chat, auto-link to crez
    if (String(chatId) === TELEGRAM_ADMIN_CHAT_ID) {
      await prisma.user.updateMany({
        where: { email: "crez@company.com" },
        data: { telegramChatId: String(chatId), telegramUsername: username },
      });
    }

    await sendTelegramMessage(
      chatId,
      `👋 <b>Assalomu alaykum, ${escapeHtml(fromName)}!</b>\n\n` +
        `Men <b>OmniSpace Workspace Bot</b>man.\n\n` +
        `🆔 Sizning Telegram Chat ID: <code>${chatId}</code>\n` +
        (String(chatId) === TELEGRAM_ADMIN_CHAT_ID ? `⚡ <i>Siz Bosh Admin sifatida tizimga ulangansiz!</i>\n\n` : `\n`) +
        `📌 <b>Vazifalar va @mentionlar xabarnomasi:</b>\n` +
        `Har safar OmniSpace tizimida sizga yangi vazifa yuklatilganda yoki kimdir sizni <b>@mention</b> qilganda shu yerga darhol bildirishnoma keladi.\n\n` +
        `💡 <b>Profilingizni ulash uchun:</b>\n` +
        `<code>/link sizning_emailingiz</code> deb yuboring.\n` +
        `<i>Misol:</i> <code>/link muxammadraxim@company.com</code>\n\n` +
        `📋 <b>Mavjud buyruqlar:</b>\n` +
        `• <code>/tasks</code> — Sizga biriktirilgan faol vazifalar ro'yxati\n` +
        `• <code>/myid</code> — Telegram Chat ID raqamingiz\n` +
        `• <code>/team</code> — Jamoa xodimlari holati`
    );
    return;
  }

  // /link <email>
  if (text.startsWith("/link")) {
    const parts = text.split(" ");
    if (parts.length < 2) {
      await sendTelegramMessage(
        chatId,
        `⚠️ Iltimos emailingizni kiriting:\nMasalan: <code>/link muxammadraxim@company.com</code>`
      );
      return;
    }

    const email = parts[1].toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      await sendTelegramMessage(
        chatId,
        `❌ <b>"${escapeHtml(email)}"</b> emaili bo'yicha xodim topilmadi.\n` +
          `Iltimos, OmniSpace'da ro'yxatdan o'tgan emailingizni tekshiring.`
      );
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: String(chatId),
        telegramUsername: username,
      },
    });

    await sendTelegramMessage(
      chatId,
      `✅ <b>Muvaffaqiyatli bog'landi!</b>\n\n` +
        `👤 Xodim: <b>${escapeHtml(user.name)}</b>\n` +
        `📧 Email: <b>${escapeHtml(user.email)}</b>\n` +
        `🏢 Bo'lim: <b>${escapeHtml(user.department || "General")}</b>\n\n` +
        `Endi sizga yuklatilgan barcha vazifalar va @mentionlar to'g'ridan-to'g'ri shu chatga yuboriladi!`
    );
    return;
  }

  // /myid
  if (text.startsWith("/myid")) {
    await sendTelegramMessage(
      chatId,
      `🆔 Sizning Telegram Chat ID: <code>${chatId}</code>`
    );
    return;
  }

  // /tasks
  if (text.startsWith("/tasks")) {
    let user = await prisma.user.findFirst({
      where: { telegramChatId: String(chatId) },
    });

    // Fallback: If admin
    if (!user && String(chatId) === TELEGRAM_ADMIN_CHAT_ID) {
      user = await prisma.user.findFirst({ where: { email: "crez@company.com" } });
    }

    if (!user) {
      await sendTelegramMessage(
        chatId,
        `⚠️ Profilingiz hali bog'lanmagan. Iltimos, <code>/link sizning_emailingiz</code> orqali profilingizni ulang.`
      );
      return;
    }

    const activeTasks = await prisma.task.findMany({
      where: {
        assigneeId: user.id,
        status: { not: "Done" },
      },
      include: { client: true, project: true },
      take: 15,
      orderBy: { dueDate: "asc" },
    });

    if (activeTasks.length === 0) {
      await sendTelegramMessage(
        chatId,
        `🎉 <b>${escapeHtml(user.name)}</b>, sizda faol vazifalar yo'q. Barchasi bajarilgan!`
      );
      return;
    }

    const lines = [
      `📋 <b>${escapeHtml(user.name)} — Faol vazifalaringiz (${activeTasks.length}):</b>`,
      "",
    ];

    activeTasks.forEach((t, i) => {
      const dateStr = t.dueDate
        ? new Date(t.dueDate).toLocaleDateString("uz-UZ")
        : "Muddatsiz";
      const clientStr = t.client?.name || t.project?.name || "";
      lines.push(
        `${i + 1}. <b>${escapeHtml(t.title)}</b> [${t.status}]` +
          (clientStr ? ` • <i>${escapeHtml(clientStr)}</i>` : "") +
          ` • ⏰ ${dateStr}`
      );
    });

    lines.push("");
    lines.push(`🔗 <a href="http://localhost:3000/tasks?myTasks=true">OmniSpace'da ko'rish</a>`);

    await sendTelegramMessage(chatId, lines.join("\n"));
    return;
  }

  // /team
  if (text.startsWith("/team")) {
    const members = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        telegramChatId: true,
      },
    });

    const lines = [`👥 <b>OmniSpace Jamoa a'zolari:</b>`, ""];
    members.forEach((m) => {
      const tgStatus = m.telegramChatId ? "✅ Telegram ulangan" : "⚪ Ulanmagan";
      lines.push(
        `• <b>${escapeHtml(m.name)}</b> (${escapeHtml(m.department || "General")})\n  📧 ${m.email} | ${tgStatus}`
      );
    });

    await sendTelegramMessage(chatId, lines.join("\n"));
  }
}

async function startPolling() {
  console.log("🤖 Telegram Bot Polling Service started for @testtolovabot...");
  let offset = 0;

  while (true) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=20`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            await processUpdate(update);
            offset = update.update_id + 1;
          }
        }
      }
    } catch (err) {
      console.error("Polling error:", err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

startPolling().catch((e) => {
  console.error("Fatal polling error:", e);
});
