import { useEffect } from "react";
import { Instagram } from "lucide-react";
import { Logo } from "./Logo";
import { fetchSettings, useSettings } from "../lib/settings";

export function Footer() {
  const { content, loaded } = useSettings();
  useEffect(() => {
    if (!loaded) fetchSettings();
  }, [loaded]);

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-start gap-3">
          <Logo size={32} />
          <div>
            <div className="font-bold">OKDX.Merch</div>
            <div className="font-mono text-xs text-muted-foreground">{content.footerTagline}</div>
            <a
              href="https://www.instagram.com/okdh.bsu/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Instagram size={12} />
              По вопросам можно писать нам в директ
            </a>
          </div>
        </div>
        <div className="font-mono text-xs text-muted-foreground sm:text-right">
          <div>{content.footerCopyright}</div>
          <div>Все права защищены</div>
        </div>
      </div>
    </footer>
  );
}
