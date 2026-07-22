export type AdminLog = {
  id: string;
  at: number;
  actor: string;
  action: string;
  details?: string;
};

const KEY = "okdx-admin-logs";

export function readLogs(): AdminLog[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function writeLog(actor: string, action: string, details?: string) {
  const logs = readLogs();
  logs.unshift({
    id: crypto.randomUUID(),
    at: Date.now(),
    actor,
    action,
    details,
  });
  localStorage.setItem(KEY, JSON.stringify(logs.slice(0, 500)));
}

export function clearLogs() {
  localStorage.removeItem(KEY);
}
