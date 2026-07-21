import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { Logo } from "./Logo";
import { useCartCount } from "../lib/store";

export function Header() {
  const count = useCartCount();
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <Logo size={36} />
          <span className="font-bold tracking-tight">OKDX.Merch</span>
        </Link>
        <nav className="hidden items-center gap-8 font-mono text-xs uppercase tracking-widest sm:flex">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
            activeOptions={{ exact: true }}
          >
            Каталог
          </Link>
          <Link
            to="/panel"
            className="text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Панель
          </Link>
        </nav>
        <Link
          to="/cart"
          className="relative flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
        >
          <ShoppingCart size={16} />
          {count > 0 ? (
            <>
              <span>{count} шт</span>
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                {count}
              </span>
            </>
          ) : (
            <span>Корзина</span>
          )}
        </Link>
      </div>
      <div className="border-b border-border sm:hidden">
        <nav className="mx-auto flex max-w-6xl gap-6 px-4 py-2 font-mono text-xs uppercase tracking-widest">
          <Link
            to="/"
            className="text-muted-foreground"
            activeProps={{ className: "text-foreground" }}
            activeOptions={{ exact: true }}
          >
            Каталог
          </Link>
          <Link
            to="/panel"
            className="text-muted-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Панель
          </Link>
        </nav>
      </div>
    </header>
  );
}
