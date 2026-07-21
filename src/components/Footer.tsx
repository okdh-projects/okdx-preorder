import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-start gap-3">
          <Logo size={32} />
          <div>
            <div className="font-bold">OKDX.Merch</div>
            <div className="font-mono text-xs text-muted-foreground">
              Ограниченные дропы. Только свой мерч.
            </div>
          </div>
        </div>
        <div className="font-mono text-xs text-muted-foreground sm:text-right">
          <div>© 2024 OKDX.Merch</div>
          <div>Все права защищены</div>
        </div>
      </div>
    </footer>
  );
}
