// Auto-generated at build time from the contents of /public/images/.
// @ts-expect-error virtual module provided by vite.config.ts
import images from "virtual:public-images";
export const PUBLIC_IMAGES: string[] = images;

export function publicImageUrl(file: string): string {
  return encodeURI(`images/${file}`);
}

// Slug used for anchor ids of category sections on the catalog page.
export function catSlug(cat: string): string {
  return "cat-" + cat.toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "");
}
