import { Component, Suspense, type ReactNode } from "react";
import { atom, Provider, useAtomValue } from "jotai";
import { atomFamily } from "jotai/utils";
import {
  DashboardPage,
  ErrorPanel,
  PanelSkeleton,
  ResolvedDataPanel,
  useDashboardControls,
} from "../components/fetch-dashboard";
import { fetchAccountDashboard, type SimulatorSettings } from "../lib/fetch-lab";

export function meta() {
  return [{ title: "Jotai async atom | Fetch Strategy Studio" }];
}

const dashboardAtomFamily = atomFamily((key: string) =>
  atom(async () => fetchAccountDashboard("jotai-use", parseSettingsKey(key))),
);

export default function JotaiUseRoute() {
  const controls = useDashboardControls();

  return (
    <DashboardPage activeStrategy="jotai-use" controls={controls}>
      <Provider>
        <JotaiResourceBoundary resetKey={settingsKey(controls.settings)} refetch={controls.refetch}>
          <Suspense fallback={<PanelSkeleton title="Jotai resource is suspending" />}>
            <JotaiAccountPanel settings={controls.settings} />
          </Suspense>
        </JotaiResourceBoundary>
      </Provider>
    </DashboardPage>
  );
}

function JotaiAccountPanel({ settings }: { settings: SimulatorSettings }) {
  const dashboardAtom = dashboardAtomFamily(settingsKey(settings));
  const data = useAtomValue(dashboardAtom);
  return <ResolvedDataPanel data={data} />;
}

class JotaiResourceBoundary extends Component<
  { children: ReactNode; refetch: () => void; resetKey: string },
  { error: Error | null; resetKey: string }
> {
  state: { error: Error | null; resetKey: string } = {
    error: null,
    resetKey: this.props.resetKey,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(
    props: { resetKey: string },
    state: { error: Error | null; resetKey: string },
  ) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  render() {
    if (this.state.error) {
      return <ErrorPanel message={this.state.error.message} refetch={this.props.refetch} />;
    }
    return this.props.children;
  }
}

function settingsKey(settings: SimulatorSettings) {
  return `${settings.latency}:${settings.error}:${settings.race}:${settings.strict}:${settings.seed}`;
}

function parseSettingsKey(key: string): SimulatorSettings {
  const [latency, error, race, strict, seed] = key.split(":");
  return {
    latency: Number(latency),
    error: error === "true",
    race: race === "true",
    strict: strict === "true",
    seed: Number(seed),
  };
}
