export async function generateNotePdf(
  title: string,
  content: string,
  author?: string
): Promise<string> {
  const now = new Date().toISOString().split("T")[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  body {
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 11pt;
    line-height: 1.6;
    color: #111;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  h1 { font-size: 1.8rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
  h2 { font-size: 1.4rem; margin-top: 1.5rem; }
  h3 { font-size: 1.15rem; margin-top: 1.25rem; }
  .meta { font-size: 0.8rem; color: #777; margin-bottom: 1.5rem; }
  .content { font-family: "JetBrains Mono", "Courier New", monospace; white-space: pre-wrap; line-height: 1.7; }
  hr { border: none; border-top: 1px solid #ddd; margin: 1.5rem 0; }
  @media print {
    body { padding: 0; max-width: none; }
  }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">
  ${author ? `<p><strong>Author:</strong> ${escapeHtml(author)}</p>` : ""}
  <p><strong>Exported:</strong> ${now}</p>
</div>
<div class="content">${escapeHtml(content || "*No content*")}</div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
