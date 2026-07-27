import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Download,
  Eye,
  LogOut,
  Package,
  Pencil,
  Plus,
  Settings as SettingsIcon,
  ShoppingBag,
  Ticket,
  Trash2,
  Upload,
  X,
  ScrollText,
  Search,
  Save,
  DatabaseBackup,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Logo } from "../components/Logo";
import { ProductCard } from "./Catalog";
import {
  ORDER_STATUSES,
  PACKAGING_TYPES,
  statusColors,
  supabase,
  formatMoney,
  type OrderRow,
  type ProductRow,
  type PromoCodeRow,
  type PromoDiscountType,
  type PackagingType,
  type CartItemPersisted,
} from "../lib/supabase";
import {
  fetchSettings,
  savePreorderClosed,
  saveContent,
  useSettings,
  DEFAULT_CONTENT,
  type SiteContent,
  type HeroSlide,
} from "../lib/settings";
import { readLogs, writeLog, type AdminLog } from "../lib/logs";
import { manualBackupDownload } from "../lib/backup";
import {
  fetchRemoteOrderLogs,
  clearRemoteLogs,
  clearRemoteOrderLogs,
  type RemoteOrderLog,
} from "../lib/npoint";
import { PUBLIC_IMAGES, publicImageUrl, catSlug } from "../lib/publicImages";


type Tab = "orders" | "products" | "analytics" | "promo" | "settings" | "logs" | "orderlogs";

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // no-op (auto-backup removed with Telegram integration)
  }, [session]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Проверка сессии…
      </div>
    );
  }
  if (!session) return <LoginScreen />;
  return <AdminApp email={session.user.email ?? "admin"} />;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Ошибка входа", { description: error.message });
    toast.success("Вход выполнен");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <Logo size={40} />
          <div>
            <div className="font-bold">OKDX.Admin</div>
            <div className="font-mono text-xs text-muted-foreground">Вход в панель</div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm"
            />
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-white py-3 font-bold text-black hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Вход…" : "Войти"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminApp({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("orders");

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "orders", label: "Заказы", icon: ShoppingBag },
    { id: "products", label: "Товары", icon: Package },
    { id: "analytics", label: "Аналитика", icon: BarChart3 },
    { id: "promo", label: "Промокоды", icon: Ticket },
    { id: "settings", label: "Настройки", icon: SettingsIcon },
    { id: "logs", label: "Логи", icon: ScrollText },
    { id: "orderlogs", label: "Логи заказов", icon: ShoppingBag },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-xs uppercase tracking-widest ${
                    tab === t.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">{email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("Выход выполнен");
              }}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
            >
              <LogOut size={14} /> Выйти
            </button>
          </div>
        </div>
      </div>
      <main className="flex-1">
        {tab === "orders" && <OrdersTab actor={email} />}
        {tab === "products" && <ProductsTab actor={email} />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "promo" && <PromoTab actor={email} />}
        {tab === "settings" && <SettingsTab actor={email} />}
        {tab === "logs" && <LogsTab />}
        {tab === "orderlogs" && <OrderLogsTab />}
      </main>
      <Footer />
    </div>
  );
}

