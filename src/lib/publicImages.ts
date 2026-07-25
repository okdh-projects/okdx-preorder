// List of files in public/images/ available in the "picture" dropdown of the product editor.
// If you add new files into public/images/, list them here to make them selectable.
export const PUBLIC_IMAGES: string[] = [
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
];

export function publicImageUrl(name: string): string {
  return `./images/${encodeURI(name)}`;
}
