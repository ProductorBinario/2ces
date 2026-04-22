import { createFileRoute } from "@tanstack/react-router";
import landingHtml from "../../public/landing.html?raw";

const raw = landingHtml as string;

// Inject <base href="/"> so relative URLs inside the landing resolve correctly.
const landingDocument: string = raw.includes("<base")
  ? raw
  : raw.replace(/<head(\s*[^>]*)>/i, '<head$1><base href="/" />');

// Debug marker so we can verify which build the iframe is using.
const heroPadding = (raw.match(/sec-hero\{padding-top:[^;]+/) ?? ["?"])[0];
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("[landing] hero rule:", heroPadding, "bytes:", raw.length);
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
