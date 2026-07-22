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
  X,
  ScrollText,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Logo } from "../components/Logo";
import { ProductCard } from "./Catalog";
import {
  ORDER_STATUSES,
  statusColors,
  supabase,
  type OrderRow,
  type ProductRow,
  type PromoCodeRow,
} from "../lib/supabase";
import { fetchSettings, savePreorderClosed, useSettings } from "../lib/settings";
import { readLogs, writeLog, clearLogs } from "../lib/logs";

type Tab = "orders" | "products" | "analytics" | "promo" | "settings" | "logs";

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
    if (error) {
      toast.error("Ошибка входа", { description: error.message });
      return;
    }
    toast.success("Вход выполнен");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg border border-border bg-card p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <Logo size={40} />
          <div>
            <div className="font-bold">OKDX.Admin</div>
            <div className="font-mono text-xs text-muted-foreground">Вход в панель</div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-white py-3 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
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
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
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
      </main>
      <Footer />
    </div>
  );
}

// ============= ORDERS =============
function OrdersTab({ actor }: { actor: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<string>("Все");

  const reload = () =>
    supabase
      .from("orders")
      .select("*")
      .then(({ data }) => setOrders(data ?? []));

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
    return filter === "Все" ? arr : arr.filter((o) => o.status === filter);
  }, [orders, filter]);

  const setStatus = async (o: OrderRow, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", o.id);
    if (error) return toast.error(error.message);
    writeLog(actor, "Изменение статуса заказа", `${o.client_name}: ${o.status} → ${status}`);
    toast.success("Статус обновлён");
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
      "delivery_address",
      "items",
      "total_price",
      "status",
    ];
    const rows = orders.map((o) =>
      [
        o.id,
        o.created_at,
        o.client_name,
        o.client_contact,
        o.delivery_address ?? "",
        o.items
          .map((i) => `${i.name}${i.size ? ` [${i.size}]` : ""}${i.variant ? ` (${i.variant})` : ""} × ${i.qty}`)
          .join("; "),
        String(o.total_price),
        o.status,
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
            className={`rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
              filter === s
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {sorted.map((o) => (
          <div key={o.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-bold">{o.client_name}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  {o.client_contact}
                </div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("ru-RU")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${statusColors[o.status] ?? "border-border text-muted-foreground"}`}
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
                    </span>
                    <span>{(i.price * i.qty).toLocaleString("ru-RU")} ₽</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between font-mono text-sm">
                <span className="text-muted-foreground">Итого</span>
                <span className="font-bold">{o.total_price.toLocaleString("ru-RU")} ₽</span>
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
      .then(({ data }) => setProducts(data ?? []));

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
                      <span className="text-red-400">{p.sale_price.toLocaleString("ru-RU")} ₽</span>
                      <span className="text-muted-foreground line-through">
                        {p.price.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                  ) : (
                    <span>{p.price.toLocaleString("ru-RU")} ₽</span>
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
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Категория
            </label>
            {!addingCategory ? (
              <div className="mt-1 flex gap-2">
                <select
                  value={d.category}
                  onChange={(e) => setD({ ...d, category: e.target.value })}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
                >
                  {(categories.includes(d.category) ? categories : [d.category, ...categories]).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
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
                  type="text"
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
                  className="rounded-md bg-white px-3 font-mono text-xs uppercase tracking-widest text-black"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setAddingCategory(false)}
                  className="rounded-md border border-border px-3 font-mono text-xs uppercase tracking-widest"
                >
                  Отмена
                </button>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Название
            </label>
            <input
              type="text"
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>

          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Цена, ₽
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
              Акционная цена, ₽ (опц.)
            </label>
            <input
              type="number"
              value={d.sale_price ?? ""}
              onChange={(e) =>
                setD({ ...d, sale_price: e.target.value ? Number(e.target.value) : null })
              }
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
                  sizes: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="XS, S, M, L"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              URL фото (через запятую или новую строку)
            </label>
            <textarea
              value={d.images.join("\n")}
              onChange={(e) =>
                setD({
                  ...d,
                  images: e.target.value
                    .split(/[\n,]/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
            />
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
                const arr = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                setD({ ...d, variants: arr.length ? arr : null });
              }}
              placeholder="330 мл, 500 мл"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Описание
            </label>
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
function AnalyticsTab() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    supabase.from("orders").select("*").then(({ data }) => setOrders(data ?? []));
    supabase.from("products").select("*").then(({ data }) => setProducts(data ?? []));
  }, []);

  const byProduct = useMemo(() => {
    const map = new Map<
      string,
      { name: string; total: number; sizes: Record<string, number>; revenue: number }
    >();
    for (const o of orders) {
      for (const it of o.items) {
        const entry =
          map.get(it.productId) ??
          { name: it.name, total: 0, sizes: {}, revenue: 0 };
        entry.total += it.qty;
        entry.revenue += it.qty * it.price;
        const key = it.size || it.variant || "—";
        entry.sizes[key] = (entry.sizes[key] ?? 0) + it.qty;
        map.set(it.productId, entry);
      }
    }
    return Array.from(map.entries());
  }, [orders]);

  const finance = useMemo(() => {
    const total = orders.reduce((a, b) => a + Number(b.total_price), 0);
    const count = orders.length;
    const avg = count ? total / count : 0;
    const saleIds = new Set(products.filter((p) => p.sale_price != null).map((p) => p.id));
    const saleTotal = orders.reduce(
      (a, o) => a + (o.items.some((i) => saleIds.has(i.productId)) ? Number(o.total_price) : 0),
      0,
    );
    return { total, count, avg, saleTotal };
  }, [orders, products]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Аналитика</h1>

      <section className="mt-6">
        <h2 className="text-lg font-bold">Финансовая аналитика</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <Stat label="Общая выручка" value={`${finance.total.toLocaleString("ru-RU")} ₽`} />
          <Stat label="По акционным заказам" value={`${finance.saleTotal.toLocaleString("ru-RU")} ₽`} />
          <Stat label="Средний чек" value={`${Math.round(finance.avg).toLocaleString("ru-RU")} ₽`} />
          <Stat label="Всего заказов" value={String(finance.count)} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Товарная аналитика</h2>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Точные объёмы каждого размера для производства.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Товар</th>
                <th className="p-3 text-left">Всего шт</th>
                <th className="p-3 text-left">По размерам / вариантам</th>
                <th className="p-3 text-left">Выручка</th>
              </tr>
            </thead>
            <tbody>
              {byProduct.map(([id, v]) => (
                <tr key={id} className="border-b border-border last:border-b-0">
                  <td className="p-3 font-bold">{v.name}</td>
                  <td className="p-3 font-mono">{v.total}</td>
                  <td className="p-3 font-mono text-xs">
                    {Object.entries(v.sizes)
                      .map(([k, n]) => `${k}: ${n}`)
                      .join(" · ")}
                  </td>
                  <td className="p-3 font-mono text-xs">{v.revenue.toLocaleString("ru-RU")} ₽</td>
                </tr>
              ))}
              {byProduct.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center font-mono text-sm text-muted-foreground">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
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
      .then(({ data }) => setCodes(data ?? []));

  useEffect(() => {
    reload();
  }, []);

  const add = async () => {
    if (!newCode.trim()) return;
    const { error } = await supabase
      .from("promo_codes")
      .insert({ code: newCode.trim().toUpperCase(), is_active: true });
    if (error) return toast.error(error.message);
    writeLog(actor, "Создание промокода", newCode.trim().toUpperCase());
    setNewCode("");
    reload();
    toast.success("Промокод создан");
  };

  const toggle = async (p: PromoCodeRow) => {
    await supabase.from("promo_codes").update({ is_active: !p.is_active }).eq("id", p.id);
    writeLog(actor, "Промокод: смена активности", `${p.code} → ${!p.is_active}`);
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
  const { preorderClosed } = useSettings();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

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
              На главной странице покажется экран «К сожалению, предзаказ мерча закончился» с
              ссылкой на Instagram. Витрина и корзина скрываются от посетителей.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

// ============= LOGS =============
function LogsTab() {
  const [logs, setLogs] = useState(readLogs());
  useEffect(() => {
    const iv = setInterval(() => setLogs(readLogs()), 2000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Логи (LocalStorage)</h1>
        <button
          onClick={() => {
            if (confirm("Очистить все логи?")) {
              clearLogs();
              setLogs([]);
            }
          }}
          className="rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
        >
          Очистить
        </button>
      </div>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Хранятся только в этом браузере (последние 500). Не занимают место в БД.
      </p>
      <div className="mt-6 space-y-2">
        {logs.map((l) => (
          <div key={l.id} className="rounded-md border border-border bg-card p-3">
            <div className="flex flex-wrap justify-between gap-2 font-mono text-[11px] text-muted-foreground">
              <span>{new Date(l.at).toLocaleString("ru-RU")}</span>
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
