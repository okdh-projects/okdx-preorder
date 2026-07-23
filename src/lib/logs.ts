import { tgSendMessage, escapeHtml } from "./telegram";
import { fetchRemoteLogs, pushRemoteLog, type RemoteLog } from "./npoint";

export type AdminLog = RemoteLog;

// Fire-and-forget: push to npoint bin + Telegram bot.
export function writeLog(actor: string, action: string, details?: string) {
  const entry: RemoteLog = { ts: Date.now(), actor, action, details };
  pushRemoteLog(entry);
  const msg =
    `<b>${escapeHtml(actor)}</b>\n` +
    `${escapeHtml(action)}` +
    (details ? `\n<i>${escapeHtml(details)}</i>` : "");
  tgSendMessage(msg);
}

export async function readLogs(): Promise<AdminLog[]> {
  return await fetchRemoteLogs();
}
