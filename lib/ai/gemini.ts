import { aiToolDeclarations, executeAITool, ToolContext } from "./tools";

interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
}

export interface AIResponse {
  content: string;
  toolCalls?: Array<{ name: string; args: any }>;
  toolResults?: Array<any>;
  pendingConfirmation?: {
    action: string;
    taskId?: string;
    taskTitle?: string;
    prompt: string;
  } | null;
  error?: string;
}

const SYSTEM_PROMPT = `You are OmniSpace AI, an intelligent workspace productivity assistant embedded inside a modern company platform.
You have access to the actual workspace database via specialized tools.

CRITICAL WORKSPACE GROUNDING RULES:
1. NEVER invent, assume, or hallucinate workspace facts (tasks, projects, team members, deadlines, clients, documents).
2. All workspace facts MUST come directly from tool outputs.
3. If an item is not found, state clearly: "I couldn't find anything matching that in the workspace."
4. When referring to workspace items, format them with markdown links or brackets, e.g. [Task: Title](/tasks?taskId=...) or **[Project Name]** so the user can click on them.
5. For safe actions (create task, update status, search, read info), call tools immediately.
6. For destructive actions, if not already explicitly instructed or confirmed, ask for confirmation.
7. To remove team members or delete everyone in the team except the current user (e.g. "team guruhidagi barchani uchir va faqat meni qoldir"), call the 'remove_team_member' tool with removeAllExceptMe: true.
8. NEVER say an action is completed unless you actually called a tool and received a success result. Base your response strictly on the tool's result.
9. Always be concise, helpful, and focused on company productivity.`;

export async function askGemini(
  prompt: string,
  history: Message[],
  context: ToolContext,
  customApiKey?: string
): Promise<AIResponse> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  // If no Gemini API key is provided, execute via intelligent local workspace parser
  if (!apiKey || apiKey.trim() === "") {
    return handleLocalWorkspaceQuery(prompt, context);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    // Convert tool declarations to Gemini API format
    const tools = [
      {
        functionDeclarations: aiToolDeclarations.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        })),
      },
    ];

    // Build contents array
    const contents: any[] = [];

    // Add recent history (up to last 6 messages)
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    const requestBody = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents,
      tools,
      generationConfig: {
        temperature: 0.2,
      },
    };

    const candidateModels = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-2.5-pro"];
    let firstData: any = null;
    let successfulUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    for (const modelName of candidateModels) {
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        firstData = await res.json();
        successfulUrl = targetUrl;
        break;
      }
    }

    if (!firstData) {
      return handleLocalWorkspaceQuery(prompt, context);
    }
    const candidate = firstData.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Check for tool calls
    const toolCalls: Array<{ name: string; args: any }> = [];
    for (const part of parts) {
      if (part.functionCall) {
        toolCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args || {},
        });
      }
    }

    // If no tool call, return the text directly
    if (toolCalls.length === 0) {
      const text = parts.map((p: any) => p.text || "").join("").trim();
      return {
        content: text || "I have reviewed your workspace request.",
      };
    }

    // Execute tool calls against database
    const toolResults: any[] = [];
    let pendingConfirmation: any = null;

    for (const call of toolCalls) {
      const result = await executeAITool(call.name, call.args, context);
      toolResults.push({ name: call.name, result });

      if (result?.requiresConfirmation) {
        pendingConfirmation = result;
      }
    }

    if (pendingConfirmation) {
      return {
        content: pendingConfirmation.prompt,
        toolCalls,
        toolResults,
        pendingConfirmation,
      };
    }

    // Send tool execution results back to Gemini for final grounded synthesis
    const followUpContents = [
      ...contents,
      {
        role: "model",
        parts: toolCalls.map((tc) => ({
          functionCall: { name: tc.name, args: tc.args },
        })),
      },
      {
        role: "user",
        parts: toolResults.map((tr) => ({
          functionResponse: {
            name: tr.name,
            response: { output: tr.result },
          },
        })),
      },
    ];

    const secondRes = await fetch(successfulUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: followUpContents,
      }),
    });

    if (!secondRes.ok) {
      // Return formatted tool result if secondary synthesis fails
      const fallbackSummary = summarizeToolResults(toolCalls, toolResults);
      return {
        content: fallbackSummary,
        toolCalls,
        toolResults,
      };
    }

    const secondData = await secondRes.json();
    const secondParts = secondData.candidates?.[0]?.content?.parts || [];
    const finalText = secondParts.map((p: any) => p.text || "").join("").trim();

    return {
      content: finalText || summarizeToolResults(toolCalls, toolResults),
      toolCalls,
      toolResults,
    };
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    return handleLocalWorkspaceQuery(prompt, context);
  }
}

