import { Suspense } from "react";
import { Await, useAsyncError, useLoaderData, useRouteError } from "react-router";
import {
  DashboardPage,
  ErrorPanel,
  PanelSkeleton,
  ResolvedDataPanel,
  useDashboardControls,
} from "../components/fetch-dashboard";
import { fetchAccountDashboard, parseSettings } from "../lib/fetch-lab";
import type { Route } from "./+types/client-loader";

export function meta() {
  return [{ title: "clientLoader | Fetch Strategy Studio" }];
}

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const settings = parseSettings(new URL(request.url).searchParams);
  return {
    account: fetchAccountDashboard("client-loader", settings, request.signal),
  };
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
  const { account } = useLoaderData<typeof clientLoader>();

  return (
    <DashboardPage activeStrategy="client-loader" controls={controls}>
      <Suspense fallback={<PanelSkeleton title="clientLoader promise is resolving" />}>
        <Await
          resolve={account}
          errorElement={<ClientLoaderAwaitError refetch={controls.refetch} />}
        >
          {(data) => <ResolvedDataPanel data={data} />}
        </Await>
      </Suspense>
    </DashboardPage>
  );
}

function ClientLoaderAwaitError({ refetch }: { refetch: () => void }) {
  const error = useAsyncError();
  const message = error instanceof Error ? error.message : "The deferred clientLoader failed.";

  return <ErrorPanel message={message} refetch={refetch} title="Await Error Boundary" />;
}
