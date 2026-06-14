import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP not configured — email sending disabled");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
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
  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV === "development") {
      console.log("\n📬 ==================================================");
      console.log("📨 [DEV EMAIL] SMTP not configured — logging email:");
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
    await transport.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}