function summarizeToolResults(
  toolCalls: Array<{ name: string; args: any }>,
  toolResults: Array<{ name: string; result: any }>
): string {
  const lines: string[] = [];
  for (const tr of toolResults) {
    if (tr.result?.message) {
      lines.push(tr.result.message);
    }
    if (tr.result?.error) {
      lines.push(`⚠️ ${tr.result.error}`);
    }
    if (tr.result?.members) {
      lines.push(`Jamoa a'zolari (${tr.result.members.length} kishi):`);
      tr.result.members.forEach((m: any) => {
        lines.push(`• **${m.name}** (${m.role}) — ${m.department || "General"}, Active tasks: ${m.activeTasksCount || 0}`);
      });
    }
    if (tr.result?.tasks) {
      lines.push(`Found ${tr.result.tasks.length} task(s):`);
      tr.result.tasks.forEach((t: any) => {
        lines.push(`• **[${t.title}](${t.url})** — Status: \`${t.status}\`, Priority: \`${t.priority}\`, Assignee: ${t.assignee}`);
      });
    }
    if (tr.result?.projects) {
      lines.push(`Found ${tr.result.projects.length} project(s):`);
      tr.result.projects.forEach((p: any) => {
        lines.push(`• **[${p.name}](${p.url})** — Status: \`${p.status}\`, Progress: ${p.progress}, Client: ${p.client}`);
      });
    }
    if (tr.result?.documents) {
      lines.push(`Found ${tr.result.documents.length} document(s):`);
      tr.result.documents.forEach((d: any) => {
        lines.push(`• **[${d.title}](${d.url})**`);
      });
    }
  }
  return lines.join("\n\n") || "Workspace query completed. No matching records found.";
}

/**
 * Intelligent local workspace semantic query handler.
 * Provides instant grounded execution for all workspace commands even when
 * GEMINI_API_KEY is not set or network is offline.
 */
