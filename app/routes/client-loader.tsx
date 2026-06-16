import { useLoaderData, useRouteError } from "react-router";
import {
  DashboardPage,
  ErrorPanel,
  ResolvedDataPanel,
  useDashboardControls,
} from "../components/fetch-dashboard";
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
  const controls = useDashboardControls();
  const message = error instanceof Error ? error.message : "The route loader failed.";

  return (
    <DashboardPage activeStrategy="client-loader" controls={controls}>
      <ErrorPanel message={message} refetch={controls.refetch} title="Route Error Boundary" />
    </DashboardPage>
  );
}

export default function ClientLoaderRoute() {
  const controls = useDashboardControls();
  const data = useLoaderData<typeof clientLoader>();

  return (
    <DashboardPage
      activeStrategy="client-loader"
      controls={controls}
      generatedAt={data.generatedAt}
    >
      <ResolvedDataPanel data={data} />
    </DashboardPage>
  );
}
