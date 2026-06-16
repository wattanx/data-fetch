import { Component, Suspense, type ReactNode } from "react";
import { atom, Provider, useAtomValue } from "jotai";
import { atomFamily } from "jotai/utils";
import {
  AccountOverviewSection,
  AccountOverviewSkeleton,
  AccountsTableSection,
  AccountsTableSkeleton,
  DashboardPage,
  ProgressiveDataPanel,
  ResourceSectionError,
  SummaryMetricSection,
  SummaryMetricsSkeleton,
  useDashboardControls,
} from "../components/fetch-dashboard";
import {
  composeAccount,
  composeAccounts,
  composeSummary,
  fetchAccountResource,
  fetchAccountsResource,
  fetchSummaryResource,
  type SimulatorSettings,
} from "../lib/fetch-lab";

export function meta() {
  return [{ title: "Jotai async atom | Fetch Strategy Studio" }];
}

const accountAtomFamily = atomFamily((key: string) =>
  atom(async () => {
    const settings = parseSettingsKey(key);
    const account = await fetchAccountResource("jotai-use", settings);
    return composeAccount(account, settings);
  }),
);

const accountsAtomFamily = atomFamily((key: string) =>
  atom(async () => {
    const settings = parseSettingsKey(key);
    const accounts = await fetchAccountsResource("jotai-use", settings);
    return composeAccounts(accounts, settings);
  }),
);

const summaryAtomFamily = atomFamily((key: string) =>
  atom(async () => {
    const settings = parseSettingsKey(key);
    const summary = await fetchSummaryResource("jotai-use", settings);
    return composeSummary(summary, settings);
  }),
);

export default function JotaiUseRoute() {
  const controls = useDashboardControls();

  return (
    <DashboardPage activeStrategy="jotai-use" controls={controls}>
      <Provider>
        <ProgressiveDataPanel
          account={
            <JotaiResourceBoundary
              fallback={<ResourceSectionError label="Account" refetch={controls.refetch} />}
              resetKey={settingsKey(controls.settings)}
            >
              <Suspense fallback={<AccountOverviewSkeleton />}>
                <JotaiAccountSection settings={controls.settings} />
              </Suspense>
            </JotaiResourceBoundary>
          }
          accounts={
            <JotaiResourceBoundary
              fallback={<ResourceSectionError label="Accounts" refetch={controls.refetch} />}
              resetKey={settingsKey(controls.settings)}
            >
              <Suspense fallback={<AccountsTableSkeleton />}>
                <JotaiAccountsSection settings={controls.settings} />
              </Suspense>
            </JotaiResourceBoundary>
          }
          badge="Progressive"
          summary={
            <JotaiResourceBoundary
              fallback={<ResourceSectionError label="Summary" refetch={controls.refetch} />}
              resetKey={settingsKey(controls.settings)}
            >
              <Suspense fallback={<SummaryMetricsSkeleton />}>
                <JotaiSummarySection settings={controls.settings} />
              </Suspense>
            </JotaiResourceBoundary>
          }
        />
      </Provider>
    </DashboardPage>
  );
}

function JotaiAccountSection({ settings }: { settings: SimulatorSettings }) {
  const accountAtom = accountAtomFamily(settingsKey(settings));
  const account = useAtomValue(accountAtom);
  return <AccountOverviewSection account={account} />;
}

function JotaiAccountsSection({ settings }: { settings: SimulatorSettings }) {
  const accountsAtom = accountsAtomFamily(settingsKey(settings));
  const accounts = useAtomValue(accountsAtom);
  return <AccountsTableSection accounts={accounts} />;
}

function JotaiSummarySection({ settings }: { settings: SimulatorSettings }) {
  const summaryAtom = summaryAtomFamily(settingsKey(settings));
  const summary = useAtomValue(summaryAtom);
  return <SummaryMetricSection summary={summary} />;
}

class JotaiResourceBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; resetKey: string },
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
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function settingsKey(settings: SimulatorSettings) {
  return [
    settings.resourceLatencies.account,
    settings.resourceLatencies.accounts,
    settings.resourceLatencies.summary,
    settings.resourceErrors.account,
    settings.resourceErrors.accounts,
    settings.resourceErrors.summary,
    settings.race,
    settings.strict,
    settings.seed,
  ].join(":");
}

function parseSettingsKey(key: string): SimulatorSettings {
  const [
    accountLatency,
    accountsLatency,
    summaryLatency,
    accountError,
    accountsError,
    summaryError,
    race,
    strict,
    seed,
  ] = key.split(":");
  const resourceLatencies = {
    account: Number(accountLatency),
    accounts: Number(accountsLatency),
    summary: Number(summaryLatency),
  };
  const resourceErrors = {
    account: accountError === "true",
    accounts: accountsError === "true",
    summary: summaryError === "true",
  };

  return {
    latency: Math.max(
      resourceLatencies.account,
      resourceLatencies.accounts,
      resourceLatencies.summary,
    ),
    resourceLatencies,
    resourceErrors,
    error: resourceErrors.account || resourceErrors.accounts || resourceErrors.summary,
    race: race === "true",
    strict: strict === "true",
    seed: Number(seed),
  };
}
