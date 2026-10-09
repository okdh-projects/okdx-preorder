import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, PackageCheck } from "lucide-react";
import { supabase, decodeOrder, type OrderRow } from "../lib/supabase";
import { writeLog } from "../lib/logs";

const CHECK_KEY = "okdx-assembly-checks";

function loadChecks(): Record<string, boolean[]> {
  try {
    return JSON.parse(localStorage.getItem(CHECK_KEY) || "{}");
  } catch {
    return {};
  }
}

export function AssemblyTab({ actor }: { actor: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [idx, setIdx] = useState(0);
  const [checks, setChecks] = useState<Record<string, boolean[]>>(loadChecks);

  const reload = () =>
    supabase
      .from("orders")
      .select("*")
      .eq("status", "Оплачен")
      .then(({ data }) => {
        const arr = (data ?? []).map(decodeOrder);
        arr.sort((a, b) => a.client_name.localeCompare(b.client_name, "ru"));
        setOrders(arr);
      });

  useEffect(() => {
    reload();
    const ch = supabase
      .channel("orders-assembly")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(CHECK_KEY, JSON.stringify(checks));
  }, [checks]);

  useEffect(() => {
    if (idx >= orders.length && orders.length) setIdx(orders.length - 1);
  }, [orders.length, idx]);

  const order = orders[idx];

  // One checklist row per physical unit.
  const units = useMemo(() => {
    if (!order) return [];
    return order.items.flatMap((it) =>
      Array.from({ length: it.qty }, (_, n) => ({
        label: it.name,
        opts: [it.size, it.variant].filter(Boolean).join(" · "),
        n: n + 1,
        of: it.qty,
      })),
    );
  }, [order]);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <PackageCheck className="mx-auto text-muted-foreground" size={40} />
        <p className="mt-4 font-mono text-sm text-muted-foreground">
          Нет оплаченных заказов для сборки
        </p>
      </div>
    );
  }

  const state = checks[order.id] ?? [];
  const done = units.filter((_, i) => state[i]).length;
  const allDone = done === units.length && units.length > 0;

  const toggle = (i: number) => {
    const next = [...state];
    next[i] = !next[i];
    setChecks({ ...checks, [order.id]: next });
  };

  const markAssembled = async () => {
    const { error } = await supabase.from("orders").update({ status: "Собран" }).eq("id", order.id);
    if (error) return toast.error(error.message);
    writeLog(actor, "Сборка заказа", order.client_name);
    const { [order.id]: _, ...rest } = checks;
    void _;
    setChecks(rest);
    toast.success("Заказ собран");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
        <button
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className="rounded-md border border-border p-2 disabled:opacity-30"
          aria-label="Предыдущий"
        >
          <ChevronLeft size={18} />
        </button>
        <span>
          Заказ {idx + 1} из {orders.length}
        </span>
        <button
          onClick={() => setIdx(Math.min(orders.length - 1, idx + 1))}
          disabled={idx >= orders.length - 1}
          className="rounded-md border border-border p-2 disabled:opacity-30"
          aria-label="Следующий"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-6 sm:p-8">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Заказчик</div>
        <div className="mt-1 text-4xl font-bold leading-tight sm:text-5xl">{order.client_name}</div>
        <div className="mt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">Упаковка</div>
        <div className="mt-1 text-3xl font-bold sm:text-4xl">{order.packaging ?? "не выбрана"}</div>

        <div className="mt-8 flex items-baseline justify-between">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Чек-лист</div>
          <div className="font-mono text-sm">
            {done}/{units.length}
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          {units.map((u, i) => (
            <li key={i}>
              <button
                onClick={() => toggle(i)}
                className={`flex w-full items-center gap-4 rounded-md border p-4 text-left text-lg transition-colors ${
                  state[i] ? "border-foreground bg-muted line-through opacity-60" : "border-border hover:bg-muted"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border ${
                    state[i] ? "border-foreground bg-foreground text-background" : "border-border"
                  }`}
                >
                  {state[i] && <Check size={18} />}
                </span>
                <span className="flex-1">
                  <span className="font-bold">{u.label}</span>
                  {u.opts && <span className="ml-2 font-mono text-base">{u.opts}</span>}
                </span>
                {u.of > 1 && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {u.n}/{u.of}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={markAssembled}
          disabled={!allDone}
          className="mt-8 w-full rounded-md bg-foreground py-4 font-bold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Отметить как «Собран»
        </button>
      </div>
    </div>
  );
}
