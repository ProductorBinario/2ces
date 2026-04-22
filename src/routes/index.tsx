import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: LandingFrame,
});

function LandingFrame() {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/landing.html", { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => {
        if (cancelled) return;
        const withBase = text.includes("<base")
          ? text
          : text.replace(/<head(\s*[^>]*)>/i, '<head$1><base href="/" />');
        setHtml(withBase);
      })
      .catch(() => {
        if (!cancelled) setHtml("<!doctype html><html><body style=\"background:#04061A\"></body></html>");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <iframe
      title="2CES Landing"
      srcDoc={html ?? ""}
      className="fixed inset-0 h-dvh w-full border-0 bg-background"
    />
  );
}
