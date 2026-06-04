const MAX_SLUG_WORDS = 5;
const MAX_SLUG_LENGTH = 30;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter(Boolean)
    .slice(0, MAX_SLUG_WORDS)
    .join("-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
}

export function branch_name_from_title(title: string): string {
  const slug = slugify(title);
  const suffix = Date.now().toString(36).slice(-5);
  return slug ? `${slug}-${suffix}` : suffix;
}
