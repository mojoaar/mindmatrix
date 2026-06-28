import type { Plugin } from "@/plugins/types";
import { requirePluginAccess } from "@/plugins";
import { db, note, folder } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { toSlug } from "@/lib/slug" ;
import { exec as execCb } from "child_process";
import { promisify } from "util";
const exec = promisify(execCb);
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

function cleanString(str: string): string {
  return str.replace(/[^a-zA-Z0-9-_\s]/g, "").trim();
}

function getLocalRepoPath(workspaceId: string): string {
  const baseDir = "/tmp/mindmatrix/git-sync";
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return path.join(baseDir, workspaceId);
}

function prepareGitEnvAndUrl(config: Record<string, string>, workspaceId: string): { gitUrl: string; env: NodeJS.ProcessEnv; cleanup: () => void } {
  const { repoUrl, authType, username, password, privateKey } = config;
  const env: NodeJS.ProcessEnv = { ...process.env };
  let gitUrl = repoUrl;
  let cleanup = () => {};

  if (authType === "https" && username && password) {
    // Inject username and password into HTTPS URL
    try {
      const urlObj = new URL(repoUrl);
      urlObj.username = encodeURIComponent(username);
      urlObj.password = encodeURIComponent(password);
      gitUrl = urlObj.toString();
    } catch {
      // Fallback if URL is invalid
    }
  } else if (authType === "ssh" && privateKey) {
    const keyPath = `/tmp/mm_ssh_${workspaceId}`;
    fs.writeFileSync(keyPath, privateKey.trim() + "\n", { mode: 0o600 });
    env.GIT_SSH_COMMAND = `ssh -i ${keyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`;
    cleanup = () => {
      try {
        fs.unlinkSync(keyPath);
      } catch {
        // Ignore
      }
    };
  }

  return { gitUrl, env, cleanup };
}

