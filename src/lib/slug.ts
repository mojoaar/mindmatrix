export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateShortHash(length: number = 5): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function ensureUniqueSlug(
  baseSlug: string,
  isUnique: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;

  // First, check if the base slug itself is already unique.
  if (await isUnique(slug)) {
    return slug;
  }

  // If there's a collision, generate and append a clean 5-character short hash.
  while (true) {
    slug = `${baseSlug}-${generateShortHash(5)}`;
    if (await isUnique(slug)) {
      break;
    }
  }

  return slug;
}
