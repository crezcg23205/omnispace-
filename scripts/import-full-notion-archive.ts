import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";

const NOTION_DIR = "C:\\Users\\salya\\Downloads\\Private & Shared";
const PROJECTS_DIR = path.join(NOTION_DIR, "Projects");
const CSV_FILE = path.join(NOTION_DIR, "Projects 8ddf44ac451747a4bf2a8a285066e331.csv");
const PUBLIC_UPLOADS = path.join(process.cwd(), "public", "uploads", "notion");

function parseNotionDate(str: string | undefined): Date | null {
  if (!str || !str.trim()) return null;
  // e.g. "30/09/2026 4:00 PM (UTC+3)" or "01/10/2026 12:00 PM (UTC+3)"
  const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const year = parseInt(m[3], 10);
  let hour = parseInt(m[4], 10);
  const min = parseInt(m[5], 10);
  const ampm = m[6].toUpperCase();
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  // UTC+3 timezone
  return new Date(Date.UTC(year, month, day, hour - 3, min, 0));
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result.map(s => s.trim());
}

async function main() {
  console.log("=========================================");
  console.log("NOTION ARCHIVE TO OMNISPACE IMPORTER");
  console.log("=========================================\n");

  if (!fs.existsSync(CSV_FILE)) {
    throw new Error(`CSV file not found: ${CSV_FILE}`);
  }

  // Ensure public uploads directory
  if (!fs.existsSync(PUBLIC_UPLOADS)) {
    fs.mkdirSync(PUBLIC_UPLOADS, { recursive: true });
  }

  // 1. Workspace
  let workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "OmniSpace Main",
        slug: "omnispace-main",
      },
    });
  }
  console.log(`✅ Ish maydoni: ${workspace.name} (${workspace.id})`);

  // 2. Users
  let crez = await prisma.user.findFirst({
    where: { OR: [{ email: "crez@omnispace.local" }, { name: "crez" }] },
  });
  if (!crez) {
    crez = await prisma.user.create({
      data: {
        email: "crez@omnispace.local",
        name: "crez",
        passwordHash: "$2a$10$N4m2sKzYfB5gZJp9xXU0ueWvGfF1H2tGjF5.yQ7w9.k2lM3nP4q5e",
        role: "Owner",
        department: "Motion Design",
        telegramChatId: "5725671264",
        telegramUsername: "crez_motion",
      },
    });
  } else {
    crez = await prisma.user.update({
      where: { id: crez.id },
      data: {
        telegramChatId: "5725671264",
        telegramUsername: "crez_motion",
      },
    });
  }

  let muxammadraxim = await prisma.user.findFirst({
    where: {
      OR: [
        { name: "Muxammadraxim Baxriddinov" },
        { email: "baxriddinov@omnispace.local" },
      ],
    },
  });
  if (!muxammadraxim) {
    muxammadraxim = await prisma.user.create({
      data: {
        email: "baxriddinov@omnispace.local",
        name: "Muxammadraxim Baxriddinov",
        passwordHash: "$2a$10$N4m2sKzYfB5gZJp9xXU0ueWvGfF1H2tGjF5.yQ7w9.k2lM3nP4q5e",
        role: "Member",
        department: "Video Editing",
      },
    });
  }

  // Ensure workspace members
  for (const user of [crez, muxammadraxim]) {
    const exists = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
    });
    if (!exists) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: user.role,
        },
      });
    }
  }
  console.log(`✅ Foydalanuvchilar tekshirildi: crez va Muxammadraxim Baxriddinov`);

  // 3. Clear old web data (tasks, comments, subtasks, activities, attachments)
  console.log("🧹 Eski vazifalar va bog'liq ma'lumotlar o'chirilmoqda...");
  await prisma.activity.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.taskTag.deleteMany({});
  await prisma.task.deleteMany({});
  console.log("✅ Barcha eski vazifalar tozalandi.");

  // 4. Parse CSV
  const csvRaw = fs.readFileSync(CSV_FILE, "utf-8");
  const lines = csvRaw.split("\n").filter(l => l.trim().length > 0);
  const header = parseCSVLine(lines[0].replace(/^\uFEFF/, ""));
  console.log(`CSV ustunlari:`, header);

  const colIdx = {
    title: header.indexOf("Task / Video"),
    assignee: header.indexOf("Assignee"),
    deadline: header.indexOf("Deadline"),
    notes: header.indexOf("Notes"),
    priority: header.indexOf("Priority"),
    client: header.indexOf("Project / Client"),
    status: header.indexOf("Status"),
    videoNum: header.indexOf("Video Number"),
  };

  // Find or create Clients & Projects cache
  const clientMap = new Map<string, { id: string; projectId: string }>();

  // Attachments cache by normalized folder name
  const attachmentDirs = fs.existsSync(PROJECTS_DIR)
    ? fs.readdirSync(PROJECTS_DIR).filter(f => fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory())
    : [];

  let importedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const rawTitle = cols[colIdx.title] || "";
    if (!rawTitle.trim()) {
      continue; // Skip empty row (e.g. line 44)
    }

    const rawClient = cols[colIdx.client]?.trim() || "Boshqa";
    const rawStatus = cols[colIdx.status]?.trim() || "Todo";
    const rawPriority = cols[colIdx.priority]?.trim() || "Medium";
    const rawAssignee = cols[colIdx.assignee]?.trim() || "";
    const rawDeadline = cols[colIdx.deadline]?.trim() || "";
    const rawNotes = cols[colIdx.notes]?.trim() || "";
    const rawVideoNum = cols[colIdx.videoNum]?.trim() || null;

    // Client & Project resolution
    if (!clientMap.has(rawClient)) {
      let client = await prisma.client.findFirst({
        where: { workspaceId: workspace.id, name: rawClient },
      });
      if (!client) {
        client = await prisma.client.create({
          data: {
            workspaceId: workspace.id,
            name: rawClient,
            company: rawClient,
            notes: `Notion'dan import qilingan mijoz: ${rawClient}`,
          },
        });
      }

      let project = await prisma.project.findFirst({
        where: { workspaceId: workspace.id, name: rawClient },
      });
      if (!project) {
        project = await prisma.project.create({
          data: {
            workspaceId: workspace.id,
            name: rawClient,
            description: `${rawClient} bo'yicha barcha video va animatsiya loyihalari`,
            status: "Active",
            clientId: client.id,
          },
        });
      }

      clientMap.set(rawClient, { id: client.id, projectId: project.id });
    }

    const { id: clientId, projectId } = clientMap.get(rawClient)!;

    // Assignee resolution
    let assigneeId: string | null = null;
    if (rawAssignee.includes("Muxammadraxim") || rawAssignee.includes("Baxriddinov")) {
      assigneeId = muxammadraxim.id;
    } else if (rawAssignee.toLowerCase().includes("crez")) {
      assigneeId = crez.id;
    }

    // Status resolution
    let status = "Todo";
    const stLow = rawStatus.toLowerCase();
    if (stLow === "done") status = "Done";
    else if (stLow.includes("progress")) status = "In Progress";
    else status = "Todo";

    // Priority resolution
    let priority = "Medium";
    const prLow = rawPriority.toLowerCase();
    if (prLow === "high") priority = "High";
    else if (prLow === "low") priority = "Low";
    else priority = "Medium";

    // Deadline resolution
    const dueDate = parseNotionDate(rawDeadline);

    // Look for attachments in folder
    // Check if attachmentDirs has a matching folder
    const safeTitleFolder = rawTitle.replace(/[\/\\?%*:|"<>]/g, "");
    const matchingFolder = attachmentDirs.find(d => {
      return (
        d.toLowerCase() === rawTitle.toLowerCase() ||
        d.replace(/[—–-]/g, "-").toLowerCase() === rawTitle.replace(/[—–-]/g, "-").toLowerCase() ||
        d.replace(/\s+/g, "").toLowerCase() === rawTitle.replace(/\s+/g, "").toLowerCase()
      );
    });

    let description = "";
    const attachedFiles: Array<{ name: string; url: string; size: number }> = [];

    if (matchingFolder) {
      const srcFolder = path.join(PROJECTS_DIR, matchingFolder);
      const targetSubdirName = safeTitleFolder.replace(/\s+/g, "_");
      const targetDir = path.join(PUBLIC_UPLOADS, targetSubdirName);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const files = fs.readdirSync(srcFolder);
      for (const file of files) {
        const srcFile = path.join(srcFolder, file);
        const destFile = path.join(targetDir, file);
        fs.copyFileSync(srcFile, destFile);
        const stats = fs.statSync(destFile);
        const webUrl = `/uploads/notion/${targetSubdirName}/${encodeURIComponent(file)}`;
        attachedFiles.push({ name: file, url: webUrl, size: stats.size });
      }

      if (attachedFiles.length > 0) {
        description = attachedFiles
          .map(f => `![${f.name}](${f.url})`)
          .join("\n\n");
      }
    }

    // Create task
    const createdTask = await prisma.task.create({
      data: {
        workspaceId: workspace.id,
        title: rawTitle,
        description: description || null,
        status,
        priority,
        position: i * 10,
        creatorId: crez.id,
        assigneeId,
        projectId,
        clientId,
        dueDate,
        notes: rawNotes || null,
        videoNumber: rawVideoNum,
      },
    });

    // Create attachment records if any
    for (const att of attachedFiles) {
      await prisma.attachment.create({
        data: {
          taskId: createdTask.id,
          name: att.name,
          url: att.url,
          size: att.size,
          type: "image/png",
        },
      });
    }

    importedCount++;
  }

  console.log(`\n🎉 Jami muvaffaqiyatli import qilingan vazifalar soni: ${importedCount} ta!`);

  // Verify counts in DB
  const totalTasks = await prisma.task.count();
  const totalClients = await prisma.client.count();
  const totalProjects = await prisma.project.count();
  const totalAttachments = await prisma.attachment.count();
  console.log(`📊 Yakuniy baza statistikasi:`);
  console.log(`   - Vazifalar: ${totalTasks} ta`);
  console.log(`   - Mijozlar: ${totalClients} ta`);
  console.log(`   - Loyihalar: ${totalProjects} ta`);
  console.log(`   - Biriktirilgan fayllar (screenshot/rasmlar): ${totalAttachments} ta`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Xatolik:", err);
  process.exit(1);
});
