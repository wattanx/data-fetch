import { useEffect, useState } from "react";
import {
  DashboardPage,
  ErrorPanel,
  PanelSkeleton,
  ResolvedDataPanel,
  useDashboardControls,
} from "../components/fetch-dashboard";
import { fetchAccountDashboard, makePayload, type DashboardPayload } from "../lib/fetch-lab";

export function meta() {
  return [{ title: "useEffect baseline | Fetch Strategy Studio" }];
}

export default function UseEffectRoute() {
  const controls = useDashboardControls();
  const { settings } = controls;
  const [data, setData] = useState<DashboardPayload | null>(() =>
    makePayload("use-effect", settings),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAccountDashboard("use-effect", settings)
      .then((payload) => {
        setData(payload);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Unknown error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [settings.latency, settings.error, settings.race, settings.seed, settings.strict]);

  let panel = (
    <ResolvedDataPanel
      data={data ?? makePayload("use-effect", settings)}
      badge={
        loading ? "Local state fetching again" : error ? "Late error catch" : "No cache policy"
      }
      warning={error ?? undefined}
    />
  );

  if (loading && !data) {
    panel = <PanelSkeleton title="Component-local loading state" />;
  }

  if (error && !data) {
    panel = <ErrorPanel message={error} refetch={controls.refetch} />;
  }

  return (
    <DashboardPage activeStrategy="use-effect" controls={controls} generatedAt={data?.generatedAt}>
      {panel}
    </DashboardPage>
  );
}
