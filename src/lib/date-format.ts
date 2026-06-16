export type DateFormat = "browser" | "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | "YYYY/MM/DD" | "DD.MM.YYYY";
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

  const timeStr = hour12 !== false
    ? `${HH}:${mm} ${values.dayPeriod || ""}`.trim()
    : `${HH}:${mm}`;

  return `${dateStr} ${timeStr}`;
}

function buildDateString(format: DateFormat, DD: string, MM: string, YYYY: string): string {
  switch (format) {
    case "DD/MM/YYYY": return `${DD}/${MM}/${YYYY}`;
    case "MM/DD/YYYY": return `${MM}/${DD}/${YYYY}`;
    case "YYYY-MM-DD": return `${YYYY}-${MM}-${DD}`;
    case "YYYY/MM/DD": return `${YYYY}/${MM}/${DD}`;
    case "DD.MM.YYYY": return `${DD}.${MM}.${YYYY}`;
    case "browser":
    default:
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(Number(YYYY), Number(MM) - 1, Number(DD)));
  }
}
