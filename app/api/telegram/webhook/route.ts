import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const fromName = message.from?.first_name || "Foydalanuvchi";
    const username = message.from?.username || null;

    // Command: /start
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      if (parts.length > 1 && parts[1].includes("@")) {
        // Direct link code /start email
        const email = parts[1].toLowerCase().trim();
        const user = await prisma.user.findFirst({
          where: { email },
        });

        if (user) {
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
              `👤 Xodim: <b>${user.name}</b>\n` +
              `📧 Email: <b>${user.email}</b>\n` +
              `🏢 Bo'lim: <b>${user.department || "General"}</b>\n\n` +
              `Endi sizga yuklatilgan vazifalar va @mentionlar to'g'ridan-to'g'ri shu chatga keladi!`
          );
          return NextResponse.json({ ok: true });
        }
      }

      await sendTelegramMessage(
        chatId,
        `👋 <b>Assalomu alaykum, ${fromName}!</b>\n\n` +
          `Men <b>OmniSpace Workspace Bot</b>man.\n\n` +
          `🆔 Sizning Telegram Chat ID: <code>${chatId}</code>\n\n` +
          `📌 <i>Bu bot nima qiladi?</i>\n` +
          `OmniSpace tizimida sizga yangi vazifa yuklatilganda yoki kimdir sizni <b>@mention</b> qilganda, ushbu bot darhol xabar jo'natadi.\n\n` +
          `🔗 <b>Profilingizni bog'lash uchun:</b>\n` +
          `<code>/link sizning_emailingiz</code> deb yozing.\n` +
          `<i>Masalan:</i> <code>/link muxammadraxim@company.com</code>`
      );
      return NextResponse.json({ ok: true });
    }

    // Command: /link <email>
    if (text.startsWith("/link")) {
      const parts = text.split(" ");
      if (parts.length < 2) {
        await sendTelegramMessage(
          chatId,
          `⚠️ Iltimos, emailingizni kiriting.\nMisol: <code>/link muxammadraxim@company.com</code>`
        );
        return NextResponse.json({ ok: true });
      }

      const email = parts[1].toLowerCase().trim();
      const user = await prisma.user.findFirst({
        where: { email },
      });

      if (!user) {
        await sendTelegramMessage(
          chatId,
          `❌ <b>"${email}"</b> emaili bo'yicha tizimda foydalanuvchi topilmadi.\n` +
            `Iltimos, OmniSpace'da ro'yxatdan o'tgan emailingizni tekshiring.`
        );
        return NextResponse.json({ ok: true });
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
          `👤 Xodim: <b>${user.name}</b>\n` +
          `📧 Email: <b>${user.email}</b>\n` +
          `🏢 Bo'lim: <b>${user.department || "General"}</b>\n\n` +
          `Endi sizga yuklatilgan barcha vazifalar va @mentionlar shu yerga yuboriladi!`
      );
      return NextResponse.json({ ok: true });
    }

    // Command: /myid
    if (text.startsWith("/myid")) {
      await sendTelegramMessage(
        chatId,
        `🆔 Sizning Telegram Chat ID: <code>${chatId}</code>`
      );
      return NextResponse.json({ ok: true });
    }

    // Command: /tasks
    if (text.startsWith("/tasks")) {
      const user = await prisma.user.findFirst({
        where: { telegramChatId: String(chatId) },
      });

      if (!user) {
        await sendTelegramMessage(
          chatId,
          `⚠️ Profilingiz hali bog'lanmagan. Iltimos, <code>/link sizning_emailingiz</code> buyrug'idan foydalaning.`
        );
        return NextResponse.json({ ok: true });
      }

      const activeTasks = await prisma.task.findMany({
        where: {
          assigneeId: user.id,
          status: { not: "Done" },
        },
        include: { client: true, project: true },
        take: 10,
        orderBy: { dueDate: "asc" },
      });

      if (activeTasks.length === 0) {
        await sendTelegramMessage(
          chatId,
          `🎉 <b>${user.name}</b>, sizda hozircha faol vazifalar yo'q. Barchasi bajarilgan!`
        );
        return NextResponse.json({ ok: true });
      }

      const lines = [
        `📋 <b>${user.name} — Faol vazifalaringiz (${activeTasks.length}):</b>`,
        "",
      ];

      activeTasks.forEach((t, i) => {
        const dateStr = t.dueDate
          ? new Date(t.dueDate).toLocaleDateString("uz-UZ")
          : "Muddatsiz";
        const clientStr = t.client?.name || t.project?.name || "";
        lines.push(
          `${i + 1}. <b>${t.title}</b> [${t.status}]` +
            (clientStr ? ` • <i>${clientStr}</i>` : "") +
            ` • ⏰ ${dateStr}`
        );
      });

      lines.push("");
      lines.push(`🔗 <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/tasks?myTasks=true">OmniSpace'da ko'rish</a>`);

      await sendTelegramMessage(chatId, lines.join("\n"));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
