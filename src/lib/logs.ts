import { fetchRemoteLogs, pushRemoteLog, type RemoteLog } from "./npoint";

export type AdminLog = RemoteLog;

// Fire-and-forget: push to shared npoint bin.
export function writeLog(actor: string, action: string, details?: string) {
  const entry: RemoteLog = { ts: Date.now(), actor, action, details };
  pushRemoteLog(entry);
}

export async function readLogs(): Promise<AdminLog[]> {
  return await fetchRemoteLogs();
}
