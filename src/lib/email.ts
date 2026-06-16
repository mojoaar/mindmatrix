import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { DEFAULT_VERIFY_TEMPLATE, DEFAULT_RESET_TEMPLATE } from "@/lib/email-templates";

function markdownToHtml(md: string): string {
  return md
    .split(/\n\n+/)
    .map((block) => {
      if (/^(#{1,6})\s/.test(block.trim())) {
        const level = block.trim().match(/^(#{1,6})/)![1].length;
        const text = block.trim().replace(/^#{1,6}\s+/, "");
        return `<h${level}>${inlineFormat(text)}</h${level}>`;
      }
      if (block.trim().startsWith("- ")) {
        const items = block.split("\n").filter((l) => l.trim().startsWith("- "));
        return `<ul>${items.map((i) => `<li>${inlineFormat(i.trim().substring(2))}</li>`).join("")}</ul>`;
      }
      return `<p>${inlineFormat(block.trim().replace(/\n/g, "<br>"))}</p>`;
    })
    .join("");
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

let cachedConfig: Record<string, string> | null = null;
let configFetchTime = 0;
const CONFIG_TTL = 60_000;

async function getSystemConfig(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedConfig && now - configFetchTime < CONFIG_TTL) return cachedConfig;
  try {
    const rows = await db.query.systemConfig.findMany();
    const config: Record<string, string> = {};
    for (const row of rows) config[row.key] = row.value;
    cachedConfig = config;
    configFetchTime = now;
    return config;
  } catch {
    return cachedConfig || {};
  }
}

export function resetConfigCache() {
  cachedConfig = null;
  configFetchTime = 0;
}

function getTransporter(config: Record<string, string>) {
  const host = config.smtpHost || process.env.SMTP_HOST;
  const port = parseInt(config.smtpPort || process.env.SMTP_PORT || "587");
  const user = config.smtpUser || process.env.SMTP_USER;
  const rawPass = config.smtpPass || process.env.SMTP_PASS;
  const pass = rawPass ? decrypt(rawPass) : "";

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function renderTemplate(template: string, vars: Record<string, string>): { html: string; text: string } {
  let text = template;
  for (const [key, val] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
  }

  let html = text;
  try {
    html = markdownToHtml(text);
  } catch {
    html = text.replace(/\n/g, "<br>");
  }

  return { html, text };
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const config = await getSystemConfig();
  const transport = getTransporter(config);

  if (!transport) {
    if (process.env.NODE_ENV === "development") {
      console.log("\n📬 ==================================================");
      console.log(`📨 [DEV EMAIL] SMTP not configured — logging email:`);
      console.log(`   To:      ${to}`);
      console.log(`   Subject: ${subject}`);
      const linkMatch = html.match(/href="([^"]+)"/);
      if (linkMatch && linkMatch[1]) {
        console.log(`   🔗 Link:  ${linkMatch[1]}`);
      }
      console.log("==================================================\n");
      return true;
    }
    return false;
  }

  try {
    const from = config.smtpFrom || process.env.EMAIL_FROM || process.env.SMTP_USER || "";
    await transport.sendMail({ from, to, subject, html });
    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}

export async function sendTestEmail(to: string): Promise<{ success: true } | { error: string }> {
  const config = await getSystemConfig();
  const transport = getTransporter(config);

  if (!transport) {
    const host = config.smtpHost || process.env.SMTP_HOST;
    if (!host) return { error: "SMTP host not configured" };
    return { error: "SMTP user or password not configured" };
  }

  try {
    const from = config.smtpFrom || process.env.EMAIL_FROM || process.env.SMTP_USER || "";
    await transport.sendMail({
      from,
      to,
      subject: "MindMatrix Email Test",
      html: `<p>Your MindMatrix email configuration is working correctly.</p><p>SMTP: ${config.smtpHost || process.env.SMTP_HOST}</p>`,
    });
    return { success: true };
  } catch (err: any) {
    console.error("Test email failed:", err);
    return { error: `SMTP error: ${err.message || err}` };
  }
}

export async function sendVerificationEmail(user: { name: string; email: string }, url: string) {
  const config = await getSystemConfig();
  const template = config.emailTemplateVerify || DEFAULT_VERIFY_TEMPLATE;
  const { html } = renderTemplate(template, {
    name: user.name || user.email,
    email: user.email,
    url,
    app: "MindMatrix",
  });

  return sendEmail({ to: user.email, subject: "Verify your MindMatrix account", html });
}

export async function sendResetPasswordEmail(user: { name: string; email: string }, url: string) {
  const config = await getSystemConfig();
  const template = config.emailTemplateReset || DEFAULT_RESET_TEMPLATE;
  const { html } = renderTemplate(template, {
    name: user.name || user.email,
    email: user.email,
    url,
    app: "MindMatrix",
  });

  return sendEmail({ to: user.email, subject: "Reset your MindMatrix password", html });
}
