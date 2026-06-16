import { isRouteErrorResponse, Links, Meta, Outlet, Scripts } from "react-router";

import type { Route } from "./+types/root";
import { PanelSkeleton } from "./components/fetch-dashboard";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function HydrateFallback() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#1d1d1f]">
      <header className="sticky top-0 z-20 border-b border-[#deded9] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1480px] items-center justify-between gap-4 px-4">
          <div className="h-5 w-[220px] animate-pulse rounded-md bg-[#e7e7e2]" />
          <div className="h-8 w-[88px] animate-pulse rounded-md bg-[#ececea]" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-4 py-4">
        <section>
          <div className="h-[17px] w-[180px] animate-pulse rounded-md bg-[#e2e2dc]" />
          <div className="mt-2 h-[13px] w-[360px] max-w-full animate-pulse rounded-md bg-[#ededeb]" />
        </section>

        <section className="rounded-lg border border-[#dfdfda] bg-white">
          <div className="flex min-h-[49px] items-center justify-between gap-3 border-b border-[#e7e7e2] px-4 py-3">
            <div className="h-[15px] w-[260px] animate-pulse rounded-md bg-[#e2e2dc]" />
            <div className="h-[12px] w-[120px] animate-pulse rounded-md bg-[#ededeb]" />
          </div>

          <div className="grid gap-0 xl:grid-cols-[0.92fr_1.08fr]">
            <PanelSkeleton title="Account Overview" />
            <div className="min-w-0 p-4">
              <div className="h-[335px] animate-pulse rounded-lg border border-[#d8d8d2] bg-[#1f242b]/90" />
              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
                <div className="h-[164px] animate-pulse rounded-lg border border-[#e2e2dc] bg-[#fbfbf9]" />
                <div className="h-[164px] animate-pulse rounded-lg border border-[#ead8b9] bg-[#fffaf2]" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 pb-4">
          <div>
            <div className="h-[15px] w-[148px] animate-pulse rounded-md bg-[#e2e2dc]" />
            <div className="mt-2 h-[12px] w-[320px] max-w-full animate-pulse rounded-md bg-[#ededeb]" />
          </div>
          <div className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="h-[218px] animate-pulse rounded-lg border border-[#dfdfda] bg-white"
                key={index}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
