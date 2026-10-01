# ⚡ OmniSpace — Modern Notion-Inspired Company Workspace & AI Operating System

OmniSpace is a **production-ready, free, self-hosted company workspace and productivity operating system** designed for small-to-medium teams. Inspired by the best of **Notion**, **Linear**, and **Trello**, OmniSpace seamlessly integrates **Google Gemini AI** directly with your actual relational database.

---

## 🌟 Key Features

### 1. 🗂️ Notion-Style Workspace & Databases
* **Hierarchical Documents & Wiki**: Tree-structured wiki pages with parent/child relationships.
* **Block-Based Editor**: Block architecture supporting headings (H1, H2), paragraphs, checklists (to-dos), bulleted lists, numbered lists, quotes, code snippets, dividers, and callouts.
* **Slash Command Menu**: Simply type `/` anywhere to insert blocks or change block types.

### 2. 📋 Task Management (Linear + Trello)
* **Multiple Views**:
  * **Kanban Board**: Drag-and-drop tasks between *Backlog*, *To Do*, *In Progress*, *Review*, and *Done*. Drag operations immediately update the database.
  * **List View**: Dense, sortable, filterable table with quick status and priority selectors.
  * **Calendar View**: Monthly schedule of all upcoming deadlines with visual overdue alerts.
  * **My Tasks View**: Instantly filter tasks assigned specifically to the logged-in user.
* **Task Slide-Over Panel**: Inline title editing, status, priority, assignee, due date, project & client links, interactive subtasks checklist, comment thread, and activity history.
* **@Mentions Autocomplete**: Type `@` in task descriptions, comments, or documents to tag teammates and automatically dispatch notifications to their Inbox.

### 3. 🎯 Projects & Clients
* **Projects**: Track initiatives, deadlines, calculated progress bars, linked tasks, documents, and client associations.
* **Clients Database**: CRM records with primary contact, company, phone, email, notes, and direct links to active deliverables.

### 4. 👥 Team & Workload
* View team members, roles (*Owner*, *Admin*, *Member*), departments, and real-time active vs. completed task counters.
* Admin controls to invite and manage collaborators.

### 5. 📬 Notion-Like Inbox
* Notification center notifying you when tasks are assigned to you, you are mentioned, comments are posted on your tasks, or deadlines approach.
* Visual unread indicators and 1-click "Mark all as read".

### 6. 🤖 Google Gemini AI Workspace Assistant
* **Database-Grounded Intelligence**: The AI never hallucinates company facts. It queries the actual database through structured tool calling.
* **Action Tools Included**:
  * `search_tasks`: Search tasks by title, status, priority, assignee, or project.
  * `create_task`: Creates tasks in the database from natural language instructions.
  * `update_task`: Moves tasks, modifies deadlines, or updates priorities.
  * `delete_task`: Safely deletes tasks with required user confirmation.
  * `get_overdue_tasks`: Instantly flags past-due deliverables.
  * `get_my_tasks`: Returns the user's workload.
  * `search_workspace`: Unified global search across tasks, projects, clients, and documents.
* **Interactive Confirmation System**: Before executing destructive actions (e.g. deleting a task), the AI renders an interactive card with **Confirm** and **Cancel** buttons.
* **Clickable Workspace References**: AI responses contain interactive links `[Task Title]` that open the task slide-over panel directly.
* **Resilient Offline/Local Processor**: Even if no external API key is configured or network is offline, the workspace assistant processes common productivity requests locally.

### 7. ⚡ Productivity & Polish
* **Command Palette (`Cmd/Ctrl + K`)**: Instant search and navigation across tasks, projects, clients, wiki pages, and team members.
* **Keyboard Shortcuts**:
  * `C` → Create new task
  * `/` → Quick search / command palette
  * `Cmd/Ctrl + K` → Open Command Palette
  * `Esc` → Close modals & slide-overs
* **Dark Mode & Light Mode**: Seamless theme switching with high-contrast accessibility.
* **Multi-Workspace Isolation**: Complete data isolation scoped to `workspaceId`.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
* **Backend**: Next.js Server Actions & Route Handlers.
* **Database**: SQLite (default local zero-setup) with **Prisma ORM** (easily swappable with PostgreSQL).
* **Authentication**: Secure HTTP-only JWT sessions using `jose` and `bcryptjs`.
* **AI Engine**: Google Gemini API (`@google/genai`).

---

## 🚀 Quick Start Guide

### 1. Installation

```bash
cd omnispace
npm install
```

### 2. Environment Configuration

Check the `.env` file (or copy from `.env.example`):

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="omnispace-super-secret-key-32chars-long-secure-random"
GEMINI_API_KEY="" # Optional: Free key from https://aistudio.google.com/
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Note**: OmniSpace works 100% out of the box even without a Gemini API key using its built-in workspace processor. To connect real Google Gemini models (`gemini-2.5-flash`), simply provide your key in `.env` or in the in-app **Settings** page.

