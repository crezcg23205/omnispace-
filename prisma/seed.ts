import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.taskTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.document.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Users
  const userMuhammadamin = await prisma.user.create({
    data: {
      name: "Muhammadamin Khusanov",
      email: "muhammadamin@company.com",
      passwordHash,
      department: "Management",
      role: "Owner",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const userAli = await prisma.user.create({
    data: {
      name: "Ali Valiyev",
      email: "ali@company.com",
      passwordHash,
      department: "Design",
      role: "Admin",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const userAziz = await prisma.user.create({
    data: {
      name: "Aziz Rakhimov",
      email: "aziz@company.com",
      passwordHash,
      department: "Engineering",
      role: "Member",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const userMadina = await prisma.user.create({
    data: {
      name: "Madina Karimova",
      email: "madina@company.com",
      passwordHash,
      department: "Marketing",
      role: "Member",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  });

  const userSarah = await prisma.user.create({
    data: {
      name: "Sarah Connor",
      email: "sarah@company.com",
      passwordHash,
      department: "Product & QA",
      role: "Member",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 2. Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "CREZ Workspace",
      slug: "crez",
      icon: "⚡",
      members: {
        create: [
          { userId: userMuhammadamin.id, role: "Owner" },
          { userId: userAli.id, role: "Admin" },
          { userId: userAziz.id, role: "Member" },
          { userId: userMadina.id, role: "Member" },
          { userId: userSarah.id, role: "Member" },
        ],
      },
    },
  });

  // 3. Tags
  const tagFrontend = await prisma.tag.create({
    data: { workspaceId: workspace.id, name: "Frontend", color: "#3b82f6" },
  });
  const tagDesign = await prisma.tag.create({
    data: { workspaceId: workspace.id, name: "Design", color: "#ec4899" },
  });
  const tagBackend = await prisma.tag.create({
    data: { workspaceId: workspace.id, name: "Backend", color: "#10b981" },
  });
  const tagUrgent = await prisma.tag.create({
    data: { workspaceId: workspace.id, name: "Urgent", color: "#ef4444" },
  });
  const tagMarketing = await prisma.tag.create({
    data: { workspaceId: workspace.id, name: "Marketing", color: "#f59e0b" },
  });

  // 4. Clients
  const clientSmartcast = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: "Smartcast Media",
      company: "Smartcast Inc.",
      contact: "John Carter",
      email: "john@smartcast.io",
      phone: "+1 (555) 019-2834",
      notes: "High value media streaming client. Key contact for video branding & intro animation.",
    },
  });

  const clientApex = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: "Apex Dynamics",
      company: "Apex Tech Corp",
      contact: "Elena Rostova",
      email: "elena@apexdyn.com",
      phone: "+1 (555) 034-8821",
      notes: "Enterprise cloud software. Redesigning their core visual identity.",
    },
  });

  const clientNordic = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: "Nordic Horizon",
      company: "Nordic Horizon Media AB",
      contact: "Lars Lindqvist",
      email: "lars@nordichorizon.se",
      phone: "+46 8 123 4567",
      notes: "Stockholm-based studio. Developing a collaborative client web & mobile portal.",
    },
  });

  // 5. Projects
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const projectSmartcast = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Smartcast Media Platform",
      description: "Full multimedia launch platform and 3D motion graphics identity for Smartcast streaming.",
      status: "Active",
      clientId: clientSmartcast.id,
      startDate: yesterday,
      deadline: nextMonth,
      progress: 65,
      notes: "Focus on crisp 4K motion assets, sound sync, and responsive player UI.",
    },
  });

  const projectBrandRedesign = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Brand Redesign 2026",
      description: "Complete corporate brand refresh, typography system, component library, and design tokens.",
      status: "Planning",
      clientId: clientApex.id,
      startDate: now,
      deadline: nextMonth,
      progress: 25,
      notes: "Coordinate typography guidelines with @Ali and lead engineering review with @Aziz.",
    },
  });

  const projectMobilePortal = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Mobile Client Portal",
      description: "Cross-platform mobile workspace experience with offline document synchronization.",
      status: "Active",
      clientId: clientNordic.id,
      startDate: yesterday,
      deadline: nextWeek,
      progress: 80,
      notes: "Final stage of QA testing and client feedback integration.",
    },
  });

  // 6. Tasks (10 realistic tasks matching user prompt scenarios)
  const task1 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: "Create Smartcast intro animation",
      description: "Design and render the high-energy 6-second intro animation for Smartcast. Please ask @Aziz for feedback on audio stems.",
      status: "In Progress",
      priority: "Urgent",
      creatorId: userMuhammadamin.id,
      assigneeId: userAli.id,
      projectId: projectSmartcast.id,
      clientId: clientSmartcast.id,
      startDate: yesterday,
      dueDate: tomorrow,
      position: 1,
      tags: {
        create: [{ tagId: tagDesign.id }, { tagId: tagUrgent.id }],
      },
      subtasks: {
        create: [
          { title: "Draft storyboard in Figma", completed: true, position: 0 },
          { title: "Render 3D logo extrusion in Blender", completed: true, position: 1 },
          { title: "Composite particle effects in After Effects", completed: false, position: 2 },
          { title: "Sync sound design and export 4K ProRes", completed: false, position: 3 },
        ],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: "Refactor SQLite query indexes & connection pool",
      description: "Ensure all workspace_id queries use composite indexes to sustain 10,000+ tasks without latency spikes.",
      status: "Todo",
      priority: "High",
      creatorId: userMuhammadamin.id,
      assigneeId: userAziz.id,
      projectId: projectMobilePortal.id,
      startDate: now,
      dueDate: nextWeek,
      position: 2,
      tags: {
        create: [{ tagId: tagBackend.id }],
      },
      subtasks: {
        create: [
          { title: "Audit Prisma query logs", completed: true, position: 0 },
          { title: "Add compound index on [workspaceId, status]", completed: false, position: 1 },
          { title: "Benchmark latency with 10k mock tasks", completed: false, position: 2 },
        ],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: "Launch Instagram Reel Campaign for Q4",
      description: "Coordinate with @Madina for copy and produce visual clips highlighting new client case studies.",
      status: "In Progress",
      priority: "Medium",
      creatorId: userMuhammadamin.id,
      assigneeId: userMadina.id,
      projectId: projectSmartcast.id,
      clientId: clientSmartcast.id,
      dueDate: nextWeek,
      position: 3,
      tags: {
        create: [{ tagId: tagMarketing.id }],
      },
      subtasks: {
        create: [
          { title: "Write caption hook and CTA", completed: true, position: 0 },
          { title: "Cut 3 reels with dynamic typography", completed: false, position: 1 },
          { title: "Schedule posts via Buffer", completed: false, position: 2 },
        ],
      },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: "Apex Dynamics design system tokens & colors",
      description: "Establish semantic tokens for Light/Dark themes and prepare Figma styles for handoff to engineering.",
      status: "Review",
      priority: "High",
      creatorId: userAli.id,
      assigneeId: userAli.id,
      projectId: projectBrandRedesign.id,
      clientId: clientApex.id,
      dueDate: tomorrow,
      position: 4,
      tags: {
        create: [{ tagId: tagDesign.id }],
      },
      subtasks: {
        create: [
          { title: "Color contrast compliance WCAG AAA", completed: true, position: 0 },
          { title: "Typography scale definition", completed: true, position: 1 },
          { title: "Engineering token JSON export", completed: false, position: 2 },
        ],
      },
    },
  });

  const task5 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: "Nordic Horizon mobile push notification service",
      description: "Integrate native push notifications for critical workspace updates and task assignments.",
      status: "Done",
      priority: "Medium",
      creatorId: userAziz.id,
      assigneeId: userAziz.id,
      projectId: projectMobilePortal.id,
      clientId: clientNordic.id,
      dueDate: yesterday,
      position: 5,
      tags: {
        create: [{ tagId: tagBackend.id }],
      },
      subtasks: {
        create: [
          { title: "APNS & FCM certificate setup", completed: true, position: 0 },
          { title: "Webhook dispatcher implementation", completed: true, position: 1 },
          { title: "Testing on iOS Simulator and Android device", completed: true, position: 2 },
        ],
      },
    },
  });

  const task6 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: "Fix responsive navigation drawer on iOS Safari",
      description: "Fix sticky header jump and ensure backdrop blur renders smoothly on WebKit mobile viewports.",
      status: "Done",
      priority: "Urgent",
      creatorId: userSarah.id,
      assigneeId: userAziz.id,
      projectId: projectMobilePortal.id,
      dueDate: twoDaysAgo,
      position: 6,
      tags: {
        create: [{ tagId: tagFrontend.id }],
      },
    },
  });

  const task7 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: "Draft Q4 Marketing Budget & Influencer Outreach",
      description: "Prepare spreadsheet for @Muhammadamin reviewing expected CAC and target reach across tech YouTube channels.",
      status: "Backlog",
      priority: "Low",
      creatorId: userMadina.id,
      assigneeId: userMadina.id,
      dueDate: nextMonth,
      position: 7,
      tags: {
        create: [{ tagId: tagMarketing.id }],
      },
    },
  });

  const task8 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: "Client satisfaction review with Smartcast CEO",
      description: "Schedule quarterly milestone review with John Carter. Summarize deliverables completed and upcoming video sprints.",
      status: "Todo",
      priority: "High",
      creatorId: userMuhammadamin.id,
      assigneeId: userMuhammadamin.id,
      projectId: projectSmartcast.id,
      clientId: clientSmartcast.id,
      dueDate: tomorrow,
      position: 8,
    },
  });

  const task9 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: "Security audit of session tokens & rate limiter",
      description: "Verify JWT cookie expiration, httpOnly flags, and add rate-limiting headers to AI and authentication routes.",
      status: "Todo",
      priority: "Urgent",
      creatorId: userMuhammadamin.id,
      assigneeId: userAziz.id,
      dueDate: twoDaysAgo, // Overdue task for testing AI and dashboard!
      position: 9,
      tags: {
        create: [{ tagId: tagBackend.id }, { tagId: tagUrgent.id }],
      },
    },
  });

  const task10 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      title: "Build Notion-like block slash command menu",
      description: "Ensure typing '/' inside documents renders block insertion menu with headings, bullet lists, code, and checklists.",
      status: "In Progress",
      priority: "High",
      creatorId: userAli.id,
      assigneeId: userMuhammadamin.id,
      dueDate: tomorrow,
      position: 10,
      tags: {
        create: [{ tagId: tagFrontend.id }],
      },
    },
  });

  // 7. Comments
  await prisma.comment.create({
    data: {
      taskId: task1.id,
      authorId: userAli.id,
      content: "@Aziz please check the typography and audio sync timing at second 0:04.",
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task1.id,
      authorId: userAziz.id,
      content: "Looks stunning! The bass drop aligns cleanly with the 3D logo reveal now.",
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task3.id,
      authorId: userMadina.id,
      content: "@Muhammadamin The first reel rough cut has been uploaded to drive for quick review.",
    },
  });

  // 8. Documents (Notion-style Wiki hierarchy with JSON blocks)
  const docWiki = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      title: "Company Wiki & Handbook",
      icon: "📚",
      authorId: userMuhammadamin.id,
      content: JSON.stringify([
        { id: "b1", type: "heading", level: 1, content: "Welcome to CREZ Workspace" },
        { id: "b2", type: "paragraph", content: "This is our single source of truth for company processes, engineering guidelines, design standards, and client operations." },
        { id: "b3", type: "heading", level: 2, content: "Core Principles" },
        { id: "b4", type: "bullet", content: "Deep focus over shallow multitasking" },
        { id: "b5", type: "bullet", content: "Asynchronous by default, real-time when essential" },
        { id: "b6", type: "bullet", content: "Radical clarity and documented decisions" },
        { id: "b7", type: "quote", content: "Great teams do not rely on memory; they rely on accessible, living knowledge." },
        { id: "b8", type: "divider", content: "" },
        { id: "b9", type: "todo", content: "Review security policies and 2FA setup", completed: true },
        { id: "b10", type: "todo", content: "Connect your Gemini AI workspace key in Settings", completed: true },
      ]),
    },
  });

  const docBrand = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      parentId: docWiki.id,
      title: "Smartcast Brand Guidelines",
      icon: "🎨",
      projectId: projectSmartcast.id,
      clientId: clientSmartcast.id,
      authorId: userAli.id,
      content: JSON.stringify([
        { id: "b1", type: "heading", level: 1, content: "Smartcast Media Visual Identity" },
        { id: "b2", type: "paragraph", content: "Comprehensive brand rulebook for all streaming motion graphics, logo placements, and color harmony." },
        { id: "b3", type: "heading", level: 2, content: "Primary Palette" },
        { id: "b4", type: "bullet", content: "Smartcast Indigo: #4F46E5" },
        { id: "b5", type: "bullet", content: "Cyber Coral: #F43F5E" },
        { id: "b6", type: "bullet", content: "Deep Onyx: #0F172A" },
        { id: "b7", type: "code", language: "css", content: ":root {\n  --brand-primary: #4f46e5;\n  --brand-accent: #f43f5e;\n}" },
      ]),
    },
  });

  const docSOP = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      parentId: docWiki.id,
      title: "Engineering SOP & Deployment",
      icon: "⚙️",
      authorId: userAziz.id,
      content: JSON.stringify([
        { id: "b1", type: "heading", level: 1, content: "Engineering Standard Operating Procedures" },
        { id: "b2", type: "paragraph", content: "Instructions for code reviews, Prisma database migrations, and zero-downtime deployment." },
        { id: "b3", type: "heading", level: 2, content: "Deploy Checklist" },
        { id: "b4", type: "todo", content: "Run tests and linting check", completed: true },
        { id: "b5", type: "todo", content: "Verify Prisma schema compatibility and run db push / migrate", completed: true },
        { id: "b6", type: "todo", content: "Confirm GEMINI_API_KEY environment variable is present", completed: false },
      ]),
    },
  });

  const docMarketing = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      parentId: docWiki.id,
      title: "Marketing Campaign Playbook",
      icon: "📣",
      authorId: userMadina.id,
      content: JSON.stringify([
        { id: "b1", type: "heading", level: 1, content: "Q4 Growth & Acquisition Strategy" },
        { id: "b2", type: "paragraph", content: "Targeting tech creators, indie developers, and agency leads." },
        { id: "b3", type: "bullet", content: "Weekly reels highlighting rapid task delegation with Gemini" },
        { id: "b4", type: "bullet", content: "Case study video featuring Smartcast turnaround time" },
      ]),
    },
  });

  const docClientOnboarding = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      title: "Client Onboarding Checklist",
      icon: "🤝",
      authorId: userSarah.id,
      content: JSON.stringify([
        { id: "b1", type: "heading", level: 1, content: "New Client Onboarding Process" },
        { id: "b2", type: "todo", content: "Create Client record in CRM database", completed: true },
        { id: "b3", type: "todo", content: "Set up project milestones and initial backlog tasks", completed: true },
        { id: "b4", type: "todo", content: "Share shared document link for asset gathering", completed: false },
      ]),
    },
  });

  // 9. Notifications
  await prisma.notification.create({
    data: {
      workspaceId: workspace.id,
      userId: userMuhammadamin.id,
      actorId: userAli.id,
      type: "task_assigned",
      title: "Task Assigned",
      message: 'Ali assigned you "Build Notion-like block slash command menu"',
      link: `/tasks?taskId=${task10.id}`,
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      workspaceId: workspace.id,
      userId: userMuhammadamin.id,
      actorId: userMadina.id,
      type: "mentioned",
      title: "You were mentioned",
      message: 'Madina mentioned you in "Launch Instagram Reel Campaign for Q4"',
      link: `/tasks?taskId=${task3.id}`,
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      workspaceId: workspace.id,
      userId: userAli.id,
      actorId: userMuhammadamin.id,
      type: "task_assigned",
      title: "Urgent Task Assigned",
      message: 'Muhammadamin assigned you "Create Smartcast intro animation"',
      link: `/tasks?taskId=${task1.id}`,
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      workspaceId: workspace.id,
      userId: userAziz.id,
      actorId: userAli.id,
      type: "comment",
      title: "New Comment",
      message: 'Ali commented on "Create Smartcast intro animation"',
      link: `/tasks?taskId=${task1.id}`,
      read: true,
    },
  });

  // 10. Activity Log
  await prisma.activity.create({
    data: {
      workspaceId: workspace.id,
      actorId: userMuhammadamin.id,
      action: "assigned_task",
      entityType: "task",
      entityId: task1.id,
      entityTitle: "Create Smartcast intro animation",
      details: 'Muhammadamin assigned "Create Smartcast intro animation" to Ali.',
    },
  });

  await prisma.activity.create({
    data: {
      workspaceId: workspace.id,
      actorId: userAziz.id,
      action: "updated_status",
      entityType: "task",
      entityId: task1.id,
      entityTitle: "Create Smartcast intro animation",
      details: 'Aziz changed "Create Smartcast intro animation" to In Progress.',
    },
  });

  await prisma.activity.create({
    data: {
      workspaceId: workspace.id,
      actorId: userMadina.id,
      action: "commented",
      entityType: "task",
      entityId: task3.id,
      entityTitle: "Launch Instagram Reel Campaign for Q4",
      details: 'Madina commented on "Launch Instagram Reel Campaign for Q4".',
    },
  });

  await prisma.activity.create({
    data: {
      workspaceId: workspace.id,
      actorId: userMuhammadamin.id,
      action: "created_project",
      entityType: "project",
      entityId: projectSmartcast.id,
      entityTitle: "Smartcast Media Platform",
      details: 'Muhammadamin created project "Smartcast Media Platform".',
    },
  });

  // 11. Initial AI Conversation sample
  const sampleChat = await prisma.aIConversation.create({
    data: {
      workspaceId: workspace.id,
      userId: userMuhammadamin.id,
      title: "Workspace Task Overview",
    },
  });

  await prisma.aIMessage.create({
    data: {
      conversationId: sampleChat.id,
      role: "user",
      content: "What tasks are overdue?",
    },
  });

  await prisma.aIMessage.create({
    data: {
      conversationId: sampleChat.id,
      role: "assistant",
      content: "You have 1 overdue task in the workspace:\n\n* **[Security audit of session tokens & rate limiter]** (Assigned to Aziz Rakhimov, Priority: Urgent, Due date: 2 days ago).\n\nWould you like me to reschedule this deadline or notify Aziz?",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
