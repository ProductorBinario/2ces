import { createFileRoute } from "@tanstack/react-router";
import landingHtml from "../../public/landing.html?raw";

// Inject <base href="/"> so relative URLs inside the landing resolve correctly.
const landingDocument: string = (landingHtml as string).includes("<base")
  ? (landingHtml as string)
  : (landingHtml as string).replace(
      /<head(\s*[^>]*)>/i,
      '<head$1><base href="/" />',
    );

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