export const gitSyncPlugin: Plugin = {
  id: "git-sync",
  name: "Git Sync",
  description: "Sync notes to a remote Git repository",
  version: "0.1.0",
  apiRoutes: {
    "POST /api/plugins/git-sync/push": async (req: Request) => {
      let cleanupFn = () => {};
      try {
        const { workspaceId } = await req.json();
        const access = await requirePluginAccess(req, workspaceId, "git-sync");
        if (access instanceof Response) return access;

        const { config } = access;
        const { repoUrl, branch = "main" } = config;

        if (!repoUrl) {
          return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
        }

        const localPath = getLocalRepoPath(workspaceId);
        const { gitUrl, env, cleanup } = prepareGitEnvAndUrl(config, workspaceId);
        cleanupFn = cleanup;

        // Initialize or open repository
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath, { recursive: true });
          await exec(`git clone -b ${branch} ${gitUrl} .`, { cwd: localPath, env });
        } else {
          try {
            await exec(`git fetch origin ${branch} && git reset --hard origin/${branch}`, { cwd: localPath, env, timeout: 30000 });
          } catch {
            // If branch is new or empty, ignore hard reset error
          }
        }

        // Clean out existing .md files in the clone path to prepare fresh write (except .git)
        const files = fs.readdirSync(localPath);
        for (const file of files) {
          if (file !== ".git") {
            const filePath = path.join(localPath, file);
            if (fs.statSync(filePath).isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else if (file.endsWith(".md")) {
              fs.unlinkSync(filePath);
            }
          }
        }

        // Retrieve notes from database
        const notes = await db.query.note.findMany({
          where: eq(note.workspaceId, workspaceId),
          with: { folder: true },
        });

        // Write notes to the repository
        for (const n of notes) {
          let folderPath = localPath;
          if (n.folder) {
            folderPath = path.join(localPath, cleanString(n.folder.name));
            if (!fs.existsSync(folderPath)) {
              fs.mkdirSync(folderPath, { recursive: true });
            }
          }

          const fileContent = `---
title: ${n.title}
slug: ${n.slug}
updatedAt: ${n.updatedAt.toISOString()}
---

${n.content}`;

          const fileName = `${n.slug}.md`;
          fs.writeFileSync(path.join(folderPath, fileName), fileContent, "utf8");
        }

        // Commit and push
        await exec(`git config user.name "MindMatrix" && git config user.email "bot@mindmatrix.local"`, { cwd: localPath, env });
        await exec(`git add .`, { cwd: localPath, env });
        
        let hasChanges = true;
        try {
          await exec(`git commit -m "MindMatrix Sync: ${new Date().toISOString()}"`, { cwd: localPath, env });
        } catch {
          // git commit fails if there are no changes
          hasChanges = false;
        }

        if (hasChanges) {
          await exec(`git push origin ${branch}`, { cwd: localPath, env, timeout: 30000 });
        }

        return NextResponse.json({ success: true, pushed: hasChanges });
      } catch (err: unknown) {
        console.error("Git Sync Push Failed:", err);
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) || "Push failed" }, { status: 500 });
      } finally {
        cleanupFn();
      }
    },

    "POST /api/plugins/git-sync/pull": async (req: Request) => {
      let cleanupFn = () => {};
      try {
        const { workspaceId } = await req.json();
        const access = await requirePluginAccess(req, workspaceId, "git-sync");
        if (access instanceof Response) return access;

        const { config, userId } = access;
        const { repoUrl, branch = "main" } = config;

        if (!repoUrl) {
          return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
        }

        const localPath = getLocalRepoPath(workspaceId);
        const { gitUrl, env, cleanup } = prepareGitEnvAndUrl(config, workspaceId);
        cleanupFn = cleanup;

        // Clone or Pull
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath, { recursive: true });
          await exec(`git clone -b ${branch} ${gitUrl} .`, { cwd: localPath, env });
        } else {
          await exec(`git fetch origin ${branch} && git reset --hard origin/${branch}`, { cwd: localPath, env, timeout: 30000 });
        }

        // Read files recursively
        const readFilesRecursively = (dir: string): string[] => {
          let results: string[] = [];
          const list = fs.readdirSync(dir);
          list.forEach((file) => {
            if (file === ".git") return;
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat && stat.isDirectory()) {
              results = results.concat(readFilesRecursively(fullPath));
            } else if (file.endsWith(".md")) {
              results.push(fullPath);
            }
          });
          return results;
        };

        const mdFiles = readFilesRecursively(localPath);
        let importedCount = 0;

        for (const filePath of mdFiles) {
          const rawContent = fs.readFileSync(filePath, "utf8");
          const relativePath = path.relative(localPath, filePath);
          const dirName = path.dirname(relativePath);

          // Simple Frontmatter Parser
          let title = path.basename(filePath, ".md");
          let slug = toSlug(title);
          let content = rawContent;

          const frontmatterMatch = rawContent.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
          if (frontmatterMatch) {
            const fmText = frontmatterMatch[1];
            content = frontmatterMatch[2];

            const titleMatch = fmText.match(/title:\s*(.+)/);
            if (titleMatch) title = titleMatch[1].trim();

            const slugMatch = fmText.match(/slug:\s*(.+)/);
            if (slugMatch) slug = slugMatch[1].trim();
          }

          // Handle folders
          let folderId: string | null = null;
          if (dirName && dirName !== ".") {
            const folderSlug = toSlug(dirName);
            let existingFolder = await db.query.folder.findFirst({
              where: and(eq(folder.workspaceId, workspaceId), eq(folder.slug, folderSlug)),
            });

            if (!existingFolder) {
              const newFolderId = crypto.randomUUID();
              [existingFolder] = await db.insert(folder).values({
                id: newFolderId,
                workspaceId,
                name: dirName,
                slug: folderSlug,
                createdById: userId,
                position: 0,
              }).returning();
            }
            folderId = existingFolder.id;
          }

          // Upsert Note
          const existingNote = await db.query.note.findFirst({
            where: and(eq(note.workspaceId, workspaceId), eq(note.slug, slug)),
          });

          if (existingNote) {
            if (existingNote.content !== content || existingNote.title !== title) {
              await db.update(note).set({
                title,
                content,
                folderId,
                updatedAt: new Date(),
                updatedById: userId,
              }).where(eq(note.id, existingNote.id));
              importedCount++;
            }
          } else {
            const newNoteId = crypto.randomUUID();
            await db.insert(note).values({
              id: newNoteId,
              workspaceId,
              folderId,
              title,
              slug,
              content,
              createdById: userId,
              updatedById: userId,
            });
            importedCount++;
          }
        }

        return NextResponse.json({ success: true, updatedCount: importedCount });
      } catch (err: unknown) {
        console.error("Git Sync Pull Failed:", err);
        return NextResponse.json({ error: err instanceof Error ? err.message : String(err) || "Pull failed" }, { status: 500 });
      } finally {
        cleanupFn();
      }
    },
  },
};
