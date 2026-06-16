import useSWR from "swr";
import {
  DashboardPage,
  ErrorPanel,
  PanelSkeleton,
  ResolvedDataPanel,
  useDashboardControls,
} from "../components/fetch-dashboard";
import { fetchAccountDashboard, makePayload } from "../lib/fetch-lab";

export function meta() {
  return [{ title: "SWR | Fetch Strategy Studio" }];
}

export default function SwrRoute() {
  const controls = useDashboardControls();
  const { settings } = controls;
  const key = [
    "account-dashboard",
    settings.latency,
    settings.error,
    settings.race,
    settings.strict,
    settings.seed,
  ] as const;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    () => fetchAccountDashboard("swr", settings),
    {
      keepPreviousData: true,
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    },
  );

  let panel = (
    <ResolvedDataPanel
      data={data ?? makePayload("swr", settings)}
      badge={isValidating ? "Updating cached data" : "Serving cached view"}
    />
  );

  if (isLoading && !data) {
    panel = <PanelSkeleton title="SWR is loading the first response" />;
  }

  if (error && !data) {
    panel = <ErrorPanel message={error.message} refetch={() => void mutate()} />;
  }

  return (
    <DashboardPage activeStrategy="swr" controls={controls} generatedAt={data?.generatedAt}>
      {panel}
    </DashboardPage>
  );
}
