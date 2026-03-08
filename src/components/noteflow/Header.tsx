"use client";

import { useTranslations } from "next-intl";
import { Search, X, Sun, Moon, Monitor, BookOpen } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  theme: "dark" | "light" | "system";
  onThemeChange: (theme: "dark" | "light" | "system") => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

const themeOrder: Array<"light" | "dark" | "system"> = [
  "light",
  "dark",
  "system",
];

const themeIcon = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export default function Header({
  searchQuery,
  onSearchChange,
  theme,
  onThemeChange,
  searchInputRef,
}: HeaderProps) {
  const t = useTranslations('header');
  const tCommon = useTranslations('common');

  const cycleTheme = () => {
    const nextIndex = (themeOrder.indexOf(theme) + 1) % themeOrder.length;
    onThemeChange(themeOrder[nextIndex]);
  };

  const ThemeIcon = themeIcon[theme];

  return (
    <header
      data-testid="header"
      className="flex h-12 w-full items-center border-b border-border bg-background px-4"
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-1.5 text-foreground">
        <BookOpen className="h-5 w-5" />
        <span className="text-sm font-semibold">{tCommon('appName')}</span>
      </div>

      {/* Center: Search */}
      <div className="mx-4 flex flex-1 justify-center">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            data-testid="search-input"
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg bg-muted px-3 py-1.5 pl-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {searchQuery && (
            <button
              data-testid="clear-search-btn"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Language switcher + Theme toggle */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <button
          data-testid="theme-toggle"
          onClick={cycleTheme}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={`Theme: ${theme}`}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
