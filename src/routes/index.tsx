import { createFileRoute } from "@tanstack/react-router";

// Use import.meta.glob so Vite invalidates the cache when the file changes.
const modules = import.meta.glob("../../public/landing.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const raw = (Object.values(modules)[0] ?? "") as string;

const landingDocument: string = raw.includes("<base")
  ? raw
  : raw.replace(/<head(\s*[^>]*)>/i, '<head$1><base href="/" />');

if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log(
    "[landing] hero:",
    (raw.match(/sec-hero\{padding-top:[^;]+/) ?? ["?"])[0],
    "bytes:",
    raw.length,
  );
}

export const Route = createFileRoute("/")({
  component: LandingFrame,
});

function LandingFrame() {
  return (
    <iframe
      title="2CES Landing"
      srcDoc={landingDocument}
      className="fixed inset-0 h-dvh w-full border-0 bg-background"
    />
  );
}