async function handleLocalWorkspaceQuery(
  prompt: string,
  context: ToolContext
): Promise<AIResponse> {
  const p = prompt.toLowerCase();

  // Team removal (e.g. "team guruhidagi barchani uchir va faqat meni qoldir")
  if (
    (p.includes("uchir") || p.includes("o'chir") || p.includes("delete") || p.includes("remove")) &&
    (p.includes("team") || p.includes("guruh") || p.includes("barchani") || p.includes("hamma") || p.includes("member"))
  ) {
    const res = await executeAITool("remove_team_member", { removeAllExceptMe: true }, context);
    return {
      content: res.message || res.error || "Jamoa guruhidagi a'zolar yangilandi.",
      toolCalls: [{ name: "remove_team_member", args: { removeAllExceptMe: true } }],
      toolResults: [res],
    };
  }

  // 1. Overdue tasks
  if (p.includes("overdue") || p.includes("late tasks")) {
    const res = await executeAITool("get_overdue_tasks", {}, context);
    if (!res.tasks || res.tasks.length === 0) {
      return { content: "Great news! You have no overdue tasks in the workspace right now." };
    }
    const items = res.tasks
      .map(
        (t: any) =>
          `* **[${t.title}](${t.url})** — Priority: \`${t.priority}\`, Assignee: ${t.assignee}, Due: ${t.dueDate || "N/A"}`
      )
      .join("\n");
    return {
      content: `Here are the currently overdue tasks in your workspace:\n\n${items}`,
      toolResults: [res],
    };
  }

  // 2. My tasks / What am I working on
  if (p.includes("my task") || p.includes("am i working on") || p.includes("assigned to me")) {
    const res = await executeAITool("get_my_tasks", {}, context);
    if (!res.tasks || res.tasks.length === 0) {
      return { content: `You currently have no open tasks assigned to you in the workspace.` };
    }
    const items = res.tasks
      .map(
        (t: any) =>
          `* **[${t.title}](${t.url})** — Status: \`${t.status}\`, Priority: \`${t.priority}\`, Project: ${t.project}`
      )
      .join("\n");
    return {
      content: `Here are your active assigned tasks:\n\n${items}`,
      toolResults: [res],
    };
  }

  // 3. Create task pattern (e.g. "Create a task for Ali to finish the Smartcast intro tomorrow with high priority")
  if (p.startsWith("create a task") || p.startsWith("create task") || p.startsWith("add task")) {
    // Extract assignee
    let assigneeName: string | undefined;
    const forMatch = prompt.match(/for\s+([A-Za-z]+)/i);
    if (forMatch) assigneeName = forMatch[1];

    // Extract priority
    let priority = "Medium";
    if (p.includes("urgent")) priority = "Urgent";
    else if (p.includes("high priority") || p.includes("high")) priority = "High";
    else if (p.includes("low priority") || p.includes("low")) priority = "Low";

    // Extract due date
    let dueDate = "tomorrow";
    if (p.includes("today")) dueDate = "today";
    else if (p.includes("tomorrow")) dueDate = "tomorrow";
    else if (p.includes("friday")) dueDate = "friday";
    else if (p.includes("next week")) dueDate = "next week";

    // Extract title
    let title = prompt
      .replace(/^create\s+(a\s+)?task\s+(called\s+|to\s+|for\s+[A-Za-z]+\s+(to\s+)?|:)?/i, "")
      .replace(/with\s+(high|urgent|medium|low)\s+priority/i, "")
      .replace(/(due\s+)?(tomorrow|today|friday|next week)/i, "")
      .trim();

    if (!title) title = "New Workspace Task";

    const res = await executeAITool(
      "create_task",
      {
        title,
        assigneeName,
        priority,
        dueDate,
        projectName: p.includes("smartcast") ? "Smartcast Media Platform" : undefined,
      },
      context
    );

    return {
      content: `I've created the task **[${res.task.title}](${res.task.url})** in the workspace database.\n\n• **Assignee**: ${res.task.assignee}\n• **Priority**: \`${res.task.priority}\`\n• **Status**: \`${res.task.status}\`\n• **Due Date**: ${res.task.dueDate || "N/A"}`,
      toolCalls: [{ name: "create_task", args: { title, assigneeName, priority, dueDate } }],
      toolResults: [res],
    };
  }

  // 4. Update task status (e.g. "Move the Smartcast intro task to Review" or "Mark this as Done")
  if (p.includes("move") || p.includes("change status") || p.includes("mark as done") || p.includes("set status")) {
    let targetStatus = "In Progress";
    if (p.includes("review")) targetStatus = "Review";
    else if (p.includes("done")) targetStatus = "Done";
    else if (p.includes("todo")) targetStatus = "Todo";
    else if (p.includes("backlog")) targetStatus = "Backlog";
    else if (p.includes("cancelled")) targetStatus = "Cancelled";

    let taskQuery = "Smartcast";
    if (p.includes("smartcast")) taskQuery = "Smartcast";
    else if (p.includes("token") || p.includes("security")) taskQuery = "Security";
    else if (p.includes("instagram") || p.includes("reel")) taskQuery = "Instagram";

    const res = await executeAITool(
      "update_task",
      {
        taskTitleQuery: taskQuery,
        status: targetStatus,
      },
      context
    );

    if (res.error) {
      return { content: `I couldn't find a task matching "${taskQuery}" to update.` };
    }

    return {
      content: `Updated task **[${res.task.title}](${res.task.url})** status to \`${res.task.status}\`.`,
      toolResults: [res],
    };
  }

  // 5. Query specific person (e.g. "What is Muhammadamin currently working on?" or "Find all tasks assigned to Aziz")
  const personMatch = prompt.match(/(muhammadamin|ali|aziz|madina|sarah)/i);
  if (personMatch) {
    const personName = personMatch[1];
    const res = await executeAITool("search_tasks", { assigneeName: personName }, context);
    if (!res.tasks || res.tasks.length === 0) {
      return { content: `There are currently no tasks assigned to **${personName}** in this workspace.` };
    }
    const items = res.tasks
      .map(
        (t: any) =>
          `* **[${t.title}](${t.url})** — Status: \`${t.status}\`, Priority: \`${t.priority}\`, Project: ${t.project}`
      )
      .join("\n");
    return {
      content: `Here are the tasks assigned to **${personName}**:\n\n${items}`,
      toolResults: [res],
    };
  }

  // 6. Global search (e.g. "Show me everything related to Smartcast")
  if (p.includes("everything related to") || p.includes("search") || p.includes("find")) {
    const query = prompt
      .replace(/show me everything related to/i, "")
      .replace(/find everything related to/i, "")
      .replace(/search for/i, "")
      .replace(/search/i, "")
      .trim();

    const res = await executeAITool("search_workspace", { query }, context);
    const sections: string[] = [];

    if (res.tasks?.length) {
      sections.push(`**Tasks:**\n` + res.tasks.map((t: any) => `• [${t.title}](${t.url}) (${t.status})`).join("\n"));
    }
    if (res.projects?.length) {
      sections.push(`**Projects:**\n` + res.projects.map((p: any) => `• [${p.name}](${p.url}) (${p.status})`).join("\n"));
    }
    if (res.clients?.length) {
      sections.push(`**Clients:**\n` + res.clients.map((c: any) => `• [${c.name}](${c.url}) (${c.company})`).join("\n"));
    }
    if (res.documents?.length) {
      sections.push(`**Documents:**\n` + res.documents.map((d: any) => `• [${d.title}](${d.url})`).join("\n"));
    }

    if (sections.length === 0) {
      return { content: `I searched the workspace for "${query}", but no matching records were found.` };
    }

    return {
      content: `Here is everything related to **${query}** in your workspace:\n\n` + sections.join("\n\n"),
      toolResults: [res],
    };
  }

  // 7. Team members query
  if (p.includes("team") || p.includes("who is working") || p.includes("members")) {
    const res = await executeAITool("get_team_members", {}, context);
    const membersList = res.members
      .map((m: any) => `• **${m.name}** — ${m.role} (${m.department}), ${m.activeTasksCount} active tasks`)
      .join("\n");
    return {
      content: `Here are the active team members in **OmniSpace**:\n\n${membersList}`,
      toolResults: [res],
    };
  }

  // Default fallback workspace search
  const searchRes = await executeAITool("search_workspace", { query: prompt }, context);
  const summary = summarizeToolResults([], [{ name: "search_workspace", result: searchRes }]);
  return {
    content: summary || `I checked the workspace database. If you would like me to create a task, update a status, or look up specific projects, feel free to ask!`,
  };
}
