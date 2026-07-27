// Files placed manually in /public/images/. Keep in sync with folder contents.
export const PUBLIC_IMAGES = [
  "logo.png",
  "znachok.png",
  "Instagram post - 2 (2) (2) (2).png",
  "Настя 52 (2) (2).png",
  "кружка эли мокап светлый (2).png",
  "магнит (2) (2).png",
  "хоровод (2) (2).png",
  "цитата 11 (2) (2).png",
  "цитата 21 (2) (2).png",
  "цитата 31 (2) (2).png",
] as const;

export function publicImageUrl(file: string): string {
  return encodeURI(`images/${file}`);
}

// Slug used for anchor ids of category sections on the catalog page.
export function catSlug(cat: string): string {
  return "cat-" + cat.toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "");
}
