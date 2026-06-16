import { useLoaderData, useRouteError } from "react-router";
import { FetchDashboard } from "../components/fetch-dashboard";
import { fetchAccountDashboard, parseSettings } from "../lib/fetch-lab";
import type { Route } from "./+types/client-loader";

export function meta() {
  return [{ title: "clientLoader | Fetch Strategy Studio" }];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const settings = parseSettings(new URL(request.url).searchParams);
  return fetchAccountDashboard("client-loader", settings, request.signal);
}

export function ErrorBoundary() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : "The route loader failed.";

  return <FetchDashboard activeStrategy="client-loader" loaderError={message} />;
}

export default function ClientLoaderRoute() {
  const data = useLoaderData<typeof clientLoader>();
  return <FetchDashboard activeStrategy="client-loader" loaderData={data} />;
}
