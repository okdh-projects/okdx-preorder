import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Instagram, Lock, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "../components/Layout";
import { Logo } from "../components/Logo";
import { supabase, type ProductRow, formatMoney } from "../lib/supabase";
import { fetchSettings, subscribeSettings, useSettings } from "../lib/settings";
import { catSlug } from "../lib/publicImages";

function Hero() {
  const { content } = useSettings();
  const heroSlides = content.heroSlides;
  const [i, setI] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    timer.current = window.setInterval(() => {
      setI((v) => (v + 1) % heroSlides.length);
    }, 5000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [heroSlides.length]);

  useEffect(() => {
    if (i >= heroSlides.length) setI(0);
  }, [heroSlides.length, i]);

  if (!heroSlides.length) return null;
  const s = heroSlides[i] ?? heroSlides[0];
  const isLight = i % 2 === 0;
  const hasBg = !!s.bgImage;
  const bg = hasBg
    ? "text-white"
    : isLight
      ? "bg-white text-black"
      : "bg-black text-white";
  const muted = hasBg ? "text-white/80" : isLight ? "text-neutral-600" : "text-neutral-400";
  const btnBorder = hasBg
    ? "border-white/40 hover:text-white"
    : isLight
      ? "border-black/20 hover:text-black"
      : "border-white/20 hover:text-white";
  const btnText = hasBg ? "text-white/80" : isLight ? "text-black/60" : "text-white/60";
  const dotActive = hasBg ? "bg-white" : isLight ? "bg-black" : "bg-white";
  const dotIdle = hasBg ? "bg-white/30" : isLight ? "bg-black/20" : "bg-white/20";

  const handleClick = () => {
    const l = s.link?.trim();
    if (!l) return;
    if (l.startsWith("#")) {
      const el = document.getElementById(l.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.open(l, l.startsWith("http") ? "_blank" : "_self");
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border transition-colors duration-500 ${bg} ${
        s.link ? "cursor-pointer" : ""
      }`}
      style={
        hasBg
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${s.bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
      onClick={s.link ? handleClick : undefined}
    >
      <div className="flex items-center gap-4 p-6 sm:p-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setI((i - 1 + heroSlides.length) % heroSlides.length);
          }}
          className={`hidden shrink-0 rounded-md border p-2 sm:block ${btnBorder} ${btnText}`}
          aria-label="Назад"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 py-4 transition-opacity duration-500">
          <div className={`font-mono text-xs uppercase tracking-widest ${muted}`}>{s.tag}</div>
          <div className="mt-3 flex items-center gap-4">
            <Logo size={56} />
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{s.title}</h1>
          </div>
          <p className={`mt-2 text-sm ${muted}`}>{s.subtitle}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setI((i + 1) % heroSlides.length);
          }}
          className={`hidden shrink-0 rounded-md border p-2 sm:block ${btnBorder} ${btnText}`}
          aria-label="Вперёд"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="flex justify-center gap-2 pb-4">
        {heroSlides.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setI(idx);
            }}
            className={`h-1 w-8 rounded-full transition-colors ${idx === i ? dotActive : dotIdle}`}
            aria-label={`Слайд ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}



export function ProductCard({ p, showSale = false }: { p: ProductRow; showSale?: boolean }) {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  const imgs = p.images.length ? p.images : [""];
  const displayPrice = showSale && p.sale_price != null ? p.sale_price : p.price;
  const strike = showSale && p.sale_price != null && p.sale_price < p.price;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={() => nav(`/product/${p.id}`)}
      className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-neutral-600"
    >
      <div className="relative aspect-square bg-neutral-900">
        {imgs[idx] ? (
          <img
            src={imgs[idx]}
            alt={p.name}
            className="h-full w-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : null}
        {imgs.length > 1 && (
          <>
            <button
              onClick={(e) => {
                stop(e);
                setIdx((idx - 1 + imgs.length) % imgs.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
              aria-label="Назад"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => {
                stop(e);
                setIdx((idx + 1) % imgs.length);
              }}
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
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-sm font-bold ${strike ? "text-red-400" : ""}`}>
              {formatMoney(displayPrice)}
            </span>
            {strike && (
              <span className="font-mono text-xs text-muted-foreground line-through">
                {formatMoney(p.price)}
              </span>
            )}
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Подробнее →
          </span>
        </div>
      </div>
    </div>
  );
}

function PreorderClosed() {
  const { content } = useSettings();
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <Logo size={80} />
      <Lock className="mt-6 text-muted-foreground" size={32} />
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{content.preorderTitle}</h1>
      <p className="mt-4 font-mono text-sm text-muted-foreground">{content.preorderSubtitle}</p>
      <a
        href="https://www.instagram.com/okdh.bsu/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-bold text-black transition-opacity hover:opacity-90"
      >
        <Instagram size={18} /> {content.preorderButton}
      </a>
    </div>
  );
}


export default function Catalog() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { preorderClosed, loaded } = useSettings();

  useEffect(() => {
    fetchSettings();
    const unsub = subscribeSettings();
    return unsub;
  }, []);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts(data ?? []);
        setLoading(false);
      });
    const ch = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .then(({ data }) => setProducts(data ?? []));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["Все", ...Array.from(set)];
  }, [products]);
  const [active, setActive] = useState("Все");

  const grouped = useMemo(() => {
    const map = new Map<string, ProductRow[]>();
    for (const p of products) {
      if (active !== "Все" && p.category !== active) continue;
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return Array.from(map.entries());
  }, [products, active]);

  if (loaded && preorderClosed) {
    return (
      <Layout>
        <PreorderClosed />
      </Layout>
    );
  }

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

        {!loading && grouped.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <ShoppingBag size={40} />
            <div className="font-mono text-sm">Товаров пока нет</div>
          </div>
        )}

        {grouped.map(([cat, items]) => (
          <section key={cat} className="mt-10">
            <div className="flex items-baseline gap-3 border-b border-border pb-2">
              <h2 className="text-xl font-bold">{cat}</h2>
              <span className="font-mono text-xs text-muted-foreground">{items.length} позиций</span>
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
