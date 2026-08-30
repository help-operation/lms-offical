import slugify from 'slugify';

export function toSlug(text: string): string {
  const slug = slugify(text, { lower: true, strict: true, trim: true });
  return slug || '';
}

export function toUniqueSlug(text: string, id: number): string {
  const slug = toSlug(text);
  return slug ? `${slug}-${id}` : String(id);
}
