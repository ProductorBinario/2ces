import { createFileRoute } from "@tanstack/react-router";
import landingHtml from "../assets/landing.html?raw";

const raw = landingHtml as string;

const landingDocument: string = raw.includes("<base")
  ? raw
  : raw.replace(/<head(\s*[^>]*)>/i, '<head$1><base href="/" />');

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
