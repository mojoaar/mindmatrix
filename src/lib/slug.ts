export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function ensureUniqueSlug(
  baseSlug: string,
  isUnique: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (!(await isUnique(slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
