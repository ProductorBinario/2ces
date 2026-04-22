import { createFileRoute } from "@tanstack/react-router";
import landingHtml from "../../public/landing.html?raw";

const landingDocument = landingHtml.includes("<base")
  ? landingHtml
  : landingHtml.replace(/<head(\s*[^>]*)>/i, '<head$1><base href="/" />');

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
