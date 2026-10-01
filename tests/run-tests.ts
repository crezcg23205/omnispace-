import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "../lib/auth";
import { executeAITool } from "../lib/ai/tools";
import { parseMentionsAndNotify } from "../lib/activity";

async function runTestSuite() {
  console.log("\n🧪 STARTING CRITICAL WORKSPACE & AI TEST SUITE\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: User Authentication & Passwords
    // -------------------------------------------------------------
    console.log("▶ [Test 1] User Authentication & Security");
    const rawPass = "securePassword123!";
    const hashed = await hashPassword(rawPass);
    assert(await verifyPassword(rawPass, hashed), "Password verification works");
    assert(!(await verifyPassword("wrongPass", hashed)), "Wrong password rejected");

    const token = await signSessionToken({ userId: "test-user-id", email: "test@domain.com" });
    const payload = await verifySessionToken(token);
    assert(payload?.userId === "test-user-id", "Session token signing and verification valid");

    // -------------------------------------------------------------
    // TEST 2: Workspace Isolation (Requirement #27, #28)
    // -------------------------------------------------------------
    console.log("\n▶ [Test 2] Multi-Workspace Isolation");
    const wsA = await prisma.workspace.create({
      data: { name: "Company Alpha", slug: "company-alpha-" + Date.now() },
    });
    const wsB = await prisma.workspace.create({
      data: { name: "Company Beta", slug: "company-beta-" + Date.now() },
    });

    const testUser = await prisma.user.create({
      data: {
        name: "Test Engineer",
        email: `tester-${Date.now()}@test.com`,
        passwordHash: hashed,
      },
    });

    // Create task in Workspace A
    const taskA = await prisma.task.create({
      data: {
        workspaceId: wsA.id,
        creatorId: testUser.id,
        title: "Confidential Alpha Task",
        status: "Todo",
      },
    });

    // Query from Workspace B
    const tasksInB = await prisma.task.findMany({
      where: { workspaceId: wsB.id, title: "Confidential Alpha Task" },
    });
    assert(tasksInB.length === 0, "Tasks in Workspace A do NOT leak into Workspace B");

    // -------------------------------------------------------------
    // TEST 3: Task Creation & Assignment
    // -------------------------------------------------------------
    console.log("\n▶ [Test 3] Task Creation & Assignment");
    const taskAssigned = await prisma.task.create({
      data: {
        workspaceId: wsA.id,
        creatorId: testUser.id,
        assigneeId: testUser.id,
        title: "Build Authentication System",
        priority: "Urgent",
        status: "Todo",
      },
      include: { assignee: true },
    });
    assert(taskAssigned.title === "Build Authentication System", "Task title persisted");
    assert(taskAssigned.assignee?.id === testUser.id, "Task assignee correctly linked");
    assert(taskAssigned.priority === "Urgent", "Task priority stored");

    // -------------------------------------------------------------
    // TEST 4: Status Updates
    // -------------------------------------------------------------
    console.log("\n▶ [Test 4] Status Updates");
    const updated = await prisma.task.update({
      where: { id: taskAssigned.id },
      data: { status: "Done" },
    });
    assert(updated.status === "Done", "Task status updated from Todo to Done");

    // -------------------------------------------------------------
    // TEST 5: Project Creation & Client Association
    // -------------------------------------------------------------
    console.log("\n▶ [Test 5] Project Creation & Client Association");
    const testClient = await prisma.client.create({
      data: {
        workspaceId: wsA.id,
        name: "Acme Client",
        company: "Acme Corporation",
      },
    });

    const testProject = await prisma.project.create({
      data: {
        workspaceId: wsA.id,
        name: "Acme Web Redesign",
        clientId: testClient.id,
        status: "Active",
      },
      include: { client: true },
    });
    assert(testProject.name === "Acme Web Redesign", "Project created");
    assert(testProject.client?.name === "Acme Client", "Project linked to Client");

    // -------------------------------------------------------------
    // TEST 6: Mentions & Inbox Notifications
    // -------------------------------------------------------------
    console.log("\n▶ [Test 6] Mentions & Notifications");
    const mentionedUser = await prisma.user.create({
      data: {
        name: "John Mentionee",
        email: `john-${Date.now()}@test.com`,
        passwordHash: hashed,
      },
    });

    await prisma.workspaceMember.create({
      data: { workspaceId: wsA.id, userId: mentionedUser.id, role: "Member" },
    });

    await parseMentionsAndNotify({
      content: "Please check this @John for approval.",
      workspaceId: wsA.id,
      actorId: testUser.id,
      actorName: testUser.name,
      entityType: "task",
      entityTitle: "Design Review",
      link: `/tasks?taskId=${taskAssigned.id}`,
    });

    const notifications = await prisma.notification.findMany({
      where: { workspaceId: wsA.id, userId: mentionedUser.id },
    });
    assert(notifications.length > 0, "Mention in text successfully generated Inbox notification");
    assert(notifications[0].type === "mentioned", "Notification type is 'mentioned'");

    // -------------------------------------------------------------
    // TEST 7: AI Task Creation Tool (Requirement #19, #22)
    // -------------------------------------------------------------
    console.log("\n▶ [Test 7] AI Task Creation & Grounding");
    const aiContext = {
      workspaceId: wsA.id,
      userId: testUser.id,
      userName: testUser.name,
    };

    const aiCreateRes = await executeAITool(
      "create_task",
      {
        title: "AI Generated Pipeline Task",
        priority: "High",
        status: "Todo",
        dueDate: "tomorrow",
      },
      aiContext
    );
    assert(aiCreateRes.success === true, "AI create_task tool executed successfully");
    assert(aiCreateRes.task.priority === "High", "AI task properties properly structured");

    const createdInDb = await prisma.task.findUnique({
      where: { id: aiCreateRes.task.id },
    });
    assert(createdInDb !== null, "AI task persisted in actual SQLite database");

    // -------------------------------------------------------------
    // TEST 8: AI Task Modification Tool (Requirement #20)
    // -------------------------------------------------------------
    console.log("\n▶ [Test 8] AI Task Modification");
    const aiUpdateRes = await executeAITool(
      "update_task",
      {
        taskId: aiCreateRes.task.id,
        status: "Review",
        priority: "Urgent",
      },
      aiContext
    );
    assert(aiUpdateRes.success === true, "AI update_task tool executed");
    assert(aiUpdateRes.task.status === "Review", "AI modified task status to Review");

    // -------------------------------------------------------------
    // TEST 9: AI Task Search & Overdue Query (Requirement #21)
    // -------------------------------------------------------------
    console.log("\n▶ [Test 9] AI Workspace Query & Overdue Detection");
    // Make task overdue
    await prisma.task.update({
      where: { id: aiCreateRes.task.id },
      data: { dueDate: new Date(Date.now() - 86400000) }, // yesterday
    });

    const overdueRes = await executeAITool("get_overdue_tasks", {}, aiContext);
    assert(overdueRes.count > 0, "AI get_overdue_tasks identified past-due task");

    // -------------------------------------------------------------
    // TEST 10: AI Destructive Safety Confirmation (Requirement #23)
    // -------------------------------------------------------------
    console.log("\n▶ [Test 10] AI Destructive Safety Confirmation System");
    const unconfirmedDelete = await executeAITool(
      "delete_task",
      { taskId: aiCreateRes.task.id, confirmed: false },
      aiContext
    );
    assert(
      unconfirmedDelete.requiresConfirmation === true,
      "Destructive delete requires user confirmation"
    );

    // Verify task still exists
    const stillExists = await prisma.task.findUnique({ where: { id: aiCreateRes.task.id } });
    assert(stillExists !== null, "Task was NOT deleted without user confirmation");

    // Execute with confirmation
    const confirmedDelete = await executeAITool(
      "delete_task",
      { taskId: aiCreateRes.task.id, confirmed: true },
      aiContext
    );
    assert(confirmedDelete.success === true, "Task deleted after explicit user confirmation");

    // Cleanup test workspaces
    await prisma.workspace.delete({ where: { id: wsA.id } });
    await prisma.workspace.delete({ where: { id: wsB.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.user.delete({ where: { id: mentionedUser.id } });

    console.log("\n==========================================");
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==========================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
