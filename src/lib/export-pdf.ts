import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateNotePdf(
  title: string,
  content: string,
  author?: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);
  const boldFont = await doc.embedFont(StandardFonts.CourierBold);

  const margin = 50;
  const pageWidth = 595; // A4
  const pageHeight = 842;
  const textWidth = pageWidth - margin * 2;
  const fontSize = 10;
  const lineHeight = fontSize * 1.6;

  const lines = splitTextToLines(
    content || "*No content*",
    font,
    fontSize,
    textWidth
  );

  let currentPage = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Title
  y = drawTitle(currentPage, title, boldFont, margin, pageWidth, y);
  y -= lineHeight * 1.5;

  // Author / metadata
  if (author) {
    currentPage.drawText(`Author: ${author}`, {
      x: margin,
      y,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= lineHeight;
  }

  const now = new Date().toISOString().split("T")[0];
  currentPage.drawText(`Exported: ${now}`, {
    x: margin,
    y,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= lineHeight * 2;

  // Content
  for (const line of lines) {
    if (y < margin + lineHeight) {
      currentPage = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    if (line.startsWith("# ")) {
      currentPage.drawText(line.replace("# ", ""), {
        x: margin,
        y,
        size: 16,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= lineHeight * 2;
    } else if (line.startsWith("## ")) {
      currentPage.drawText(line.replace("## ", ""), {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= lineHeight * 1.8;
    } else if (line.startsWith("### ")) {
      currentPage.drawText(line.replace("### ", ""), {
        x: margin,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= lineHeight * 1.6;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      currentPage.drawText(`• ${line.substring(2)}`, {
        x: margin + 12,
        y,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= lineHeight;
    } else if (line.startsWith("1. ")) {
      currentPage.drawText(line, {
        x: margin + 6,
        y,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= lineHeight;
    } else if (line.startsWith("```")) {
      // Code block start/end — skip the fence
      y -= lineHeight * 0.3;
    } else if (line.trim().startsWith("`") && line.trim().endsWith("`")) {
      currentPage.drawText(line.trim(), {
        x: margin,
        y,
        size: fontSize - 1,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= lineHeight;
    } else if (line.trim() === "") {
      y -= lineHeight * 0.5;
    } else {
      currentPage.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= lineHeight;
    }
  }

  return doc.save();
}

function splitTextToLines(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number
): string[] {
  const rawLines = text.split("\n");
  const result: string[] = [];

  for (const raw of rawLines) {
    const words = raw.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? currentLine + " " + word : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);

      if (width > maxWidth && currentLine) {
        result.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      result.push(currentLine);
    }
  }

  return result;
}

function drawTitle(
  page: any,
  title: string,
  font: any,
  margin: number,
  pageWidth: number,
  y: number
): number {
  const maxWidth = pageWidth - margin * 2;
  let titleY = y;

  if (font.widthOfTextAtSize(title, 20) > maxWidth) {
    const words = title.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(test, 20) > maxWidth && line) {
        page.drawText(line, {
          x: margin,
          y: titleY,
          size: 20,
          font,
          color: rgb(0.05, 0.05, 0.05),
        });
        titleY -= 28;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, {
        x: margin,
        y: titleY,
        size: 20,
        font,
        color: rgb(0.05, 0.05, 0.05),
      });
      titleY -= 28;
    }
  } else {
    page.drawText(title, {
      x: margin,
      y: titleY,
      size: 20,
      font,
      color: rgb(0.05, 0.05, 0.05),
    });
    titleY -= 28;
  }

  return titleY;
}
