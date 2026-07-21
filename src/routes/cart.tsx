import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { Layout } from "../components/Layout";
import { useStore } from "../lib/store";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const cart = useStore((s) => s.cart);
  const products = useStore((s) => s.products);
  const updateQty = useStore((s) => s.updateQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const placeOrder = useStore((s) => s.placeOrder);

  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [phone, setPhone] = useState("");
  const [placed, setPlaced] = useState(false);

  const total = cart.reduce((a, b) => a + b.price * b.qty, 0);
  const canSubmit =
    name.trim().length > 1 &&
    telegram.trim().startsWith("@") &&
    telegram.trim().length > 2 &&
    phone.trim().length >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    placeOrder({ name: name.trim(), telegram: telegram.trim(), phone: phone.trim() });
    setPlaced(true);
    setName("");
    setTelegram("");
    setPhone("");
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight">Корзина</h1>

        {placed && (
          <div className="mt-6 flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 font-mono text-sm text-green-400">
            <Check size={16} /> Заказ оформлен! Мы напишем вам в Telegram.
          </div>
        )}

        {cart.length === 0 && !placed && (
          <div className="mt-16 flex flex-col items-center gap-4 text-muted-foreground">
            <ShoppingCart size={48} />
            <div className="font-mono">Корзина пуста</div>
            <Link
              to="/"
              className="rounded-md border border-border px-5 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
            >
              В каталог
            </Link>
          </div>
        )}

        {cart.length > 0 && (
          <>
            <div className="mt-6 space-y-3">
              {cart.map((item) => {
                const p = products.find((x) => x.id === item.productId);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-900">
                      {p?.images[0] && (
                        <img
                          src={p.images[0]}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">{item.name}</div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {[item.color, item.size, item.variant].filter(Boolean).join(" · ")}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="rounded-md border border-border p-1 hover:bg-muted"
                          aria-label="Меньше"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-mono">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="rounded-md border border-border p-1 hover:bg-muted"
                          aria-label="Больше"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">
                        {(item.price * item.qty).toLocaleString("ru-RU")} ₽
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="mt-2 text-muted-foreground hover:text-red-400"
                        aria-label="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-baseline justify-between border-t border-border pt-6">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Итого
              </span>
              <span className="font-mono text-3xl font-bold">
                {total.toLocaleString("ru-RU")} ₽
              </span>
            </div>
          </>
        )}

        {(cart.length > 0 || placed) && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-lg border border-border bg-card p-6"
          >
            <h2 className="text-xl font-bold">Данные для заказа</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  ФИО
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  maxLength={100}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm placeholder:text-muted-foreground focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Ник в Telegram
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTelegram(v.startsWith("@") || v === "" ? v : "@" + v);
                  }}
                  placeholder="@username"
                  maxLength={40}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm placeholder:text-muted-foreground focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 900 000-00-00"
                  maxLength={20}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm placeholder:text-muted-foreground focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!canSubmit || cart.length === 0}
                className="w-full rounded-md bg-white py-4 font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
              >
                Подтвердить заказ
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
