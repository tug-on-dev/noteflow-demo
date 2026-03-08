"use client";

import { useEffect } from "react";

const SUPPORTED_LOCALES = ["en", "fr", "it"];
const DEFAULT_LOCALE = "en";

function getPreferredLocale(): string {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const languages = [...(navigator.languages ?? [navigator.language])];
  for (const lang of languages) {
    const primary = lang.split("-")[0].toLowerCase();
    if (SUPPORTED_LOCALES.includes(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

export default function RootPage() {
  useEffect(() => {
    const locale = getPreferredLocale();
    const base = window.location.pathname.replace(/\/$/, "");
    window.location.replace(`${base}/${locale}`);
  }, []);

  return null;
}
