import { createFileRoute } from "@tanstack/react-router";
import landingHtml from "../assets/index.html?raw";
import landingStylesUrl from "../assets/styles.css?url";
import landingConfigUrl from "../assets/config.js?url";
import landingPriceServiceUrl from "../assets/priceService.js?url";
import landingAppUrl from "../assets/app.js?url";

const raw = (landingHtml as string)
  .replace('href="./styles.css"', `href="${landingStylesUrl}"`)
  .replace('src="./config.js"', `src="${landingConfigUrl}"`)
  .replace('src="./priceService.js"', `src="${landingPriceServiceUrl}"`)
  .replace('src="./app.js"', `src="${landingAppUrl}"`);

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
