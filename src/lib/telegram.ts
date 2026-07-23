// Telegram integration. Static site on GH Pages => token ends up in bundle.
// Provide the value via .env (VITE_TELEGRAM_BOT_TOKEN=...) at build time.
export const TELEGRAM_BOT_TOKEN =
  (import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string | undefined) ?? "";
export const TELEGRAM_CHAT_ID = "637083046";

const API = (method: string) =>
  `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;

export async function tgSendMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;
  try {
    const res = await fetch(API("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function tgSendDocument(
  filename: string,
  jsonString: string,
  caption?: string,
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;
  try {
    const fd = new FormData();
    fd.append("chat_id", TELEGRAM_CHAT_ID);
    if (caption) fd.append("caption", caption);
    fd.append(
      "document",
      new Blob([jsonString], { type: "application/json" }),
      filename,
    );
    const res = await fetch(API("sendDocument"), { method: "POST", body: fd });
    return res.ok;
  } catch {
    return false;
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
