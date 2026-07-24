// Shared npoint.io bins (no auth, anonymous write).
// - Admin action logs bin: created with { "logs": [] }.
// - Order logs bin: created with { "orders": [] }.
export const NPOINT_BIN_ID = "9b585d5cb42fd2e2a0b4";
export const NPOINT_ORDERS_BIN_ID = "90ed529dc0763be76ae5";

const LOGS_URL = `https://api.npoint.io/${NPOINT_BIN_ID}`;
const ORDERS_URL = `https://api.npoint.io/${NPOINT_ORDERS_BIN_ID}`;

export type RemoteLog = {
  ts: number;
  actor: string;
  action: string;
  details?: string;
};

export type RemoteOrderLog = {
  ts: number;
  client_name: string;
  client_contact: string;
  total_price: number;
  promo_code?: string | null;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    size?: string | null;
    variant?: string | null;
  }>;
};

export async function fetchRemoteLogs(): Promise<RemoteLog[]> {
  try {
    const r = await fetch(LOGS_URL, { cache: "no-store" });
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
    await fetch(LOGS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: next }),
    });
  } catch {
    /* ignore */
  }
}

export async function fetchRemoteOrderLogs(): Promise<RemoteOrderLog[]> {
  try {
    const r = await fetch(ORDERS_URL, { cache: "no-store" });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j?.orders) ? (j.orders as RemoteOrderLog[]) : [];
  } catch {
    return [];
  }
}

export async function pushRemoteOrderLog(order: RemoteOrderLog): Promise<void> {
  try {
    const current = await fetchRemoteOrderLogs();
    const next = [order, ...current];
    await fetch(ORDERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: next }),
    });
  } catch {
    /* ignore */
  }
}
