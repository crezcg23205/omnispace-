import fs from "fs";
import path from "path";

const NOTION_DIR = "C:\\Users\\salya\\Downloads\\Private & Shared";
const PROJECTS_DIR = path.join(NOTION_DIR, "Projects");
const CSV_FILE = path.join(NOTION_DIR, "Projects 8ddf44ac451747a4bf2a8a285066e331.csv");

console.log("Analyzing Notion Export...");

if (fs.existsSync(CSV_FILE)) {
  const csvContent = fs.readFileSync(CSV_FILE, "utf-8");
  const lines = csvContent.split("\n").filter(l => l.trim().length > 0);
  console.log(`CSV has ${lines.length} lines (including header)`);
  console.log("Header:", lines[0]);
}

if (fs.existsSync(PROJECTS_DIR)) {
  const items = fs.readdirSync(PROJECTS_DIR);
  console.log(`Projects folder has ${items.length} items`);
  const dirs = items.filter(i => fs.statSync(path.join(PROJECTS_DIR, i)).isDirectory());
  console.log("Directories (attachments):", dirs);
  for (const d of dirs) {
    const files = fs.readdirSync(path.join(PROJECTS_DIR, d));
    console.log(`  Folder "${d}":`, files);
  }

  const htmlFiles = items.filter(i => i.endsWith(".html"));
  console.log(`HTML files count: ${htmlFiles.length}`);

  let pagesWithBody = 0;
  for (const hf of htmlFiles) {
    const html = fs.readFileSync(path.join(PROJECTS_DIR, hf), "utf-8");
    const pbIndex = html.indexOf('class="page-body"');
    if (pbIndex !== -1) {
      const rest = html.slice(pbIndex);
      const endArticle = rest.indexOf("</article>");
      const bodyContent = endArticle !== -1 ? rest.slice(0, endArticle) : rest;
      const textOnly = bodyContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (textOnly && textOnly !== 'class="page-body"') {
        pagesWithBody++;
        console.log(`HTML with body content: "${hf}" -> ${textOnly.slice(0, 150)}`);
      }
    }
  }
  console.log(`Total HTML pages with body: ${pagesWithBody}`);
}
