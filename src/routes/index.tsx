import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { Logo } from "../components/Logo";
import { useStore, type Product } from "../lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OKDX.Merch — Каталог мерча" },
      {
        name: "description",
        content:
          "Ограниченные дропы OKDX. Футболки, худи, кружки, значки, магниты и стикеры.",
      },
      { property: "og:title", content: "OKDX.Merch — Каталог мерча" },
      { property: "og:description", content: "Ограниченные дропы. Только свой мерч." },
    ],
  }),
  component: CatalogPage,
});

const heroSlides = [
  {
    title: "OKDX.Merch",
    subtitle: "Ограниченные дропы. Только свой мерч.",
    tag: "Добро пожаловать",
  },
  {
    title: "Новый дроп",
    subtitle: "Коллекция VOID уже в продаже.",
    tag: "Новинки",
  },
  {
    title: "Стикеры & значки",
    subtitle: "Мелочи, которые говорят громко.",
    tag: "Аксессуары",
  },
];

function Hero() {
  const [i, setI] = useState(0);
  const s = heroSlides[i];
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-4 p-6 sm:p-10">
        <button
          onClick={() => setI((i - 1 + heroSlides.length) % heroSlides.length)}
          className="hidden shrink-0 rounded-md border border-border p-2 text-muted-foreground hover:text-foreground sm:block"
          aria-label="Назад"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 py-4">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {s.tag}
          </div>
          <div className="mt-3 flex items-center gap-4">
            <Logo size={56} />
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{s.title}</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{s.subtitle}</p>
        </div>
        <button
          onClick={() => setI((i + 1) % heroSlides.length)}
          className="hidden shrink-0 rounded-md border border-border p-2 text-muted-foreground hover:text-foreground sm:block"
          aria-label="Вперёд"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="flex justify-center gap-2 pb-4">
        {heroSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-1 w-8 rounded-full transition-colors ${
              idx === i ? "bg-foreground" : "bg-border"
            }`}
            aria-label={`Слайд ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
  const [idx, setIdx] = useState(0);
  const imgs = p.images.length ? p.images : [""];
  return (
    <div className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-neutral-600">
      <div className="relative aspect-square bg-neutral-900">
        {imgs[idx] ? (
          <img
            src={imgs[idx]}
            alt={p.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        {imgs.length > 1 && (
          <>
            <button
              onClick={() => setIdx((idx - 1 + imgs.length) % imgs.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
              aria-label="Назад"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setIdx((idx + 1) % imgs.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
              aria-label="Вперёд"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold">{p.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-sm">{p.price.toLocaleString("ru-RU")} ₽</span>
          <Link
            to="/product/$id"
            params={{ id: p.id }}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Подробнее →
          </Link>
        </div>
      </div>
    </div>
  );
}

function CatalogPage() {
  const products = useStore((s) => s.products);
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["Все", ...Array.from(set)];
  }, [products]);
  const [active, setActive] = useState("Все");

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      if (active !== "Все" && p.category !== active) continue;
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return Array.from(map.entries());
  }, [products, active]);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Hero />

        <div className="mt-8 flex flex-wrap gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-md border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                active === c
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {grouped.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <ShoppingBag size={40} />
            <div className="font-mono text-sm">Товаров пока нет</div>
          </div>
        )}

        {grouped.map(([cat, items]) => (
          <section key={cat} className="mt-10">
            <div className="flex items-baseline gap-3 border-b border-border pb-2">
              <h2 className="text-xl font-bold">{cat}</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {items.length} позиций
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
}
