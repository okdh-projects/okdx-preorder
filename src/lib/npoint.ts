// Shared multi-admin log storage via npoint.io (no auth, anonymous write).
// Bin created with { "logs": [] }.
export const NPOINT_BIN_ID = "9b585d5cb42fd2e2a0b4";
const URL_ = `https://api.npoint.io/${NPOINT_BIN_ID}`;

export type RemoteLog = {
  ts: number;
  actor: string;
  action: string;
  details?: string;
};

export async function fetchRemoteLogs(): Promise<RemoteLog[]> {
  try {
    const r = await fetch(URL_, { cache: "no-store" });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j?.logs) ? (j.logs as RemoteLog[]) : [];
  } catch {
    return [];
  }
}

export async function pushRemoteLog(log: RemoteLog): Promise<void> {
  try {
    const current = await fetchRemoteLogs();
    const next = [log, ...current];
    await fetch(URL_, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: next }),
    });
  } catch {
    /* ignore */
  }
}
