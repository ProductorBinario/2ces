import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: LandingFrame,
});

function LandingFrame() {
  const [doc, setDoc] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const url = `/landing.html?_=${Date.now()}`;
    fetch(url, { cache: "no-store", credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        const withBase = text.includes("<base")
          ? text
          : text.replace(/<head(\s*[^>]*)>/i, '<head$1><base href="/" />');
        setDoc(withBase);
      })
      .catch((err) => {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("[landing] fetch failed:", err);
        setDoc(
          '<!doctype html><html><body style="background:#04061A;color:#fff;font-family:sans-serif;padding:24px">No se pudo cargar landing.html</body></html>',
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <iframe
      title="2CES Landing"
      srcDoc={doc}
      className="fixed inset-0 h-dvh w-full border-0 bg-background"
    />
  );
}
