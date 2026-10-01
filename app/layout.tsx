import type { Metadata } from "next";
import "./globals.css";
import { WorkspaceProvider } from "@/components/providers/WorkspaceProvider";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "OmniSpace — Modern Company Workspace & AI OS",
  description: "Notion + Linear + Trello inspired productivity operating system with Google Gemini AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full overflow-hidden antialiased">
        <WorkspaceProvider>
          <AppShell>{children}</AppShell>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
