export type DateFormat = "browser" | "iso" | "us" | "eu" | "long" | "short";
export type TimeFormat = "browser" | "12h" | "24h";

export interface FormatDateOptions {
  timezone?: string;
  timeFormat?: TimeFormat;
  dateFormat?: DateFormat;
  includeTime?: boolean;
}

export function formatDate(date: Date | string, opts: FormatDateOptions = {}): string {
  const d = new Date(date);
  const { timezone = "UTC", timeFormat = "browser", dateFormat = "browser", includeTime = true } = opts;

  const tz = timezone === "browser" ? undefined : timezone;
  const hour12 = timeFormat === "12h" ? true : timeFormat === "24h" ? false : undefined;

  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: includeTime ? "2-digit" : undefined,
    minute: includeTime ? "2-digit" : undefined,
    timeZone: tz,
    hour12,
  }).formatToParts(d);

  const values: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") values[p.type] = p.value;
  }

  const YYYY = values.year || String(d.getFullYear());
  const MM = values.month || String(d.getMonth() + 1).padStart(2, "0");
  const DD = values.day || String(d.getDate()).padStart(2, "0");
  const HH = values.hour || "00";
  const mm = values.minute || "00";

  const dateStr = buildDateString(dateFormat, DD, MM, YYYY);
  if (!includeTime) return dateStr;

  const timeStr = hour12 === true
    ? `${HH}:${mm} ${values.dayPeriod || ""}`.trim()
    : `${HH}:${mm}`;

  return `${dateStr} ${timeStr}`;
}

function buildDateString(format: DateFormat, DD: string, MM: string, YYYY: string): string {
  switch (format) {
    case "iso": return `${YYYY}-${MM}-${DD}`;
    case "us": return `${MM}/${DD}/${YYYY}`;
    case "eu": return `${DD}/${MM}/${YYYY}`;
    case "long":
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric", month: "long", day: "numeric",
      }).format(new Date(`${YYYY}-${MM}-${DD}`));
    case "short":
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric", month: "short", day: "numeric",
      }).format(new Date(`${YYYY}-${MM}-${DD}`));
    case "browser":
    default:
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric", month: "short", day: "numeric",
      }).format(new Date(`${YYYY}-${MM}-${DD}`));
  }
}
