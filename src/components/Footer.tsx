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
          </div>
        </div>
        <div className="flex flex-col gap-2 font-mono text-xs text-muted-foreground sm:items-end">
          <a
            href="https://www.instagram.com/okdh.bsu/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-foreground hover:opacity-80"
          >
            <Instagram size={14} /> По вопросам можно писать нам в директ
          </a>
          <div>{content.footerCopyright}</div>
          <div>Форма для сбора ответов</div>
        </div>
      </div>
    </footer>
  );
}
