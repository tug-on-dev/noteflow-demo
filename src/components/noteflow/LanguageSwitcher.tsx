"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-0.5">
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => router.replace(pathname, { locale: l })}
          className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
            l === locale
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
          aria-label={`Switch to ${l.toUpperCase()}`}
          aria-pressed={l === locale}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
