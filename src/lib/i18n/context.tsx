"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { messages, type Lang, type Messages } from "./messages";

const STORAGE_KEY = "eh-lang";

type LangContextValue = {
  lang: Lang;
  t: Messages;
  toggleLang: () => void;
};

const LangContext = createContext<LangContextValue>({
  lang: "en",
  t: messages.en,
  toggleLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ta" || stored === "en") {
      setLang(stored);
    }
  }, []);

  function toggleLang() {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "ta" : "en";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <LangContext.Provider value={{ lang, t: messages[lang] as unknown as Messages, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