// ============= ORDERS =============
function OrdersTab({ actor }: { actor: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<string>("Все");
  const [assembledSearch, setAssembledSearch] = useState("");
  const [editing, setEditing] = useState<OrderRow | null>(null);

  const reload = () =>
    supabase.from("orders").select("*").then(({ data }) => setOrders((data ?? []) as OrderRow[]));

  useEffect(() => {
    reload();
    const ch = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const sorted = useMemo(() => {
    const arr = [...orders];
    arr.sort((a, b) => a.client_name.localeCompare(b.client_name, "ru"));
    let out = filter === "Все" ? arr : arr.filter((o) => o.status === filter);
    if (filter === "Собран" && assembledSearch.trim()) {
      const q = assembledSearch.trim().toLowerCase();
      out = out.filter((o) => o.client_name.toLowerCase().includes(q));
    }
    return out;
  }, [orders, filter, assembledSearch]);

  const setStatus = async (o: OrderRow, status: string) => {
    if (status === "Оплачен" && !o.packaging) {
      toast.error("Сначала выберите упаковку");
      return;
    }
    const { error } = await supabase.from("orders").update({ status }).eq("id", o.id);
    if (error) return toast.error(error.message);
    writeLog(actor, "Статус заказа", `${o.client_name}: ${o.status} → ${status}`);
    toast.success("Статус обновлён");
  };

  const setPackaging = async (o: OrderRow, packaging: PackagingType) => {
    const { error } = await supabase.from("orders").update({ packaging }).eq("id", o.id);
    if (error) return toast.error(error.message);
    writeLog(actor, "Упаковка заказа", `${o.client_name}: ${packaging}`);
  };

  const remove = async (o: OrderRow) => {
    if (!confirm(`Удалить заказ ${o.client_name}?`)) return;
    const { error } = await supabase.from("orders").delete().eq("id", o.id);
    if (error) return toast.error(error.message);
    writeLog(actor, "Удаление заказа", o.client_name);
    toast.success("Заказ удалён");
  };

  const exportCsv = () => {
    const header = [
      "id",
      "created_at",
      "client_name",
      "client_contact",
      "items",
      "total_price",
      "status",
      "packaging",
      "promo_code",
    ];
    const rows = orders.map((o) =>
      [
        o.id,
        o.created_at,
        o.client_name,
        o.client_contact,
        o.items
          .map(
            (i) =>
              `${i.name}${i.size ? ` [${i.size}]` : ""}${i.variant ? ` (${i.variant})` : ""} × ${i.qty}`,
          )
          .join("; "),
        String(o.total_price),
        o.status,
        o.packaging ?? "",
        o.promo_code ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = "\uFEFF" + [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `okdx-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Заказы ({orders.length})</h1>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
        >
          <Download size={14} /> Выгрузить в CSV
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["Все", ...ORDER_STATUSES] as string[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-widest ${
              filter === s
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filter === "Собран" && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={assembledSearch}
            onChange={(e) => setAssembledSearch(e.target.value)}
            placeholder="Быстрый поиск по ФИО в собранных…"
            className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
          />
          {assembledSearch && (
            <button
              onClick={() => setAssembledSearch("")}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Очистить"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}


      <div className="mt-6 space-y-3">
        {sorted.map((o) => (
          <div key={o.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-bold">{o.client_name}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{o.client_contact}</div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("ru-RU")}
                  {o.promo_code ? ` · промо: ${o.promo_code}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${
                    statusColors[o.status] ?? "border-border text-muted-foreground"
                  }`}
                >
                  {o.status}
                </span>
                <select
                  value={o.status}
                  onChange={(e) => setStatus(o, e.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={o.packaging ?? ""}
                  onChange={(e) => setPackaging(o, e.target.value as PackagingType)}
                  className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                >
                  <option value="">Упаковка…</option>
                  {PACKAGING_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setEditing(o)}
                  className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
                  aria-label="Редактировать"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => remove(o)}
                  className="rounded-md border border-border p-2 text-muted-foreground hover:text-red-400"
                  aria-label="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <ul className="space-y-1 font-mono text-xs">
                {o.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between text-muted-foreground">
                    <span>
                      {i.name}
                      {i.size ? ` · ${i.size}` : ""}
                      {i.variant ? ` · ${i.variant}` : ""} × {i.qty}
                      {o.packaging ? ` · [${o.packaging}]` : ""}
                    </span>
                    <span>{formatMoney(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between font-mono text-sm">
                <span className="text-muted-foreground">Итого</span>
                <span className="font-bold">{formatMoney(o.total_price)}</span>
              </div>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-10 text-center font-mono text-sm text-muted-foreground">
            Заказов пока нет
          </div>
        )}
      </div>

      {editing && (
        <OrderEditModal
          order={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            writeLog(actor, "Редактирование заказа", editing.client_name);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function OrderEditModal({
  order,
  onClose,
  onSaved,
}: {
  order: OrderRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<CartItemPersisted[]>(order.items);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("products").select("*").then(({ data }) => setProducts((data ?? []) as ProductRow[]));
  }, []);

  const total = useMemo(() => items.reduce((a, b) => a + b.price * b.qty, 0), [items]);

  const patch = (idx: number, upd: Partial<CartItemPersisted>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...upd } : it)));

  const remove = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const addProduct = (p: ProductRow) => {
    setItems([
      ...items,
      {
        productId: p.id,
        name: p.name,
        price: p.price,
        qty: 1,
        size: p.sizes[0],
        variant: p.variants?.[0],
        image: p.images[0],
      },
    ]);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("orders")
      .update({ items, total_price: total })
      .eq("id", order.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Заказ обновлён");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Редактирование: {order.client_name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((it, idx) => {
            const p = products.find((x) => x.id === it.productId);
            return (
              <div key={idx} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold">{it.name}</div>
                  <button onClick={() => remove(idx)} className="text-muted-foreground hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-muted-foreground">Размер</label>
                    {p && p.sizes.length ? (
                      <select
                        value={it.size ?? ""}
                        onChange={(e) => patch(idx, { size: e.target.value })}
                        className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                      >
                        <option value="">—</option>
                        {p.sizes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={it.size ?? ""}
                        onChange={(e) => patch(idx, { size: e.target.value })}
                        className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                      />
                    )}
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-muted-foreground">Кол-во</label>
                    <input
                      type="number"
                      min={1}
                      value={it.qty}
                      onChange={(e) => patch(idx, { qty: Math.max(1, Number(e.target.value)) })}
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-muted-foreground">Цена</label>
                    <input
                      type="number"
                      value={it.price}
                      onChange={(e) => patch(idx, { price: Number(e.target.value) })}
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <label className="font-mono text-xs uppercase text-muted-foreground">Добавить товар</label>
          <select
            onChange={(e) => {
              const p = products.find((x) => x.id === e.target.value);
              if (p) addProduct(p);
              e.target.value = "";
            }}
            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 font-mono text-xs"
          >
            <option value="">— выбрать —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatMoney(p.price)})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div className="font-mono">
            Итого: <span className="font-bold">{formatMoney(total)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 font-mono text-xs uppercase"
            >
              Отмена
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 font-mono text-xs font-bold uppercase text-black disabled:opacity-50"
            >
              <Save size={14} /> Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= PRODUCTS =============
type ProductDraft = {
  id?: string;
  category: string;
  name: string;
  price: number;
  sale_price: number | null;
  sizes: string[];
  images: string[];
  description: string;
  variant_label: string | null;
  variants: string[] | null;
};

function ProductsTab({ actor }: { actor: string }) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [editing, setEditing] = useState<ProductDraft | null>(null);
  const [previewing, setPreviewing] = useState<ProductRow | null>(null);

  const reload = () =>
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProducts((data ?? []) as ProductRow[]));

  useEffect(() => {
    reload();
    const ch = supabase
      .channel("products-admin-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products],
  );

  const startNew = () =>
    setEditing({
      category: categories[0] ?? "Футболки",
      name: "",
      price: 0,
      sale_price: null,
      sizes: [],
      images: [],
      description: "",
      variant_label: null,
      variants: null,
    });

  const startEdit = (p: ProductRow) =>
    setEditing({
      id: p.id,
      category: p.category,
      name: p.name,
      price: p.price,
      sale_price: p.sale_price,
      sizes: p.sizes,
      images: p.images,
      description: p.description,
      variant_label: p.variant_label,
      variants: p.variants,
    });

  const save = async (d: ProductDraft) => {
    if (d.id) {
      const { error } = await supabase.from("products").update(d).eq("id", d.id);
      if (error) return toast.error(error.message);
      writeLog(actor, "Изменение товара", d.name);
      toast.success("Товар обновлён");
    } else {
      const { error } = await supabase.from("products").insert(d);
      if (error) return toast.error(error.message);
      writeLog(actor, "Добавление товара", d.name);
      toast.success("Товар добавлен");
    }
    setEditing(null);
  };

  const remove = async (p: ProductRow) => {
    if (!confirm(`Удалить «${p.name}»?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    writeLog(actor, "Удаление товара", p.name);
    toast.success("Удалено");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Товары ({products.length})</h1>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 font-mono text-xs uppercase tracking-widest text-black hover:opacity-90"
        >
          <Plus size={14} /> Добавить товар
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/30 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Товар</th>
              <th className="p-3 text-left">Категория</th>
              <th className="p-3 text-left">Цена</th>
              <th className="p-3 text-left">Размеры</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-b-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-900">
                      {p.images[0] && (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="h-full w-full object-cover"
                          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {p.description.slice(0, 60)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono text-xs">{p.category}</td>
                <td className="p-3 font-mono text-xs">
                  {p.sale_price != null ? (
                    <div className="flex flex-col">
                      <span className="text-red-400">{formatMoney(p.sale_price)}</span>
                      <span className="text-muted-foreground line-through">{formatMoney(p.price)}</span>
                    </div>
                  ) : (
                    <span>{formatMoney(p.price)}</span>
                  )}
                </td>
                <td className="p-3 font-mono text-xs text-muted-foreground">
                  {p.sizes.join(", ") || "—"}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setPreviewing(p)}
                      className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
                      title="Предпросмотр"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
                      title="Редактировать"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => remove(p)}
                      className="rounded-md border border-border p-2 text-muted-foreground hover:text-red-400"
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center font-mono text-sm text-muted-foreground">
                  Товаров пока нет — добавьте первый.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductModal
          draft={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {previewing && <PreviewModal product={previewing} onClose={() => setPreviewing(null)} />}
    </div>
  );
}

function ProductModal({
  draft,
  categories,
  onClose,
  onSave,
}: {
  draft: ProductDraft;
  categories: string[];
  onClose: () => void;
  onSave: (d: ProductDraft) => void;
}) {
  const [d, setD] = useState<ProductDraft>(draft);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCat, setNewCat] = useState("");
  const isValid = d.name.trim() && d.category.trim() && d.price > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{d.id ? "Редактирование товара" : "Новый товар"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Категория</label>
            {!addingCategory ? (
              <div className="mt-1 flex gap-2">
                <select
                  value={d.category}
                  onChange={(e) => setD({ ...d, category: e.target.value })}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
                >
                  {(categories.includes(d.category) ? categories : [d.category, ...categories]).map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ),
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => setAddingCategory(true)}
                  className="rounded-md border border-border px-3 font-mono text-xs uppercase tracking-widest hover:bg-muted"
                >
                  + Добавить свою
                </button>
              </div>
            ) : (
              <div className="mt-1 flex gap-2">
                <input
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="Название категории"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCat.trim()) {
                      setD({ ...d, category: newCat.trim() });
                      setAddingCategory(false);
                      setNewCat("");
                    }
                  }}
                  className="rounded-md bg-white px-3 font-mono text-xs uppercase text-black"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setAddingCategory(false)}
                  className="rounded-md border border-border px-3 font-mono text-xs uppercase"
                >
                  Отмена
                </button>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Название</label>
            <input
              type="text"
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>

          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Цена, BYN
            </label>
            <input
              type="number"
              value={d.price}
              onChange={(e) => setD({ ...d, price: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Акционная цена, BYN (опц.)
            </label>
            <input
              type="number"
              value={d.sale_price ?? ""}
              onChange={(e) => setD({ ...d, sale_price: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Размеры (через запятую)
            </label>
            <input
              type="text"
              value={d.sizes.join(", ")}
              onChange={(e) =>
                setD({
                  ...d,
                  sizes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
              placeholder="XS, S, M, L"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Фото товара
              </label>
              <button
                type="button"
                onClick={() => setD({ ...d, images: [...d.images, ""] })}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-[11px] uppercase tracking-widest hover:bg-muted"
              >
                <Plus size={12} /> Фото
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {d.images.map((img, i) => (
                <ImageInput
                  key={i}
                  value={img}
                  onChange={(v) =>
                    setD({ ...d, images: d.images.map((x, j) => (j === i ? v : x)) })
                  }
                  onRemove={() =>
                    setD({ ...d, images: d.images.filter((_, j) => j !== i) })
                  }
                />
              ))}
              {d.images.length === 0 && (
                <div className="rounded-md border border-dashed border-border p-3 font-mono text-[11px] text-muted-foreground">
                  Нет фото. Добавьте хотя бы одно.
                </div>
              )}
            </div>
          </div>


          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Вариант — название (опц.)
            </label>
            <input
              type="text"
              value={d.variant_label ?? ""}
              onChange={(e) => setD({ ...d, variant_label: e.target.value || null })}
              placeholder="Объём, Диаметр…"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Варианты (через запятую)
            </label>
            <input
              type="text"
              value={(d.variants ?? []).join(", ")}
              onChange={(e) => {
                const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                setD({ ...d, variants: arr.length ? arr : null });
              }}
              placeholder="330 мл, 500 мл"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Описание</label>
            <textarea
              value={d.description}
              onChange={(e) => setD({ ...d, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
          >
            Отмена
          </button>
          <button
            onClick={() => onSave(d)}
            disabled={!isValid}
            className="rounded-md bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ product, onClose }: { product: ProductRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-card p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Предпросмотр карточки
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <ProductCard p={product} />
      </div>
    </div>
  );
}

// ============= ANALYTICS =============
type SortKey = "name" | "qty" | "revenue";

function AnalyticsTab() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("qty");

  useEffect(() => {
    supabase.from("orders").select("*").then(({ data }) => setOrders((data ?? []) as OrderRow[]));
    supabase.from("products").select("*").then(({ data }) => setProducts((data ?? []) as ProductRow[]));
  }, []);

  const byProduct = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; category: string; total: number; sizes: Record<string, number>; revenue: number }
    >();
    for (const o of orders) {
      for (const it of o.items) {
        const p = products.find((x) => x.id === it.productId);
        const cat = p?.category ?? "Прочее";
        const entry = map.get(it.productId) ?? {
          id: it.productId,
          name: it.name,
          category: cat,
          total: 0,
          sizes: {},
          revenue: 0,
        };
        entry.total += it.qty;
        entry.revenue += it.qty * it.price;
        const key = it.size || it.variant || "—";
        entry.sizes[key] = (entry.sizes[key] ?? 0) + it.qty;
        map.set(it.productId, entry);
      }
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category, "ru");
      if (sortKey === "name") return a.name.localeCompare(b.name, "ru");
      if (sortKey === "qty") return b.total - a.total;
      return b.revenue - a.revenue;
    });
    return arr;
  }, [orders, products, sortKey]);

  const finance = useMemo(() => {
    const total = orders.reduce((a, b) => a + Number(b.total_price), 0);
    const count = orders.length;
    const avg = count ? total / count : 0;
    const saleTotal = orders.reduce(
      (a, o) => a + (o.promo_code ? Number(o.total_price) : 0),
      0,
    );
    return { total, count, avg, saleTotal };
  }, [orders]);

  const packagingCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of orders) {
      const key = o.packaging ?? "не выбрано";
      c[key] = (c[key] ?? 0) + 1;
    }
    return c;
  }, [orders]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Аналитика</h1>
        <button
          onClick={async () => {
            await manualBackupDownload();
            toast.success("Бэкап скачан");
          }}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
        >
          <DatabaseBackup size={14} /> Создать резервную копию
        </button>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-bold">Финансовая аналитика</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <Stat label="Общая выручка" value={formatMoney(finance.total)} />
          <Stat label="По акционным заказам" value={formatMoney(finance.saleTotal)} />
          <Stat label="Средний чек" value={formatMoney(Math.round(finance.avg))} />
          <Stat label="Всего заказов" value={String(finance.count)} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Упаковка для сборки</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Тип упаковки</th>
                <th className="p-3 text-left">Кол-во заказов</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(packagingCounts).map(([k, n]) => (
                <tr key={k} className="border-b border-border last:border-b-0">
                  <td className="p-3 font-mono text-xs">{k}</td>
                  <td className="p-3 font-mono text-xs font-bold">{n}</td>
                </tr>
              ))}
              {Object.keys(packagingCounts).length === 0 && (
                <tr>
                  <td colSpan={2} className="p-6 text-center font-mono text-sm text-muted-foreground">
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Товарная аналитика (группировка по категориям)</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Категория</th>
                <SortTh label="Товар" active={sortKey === "name"} onClick={() => setSortKey("name")} />
                <SortTh label="Всего шт" active={sortKey === "qty"} onClick={() => setSortKey("qty")} />
                <th className="p-3 text-left">Размеры / варианты</th>
                <SortTh
                  label="Выручка"
                  active={sortKey === "revenue"}
                  onClick={() => setSortKey("revenue")}
                />
              </tr>
            </thead>
            <tbody>
              {byProduct.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-b-0">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{v.category}</td>
                  <td className="p-3 font-bold">{v.name}</td>
                  <td className="p-3 font-mono">{v.total}</td>
                  <td className="p-3 font-mono text-xs">
                    {Object.entries(v.sizes)
                      .map(([k, n]) => `${k}: ${n}`)
                      .join(" · ")}
                  </td>
                  <td className="p-3 font-mono text-xs">{formatMoney(v.revenue)}</td>
                </tr>
              ))}
              {byProduct.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center font-mono text-sm text-muted-foreground">
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SortTh({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <th className="p-3 text-left">
      <button
        onClick={onClick}
        className={`font-mono text-[10px] uppercase tracking-widest ${
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label} {active ? "▾" : ""}
      </button>
    </th>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-xl font-bold">{value}</div>
    </div>
  );
}

// ============= PROMO =============
function PromoTab({ actor }: { actor: string }) {
  const [codes, setCodes] = useState<PromoCodeRow[]>([]);
  const [newCode, setNewCode] = useState("");

  const reload = () =>
    supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCodes((data ?? []) as PromoCodeRow[]));

  useEffect(() => {
    reload();
  }, []);

  const add = async () => {
    if (!newCode.trim()) return;
    const code = newCode.trim().toUpperCase();
    const { error } = await supabase.from("promo_codes").insert({ code, is_active: true });
    if (error) return toast.error(error.message);
    writeLog(actor, "Создание промокода", code);
    setNewCode("");
    reload();
    toast.success("Промокод создан");
  };

  const toggle = async (p: PromoCodeRow) => {
    await supabase.from("promo_codes").update({ is_active: !p.is_active }).eq("id", p.id);
    writeLog(actor, "Промокод: активность", `${p.code} → ${!p.is_active}`);
    reload();
  };

  const remove = async (p: PromoCodeRow) => {
    if (!confirm(`Удалить ${p.code}?`)) return;
    await supabase.from("promo_codes").delete().eq("id", p.id);
    writeLog(actor, "Удаление промокода", p.code);
    reload();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Промокоды</h1>
      <div className="mt-6 flex gap-2">
        <input
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="OKDX10"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm uppercase"
        />
        <button
          onClick={add}
          className="rounded-md bg-white px-4 font-mono text-xs uppercase tracking-widest text-black"
        >
          <Plus size={14} className="inline" /> Добавить
        </button>
      </div>
      <div className="mt-6 space-y-2">
        {codes.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
          >
            <div>
              <div className="font-mono font-bold">{c.code}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {c.is_active ? "Активен" : "Отключён"}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggle(c)}
                className="rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
              >
                {c.is_active ? "Отключить" : "Включить"}
              </button>
              <button
                onClick={() => remove(c)}
                className="rounded-md border border-border p-2 text-muted-foreground hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {codes.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-10 text-center font-mono text-sm text-muted-foreground">
            Промокодов пока нет
          </div>
        )}
      </div>
    </div>
  );
}

// ============= SETTINGS =============
function SettingsTab({ actor }: { actor: string }) {
  const { preorderClosed, content } = useSettings();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<SiteContent>(content);
  const [savingContent, setSavingContent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);
  useEffect(() => {
    setDraft(content);
  }, [content]);

  const toggle = async () => {
    setSaving(true);
    try {
      await savePreorderClosed(!preorderClosed);
      writeLog(actor, "Настройка: предзаказ", !preorderClosed ? "закрыт" : "открыт");
      toast.success("Сохранено");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSaving(false);
  };

  const saveDraft = async () => {
    setSavingContent(true);
    try {
      await saveContent(draft);
      writeLog(actor, "Настройка: контент сайта", "обновлён");
      toast.success("Контент сохранён");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSavingContent(false);
  };

  const resetDraft = () => {
    if (!confirm("Вернуть текст по умолчанию?")) return;
    setDraft(DEFAULT_CONTENT);
  };

  const patchSlide = (idx: number, upd: Partial<HeroSlide>) =>
    setDraft({
      ...draft,
      heroSlides: draft.heroSlides.map((s, i) => (i === idx ? { ...s, ...upd } : s)),
    });
  const addSlide = () =>
    setDraft({ ...draft, heroSlides: [...draft.heroSlides, { tag: "", title: "", subtitle: "" }] });
  const removeSlide = (idx: number) =>
    setDraft({ ...draft, heroSlides: draft.heroSlides.filter((_, i) => i !== idx) });

  const clearLogs = async () => {
    if (!confirm("Очистить все логи действий администраторов?")) return;
    setBusy("logs");
    try {
      await clearRemoteLogs();
      writeLog(actor, "Очистка логов", "admin logs");
      toast.success("Логи действий очищены");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(null);
  };

  const clearOrderLogs = async () => {
    if (!confirm("Очистить логи всех заказов (внешний журнал)?")) return;
    setBusy("orderlogs");
    try {
      await clearRemoteOrderLogs();
      writeLog(actor, "Очистка логов заказов", "order logs");
      toast.success("Логи заказов очищены");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(null);
  };

  const clearOrdersDb = async () => {
    if (
      !confirm(
        "Удалить ВСЕ заказы из базы данных? Действие необратимо.\nЛоги заказов при этом не очищаются.",
      )
    )
      return;
    setBusy("orders");
    const { error } = await supabase
      .from("orders")
      .delete()
      .not("id", "is", null);
    if (error) toast.error(error.message);
    else {
      writeLog(actor, "Очистка БД", "orders");
      toast.success("Все заказы удалены");
    }
    setBusy(null);
  };

  const clearPromoDb = async () => {
    if (!confirm("Удалить ВСЕ промокоды?")) return;
    setBusy("promo");
    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .not("id", "is", null);
    if (error) toast.error(error.message);
    else {
      writeLog(actor, "Очистка БД", "promo_codes");
      toast.success("Промокоды удалены");
    }
    setBusy(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>

      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={preorderClosed}
            onChange={toggle}
            disabled={saving}
            className="mt-1 h-5 w-5 accent-white"
          />
          <div>
            <div className="font-bold">Закрыть предзаказ</div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Витрина и корзина полностью скрываются от посетителей — вместо них экран-заглушка с ссылкой на Instagram.
            </p>
          </div>
        </label>
      </div>

      {/* Content editor */}
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-bold">Контент сайта</div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Слайдер главной, экран закрытого предзаказа, футер, чекбоксы корзины.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetDraft}
              className="rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
            >
              По умолчанию
            </button>
            <button
              onClick={saveDraft}
              disabled={savingContent}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 font-mono text-xs font-bold uppercase text-black disabled:opacity-50"
            >
              <Save size={14} /> Сохранить
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Слайдер на главной ({draft.heroSlides.length})
            </div>
            <button
              onClick={addSlide}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-[11px] uppercase tracking-widest hover:bg-muted"
            >
              <Plus size={12} /> Слайд
            </button>
          </div>
          <div className="space-y-3">
            {draft.heroSlides.map((s, idx) => (
              <div key={idx} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    Слайд #{idx + 1} · фон {idx % 2 === 0 ? "белый" : "чёрный"}
                  </div>
                  <button
                    onClick={() => removeSlide(idx)}
                    className="text-muted-foreground hover:text-red-400"
                    aria-label="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <input
                    value={s.tag}
                    onChange={(e) => patchSlide(idx, { tag: e.target.value })}
                    placeholder="Тег"
                    className="rounded-md border border-border bg-background px-2 py-2 font-mono text-xs"
                  />
                  <input
                    value={s.title}
                    onChange={(e) => patchSlide(idx, { title: e.target.value })}
                    placeholder="Заголовок"
                    className="rounded-md border border-border bg-background px-2 py-2 font-mono text-xs sm:col-span-2"
                  />
                </div>
                <input
                  value={s.subtitle}
                  onChange={(e) => patchSlide(idx, { subtitle: e.target.value })}
                  placeholder="Подпись"
                  className="mt-2 w-full rounded-md border border-border bg-background px-2 py-2 font-mono text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <TextField
            label="Заголовок «предзаказ закрыт»"
            value={draft.preorderTitle}
            onChange={(v) => setDraft({ ...draft, preorderTitle: v })}
          />
          <TextField
            label="Подпись «предзаказ закрыт»"
            value={draft.preorderSubtitle}
            onChange={(v) => setDraft({ ...draft, preorderSubtitle: v })}
          />
          <TextField
            label="Кнопка Instagram"
            value={draft.preorderButton}
            onChange={(v) => setDraft({ ...draft, preorderButton: v })}
          />
          <TextField
            label="Футер: слоган"
            value={draft.footerTagline}
            onChange={(v) => setDraft({ ...draft, footerTagline: v })}
          />
          <TextField
            label="Футер: копирайт"
            value={draft.footerCopyright}
            onChange={(v) => setDraft({ ...draft, footerCopyright: v })}
          />
          <TextField
            label="Корзина: чекбокс #1"
            value={draft.cartConfirm1}
            onChange={(v) => setDraft({ ...draft, cartConfirm1: v })}
          />
          <TextField
            label="Корзина: чекбокс #2"
            value={draft.cartConfirm2}
            onChange={(v) => setDraft({ ...draft, cartConfirm2: v })}
          />
        </div>
      </div>

      {/* Backup */}
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <div className="font-bold">Резервная копия</div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Скачать JSON со всеми товарами, заказами и промокодами.
        </p>
        <button
          onClick={async () => {
            await manualBackupDownload();
            writeLog(actor, "Бэкап", "manual");
            toast.success("Бэкап сохранён");
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
        >
          <DatabaseBackup size={14} /> Скачать бэкап
        </button>
      </div>

      {/* Danger zone */}
      <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/5 p-6">
        <div className="font-bold text-red-400">Опасная зона</div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Операции необратимы. Перед очисткой рекомендуется скачать бэкап.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            onClick={clearLogs}
            disabled={busy === "logs"}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted disabled:opacity-50"
          >
            <Trash2 size={14} /> {busy === "logs" ? "…" : "Очистить логи действий"}
          </button>
          <button
            onClick={clearOrderLogs}
            disabled={busy === "orderlogs"}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted disabled:opacity-50"
          >
            <Trash2 size={14} /> {busy === "orderlogs" ? "…" : "Очистить логи заказов"}
          </button>
          <button
            onClick={clearOrdersDb}
            disabled={busy === "orders"}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-xs uppercase tracking-widest text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            <Trash2 size={14} /> {busy === "orders" ? "…" : "Удалить все заказы (БД)"}
          </button>
          <button
            onClick={clearPromoDb}
            disabled={busy === "promo"}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-xs uppercase tracking-widest text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            <Trash2 size={14} /> {busy === "promo" ? "…" : "Удалить все промокоды (БД)"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 font-mono text-xs"
      />
    </label>
  );
}


// ============= LOGS =============
function LogsTab() {
  const [logs, setLogs] = useState<AdminLog[]>([]);

  const load = () => {
    readLogs().then(setLogs);
  };
  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const exportTxt = () => {
    const text = logs
      .map(
        (l) =>
          `[${new Date(l.ts).toLocaleString("ru-RU")}] ${l.actor} — ${l.action}${
            l.details ? ` :: ${l.details}` : ""
          }`,
      )
      .join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `okdx-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Логи действий</h1>
        <button
          onClick={exportTxt}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
        >
          <Download size={14} /> Экспорт в TXT
        </button>
      </div>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Общая история для всех админов (npoint.io). Без лимитов.
      </p>
      <div className="mt-6 space-y-2">
        {logs.map((l, i) => (
          <div key={`${l.ts}-${i}`} className="rounded-md border border-border bg-card p-3">
            <div className="flex flex-wrap justify-between gap-2 font-mono text-[11px] text-muted-foreground">
              <span>{new Date(l.ts).toLocaleString("ru-RU")}</span>
              <span>{l.actor}</span>
            </div>
            <div className="mt-1 text-sm font-bold">{l.action}</div>
            {l.details && (
              <div className="mt-1 font-mono text-xs text-muted-foreground">{l.details}</div>
            )}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-10 text-center font-mono text-sm text-muted-foreground">
            Логов пока нет
          </div>
        )}
      </div>
    </div>
  );
}

// ============= ORDER LOGS =============
function OrderLogsTab() {
  const [orders, setOrders] = useState<RemoteOrderLog[]>([]);

  const load = () => {
    fetchRemoteOrderLogs().then(setOrders);
  };
  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(orders, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `okdx-order-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Логи заказов</h1>
        <button
          onClick={exportJson}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
        >
          <Download size={14} /> Экспорт JSON
        </button>
      </div>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        История всех оформленных заказов (npoint.io, бин 90ed529dc0763be76ae5).
      </p>
      <div className="mt-6 space-y-3">
        {orders.map((o, i) => (
          <div key={`${o.ts}-${i}`} className="rounded-md border border-border bg-card p-4">
            <div className="flex flex-wrap justify-between gap-2 font-mono text-[11px] text-muted-foreground">
              <span>{new Date(o.ts).toLocaleString("ru-RU")}</span>
              <span>{formatMoney(o.total_price)}</span>
            </div>
            <div className="mt-1 text-sm font-bold">{o.client_name}</div>
            <div className="font-mono text-xs text-muted-foreground">{o.client_contact}</div>
            {o.promo_code && (
              <div className="mt-1 font-mono text-xs text-green-400">Промо: {o.promo_code}</div>
            )}
            <ul className="mt-2 space-y-1 font-mono text-xs">
              {o.items.map((it, j) => (
                <li key={j}>
                  • {it.name}
                  {it.size ? ` [${it.size}]` : ""}
                  {it.variant ? ` (${it.variant})` : ""} × {it.qty} — {formatMoney(it.price * it.qty)}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-10 text-center font-mono text-sm text-muted-foreground">
            Заказов пока нет
          </div>
        )}
      </div>
    </div>
  );
}