### 3. Initialize Database & Seed Demo Data

```bash
# Push Prisma schema to SQLite
npx prisma db push

# Seed 5 users, 3 projects, 10 tasks, 3 clients, 5 wiki pages, comments & activity
npm run db:seed
```

### 4. Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Test Accounts (Pre-Seeded)

The login screen provides **1-click buttons** to test any role instantly:

| Name | Email | Role | Department | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Muhammadamin Khusanov** | `muhammadamin@company.com` | Owner | Management | `password123` |
| **Ali Valiyev** | `ali@company.com` | Admin | Design | `password123` |
| **Aziz Rakhimov** | `aziz@company.com` | Member | Engineering | `password123` |
| **Madina Karimova** | `madina@company.com` | Member | Marketing | `password123` |
| **Sarah Connor** | `sarah@company.com` | Member | Product & QA | `password123` |

---

## 🤖 Example Gemini AI Commands

You can type any natural language request into the compact **Home AI input** or the **Full AI Assistant (`/ai`)**:

* `"What tasks are overdue?"` → Queries database for overdue items.
* `"Create a task for Ali to finish the Smartcast intro tomorrow with high priority."` → Inserts real task with assignee Ali, priority High, due tomorrow.
* `"What is Muhammadamin currently working on?"` → Returns assigned active deliverables.
* `"Show me everything related to Smartcast."` → Unified search across tasks, projects, CRM clients, and documents.
* `"Move the Smartcast intro task to Review."` → Updates task status in database.
* `"Find all tasks assigned to Aziz."` → Filters tasks for Aziz Rakhimov.
* `"Delete task 'AI Generated Pipeline Task'"` → Triggers interactive confirmation card (Cancel / Confirm).

---

## 🧪 Automated Test Suite

OmniSpace includes an automated end-to-end critical functionality test suite:

```bash
npm test
```

Verifies:
1. User Authentication & Password Hashing
2. Multi-Workspace Isolation (zero data leakage)
3. Task Creation & Assignment
4. Status Updates & Database Persistence
5. Project & Client Relations
6. @Mentions & Inbox Notification Generation
7. AI Task Creation Tool Execution
8. AI Task Modification Tool Execution
9. AI Overdue Task Detection
10. AI Destructive Safety Confirmation System

---

## 📁 Architecture Overview

```
omnispace/
├── app/
│   ├── api/             # REST API routes (tasks, projects, clients, ai, auth, etc.)
│   ├── ai/              # Full Gemini AI Assistant chat interface
│   ├── tasks/           # Task management (Kanban, List, Calendar)
│   ├── projects/        # Projects and milestones directory
│   ├── clients/         # CRM Clients database
│   ├── documents/       # Notion-style wiki & block editor
│   ├── team/            # Team members & workload directory
│   ├── inbox/           # Notification center
│   ├── calendar/        # Deadline schedule
│   ├── settings/        # Workspace & AI key configuration
│   ├── login/           # Authentication screen with 1-click test selector
│   ├── register/        # Onboarding / New workspace creation
│   └── page.tsx         # Executive Home Dashboard
├── components/
│   ├── common/          # MentionTextarea (@team autocomplete)
│   ├── documents/       # BlockEditor (Notion block architecture & slash menu)
│   ├── layout/          # AppShell (Auth gate & layouts)
│   ├── modals/          # CommandPalette, CreateTaskModal, TaskDetailPanel
│   ├── providers/       # WorkspaceProvider (Global session, theme, shortcuts)
│   ├── sidebar/         # Collapsible responsive sidebar
│   └── tasks/           # TaskKanbanView, TaskListView, TaskCalendarView
├── lib/
│   ├── ai/              # Gemini SDK, function declarations & execution engine
│   ├── activity.ts      # Activity logging, mentions parsing, notifications
│   ├── auth.ts          # JWT session cookies, password hashing
│   └── prisma.ts        # Prisma client singleton
├── prisma/
│   ├── schema.prisma    # Complete relational database models & indexes
│   └── seed.ts          # Comprehensive seed dataset
└── tests/
    └── run-tests.ts     # Automated critical path test runner
```

---

## 🚢 Deployment (100% Free Tier Compatible)

* **Frontend & Backend**: Deploy to **Vercel** or **Cloudflare Pages** for free.
* **Database**:
  * Local/Self-Hosted: SQLite (included zero-setup).
  * Production Cloud: Compatible with free PostgreSQL databases (e.g. Supabase, Neon) simply by updating `DATABASE_URL` in `.env` and `provider = "postgresql"` in `prisma/schema.prisma`.

---

© 2026 OmniSpace. Free and Open-Source Workspace Operating System.
