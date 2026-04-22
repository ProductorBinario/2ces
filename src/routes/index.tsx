import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  // Redirect en el servidor: 0 JS de cliente, 0 flash, salto inmediato
  beforeLoad: () => {
    throw redirect({ href: "/landing.html" });
  },
  component: () => null,
});
