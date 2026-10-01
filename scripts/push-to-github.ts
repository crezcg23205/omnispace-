import fs from "fs";
import path from "path";

/**
 * Push entire OmniSpace codebase to GitHub repository using GitHub REST API
 * (Works without Git CLI installed on Windows!)
 *
 * Usage:
 *   npx tsx scripts/push-to-github.ts <github_username> <repo_name> <personal_access_token>
 */

const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
]);

const IGNORED_FILES = new Set([
  ".env",
  ".env.local",
  "dev.db-journal",
  "yarn.lock",
  "package-lock.json.bak",
]);

function getAllFiles(dir: string, baseDir: string = dir): { path: string; fullPath: string }[] {
  let results: { path: string; fullPath: string }[] = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

    if (IGNORED_DIRS.has(file)) continue;
    if (IGNORED_FILES.has(file)) continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      // Ignore files larger than 15MB
      if (stat.size < 15 * 1024 * 1024) {
        results.push({ path: relPath, fullPath });
      }
    }
  }

  return results;
}

async function main() {
  const [owner, repo, token] = process.argv.slice(2);

  if (!owner || !repo || !token) {
    console.log("❌ Foydalanish:");
    console.log("   npx tsx scripts/push-to-github.ts <github_username> <repo_nomi> <github_token>");
    console.log("");
    console.log("Masalan:");
    console.log("   npx tsx scripts/push-to-github.ts crez_motion omnispace ghp_abc123xyz...");
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "OmniSpace-Deployer",
  };

  console.log(`🚀 GitHub'ga yuklash boshlandi: ${owner}/${repo}...`);

  // 1. Check repository
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    const err = await repoRes.text();
    console.error(`❌ Repozitoriya topilmadi yoki token xato:`, err);
    process.exit(1);
  }

  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch || "main";

  // 2. Scan files
  const rootDir = process.cwd();
  const files = getAllFiles(rootDir);
  console.log(`📁 Jami yuklanadigan fayllar soni: ${files.length} ta.`);

  // 3. Upload Blobs
  const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    process.stdout.write(`\r⏳ Fayllar tayyorlanmoqda: ${i + 1}/${files.length} (${file.path})`);

    const contentBuffer = fs.readFileSync(file.fullPath);
    const isBinary = contentBuffer.some((b) => b === 0);
    const content = isBinary ? contentBuffer.toString("base64") : contentBuffer.toString("utf-8");
    const encoding = isBinary ? "base64" : "utf-8";

    const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content, encoding }),
    });

    if (!blobRes.ok) {
      console.error(`\n❌ Xatolik ${file.path}:`, await blobRes.text());
      continue;
    }

    const blobData = await blobRes.json();
    treeItems.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blobData.sha,
    });
  }

  console.log("\n🌲 Git Tree tuzilmoqda...");

  // 4. Create Tree
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tree: treeItems }),
  });

  if (!treeRes.ok) {
    console.error("❌ Tree yaratishda xatolik:", await treeRes.text());
    process.exit(1);
  }

  const treeData = await treeRes.json();

  // 5. Get latest commit SHA if exists
  let parentCommitSha: string | null = null;
  const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`, { headers });
  if (refRes.ok) {
    const refData = await refRes.json();
    parentCommitSha = refData.object.sha;
  }

  // 6. Create Commit
  console.log("💾 Commit yaratilmoqda...");
  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: "Deploy OmniSpace workspace with Notion relational database & Telegram bot",
      tree: treeData.sha,
      parents: parentCommitSha ? [parentCommitSha] : [],
    }),
  });

  if (!commitRes.ok) {
    console.error("❌ Commit yaratishda xatolik:", await commitRes.text());
    process.exit(1);
  }

  const commitData = await commitRes.json();

  // 7. Update Ref
  console.log(`📌 '${defaultBranch}' tarmog'iga ulanmoqda...`);
  const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      sha: commitData.sha,
      force: true,
    }),
  });

  if (!updateRefRes.ok) {
    // If ref doesn't exist, create it
    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${defaultBranch}`,
        sha: commitData.sha,
      }),
    });
  }

  console.log(`\n🎉 TABRIKLAYMIZ! Barcha fayllar GitHub'ga muvaffaqiyatli yuklandi!`);
  console.log(`👉 Repozitoriya havolasi: https://github.com/${owner}/${repo}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
});
