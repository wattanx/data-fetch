import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
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
  type Account,
  type DashboardSummary,
  type ResourceKey,
  type SimulatorSettings,
} from "../lib/fetch-lab";

export function meta() {
  return [{ title: "useEffect baseline | Fetch Strategy Studio" }];
}

export default function UseEffectRoute() {
  const controls = useDashboardControls();
  const { settings } = controls;
  const [account, setAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<Record<ResourceKey, boolean>>({
    account: false,
    accounts: false,
    summary: false,
  });
  const [errors, setErrors] = useState<Partial<Record<ResourceKey, string>>>({});
  const [raceWarning, setRaceWarning] = useState<string | null>(null);

  useEffect(() => {
    setAccount(null);
    setAccounts(null);
    setSummary(null);
    setErrors({});
    setRaceWarning(null);
    setLoading({ account: true, accounts: true, summary: true });

    if (settings.race) {
      runRaceConditionDemo(settings, {
        setAccount,
        setAccounts,
        setErrors,
        setLoading,
        setRaceWarning,
        setSummary,
      });
      return;
    }

    runResourceRequests(settings, {
      setAccount,
      setAccounts,
      setErrors,
      setLoading,
      setSummary,
    });
  }, [
    settings.resourceLatencies.account,
    settings.resourceLatencies.accounts,
    settings.resourceLatencies.summary,
    settings.resourceErrors.account,
    settings.resourceErrors.accounts,
    settings.resourceErrors.summary,
    settings.race,
    settings.seed,
    settings.strict,
  ]);

  const isLoading = loading.account || loading.accounts || loading.summary;
  const hasError = Boolean(errors.account ?? errors.accounts ?? errors.summary);

  return (
    <DashboardPage activeStrategy="use-effect" controls={controls}>
      <ProgressiveDataPanel
        account={
          account ? (
            <AccountOverviewSection account={account} />
          ) : errors.account ? (
            <ResourceSectionError label="Account" refetch={controls.refetch} />
          ) : (
            <AccountOverviewSkeleton />
          )
        }
        accounts={
          accounts ? (
            <AccountsTableSection accounts={accounts} />
          ) : errors.accounts ? (
            <ResourceSectionError label="Accounts" refetch={controls.refetch} />
          ) : (
            <AccountsTableSkeleton />
          )
        }
        badge={
          raceWarning
            ? "Stale response won"
            : isLoading
              ? "Local state fetching"
              : hasError
                ? "Late error catch"
                : "No cache policy"
        }
        summary={
          summary ? (
            <SummaryMetricSection summary={summary} />
          ) : errors.summary ? (
            <ResourceSectionError label="Summary" refetch={controls.refetch} />
          ) : (
            <SummaryMetricsSkeleton />
          )
        }
        warning={raceWarning ?? undefined}
      />
    </DashboardPage>
  );
}

type ResourceRequestState = {
  setAccount: (account: Account | null) => void;
  setAccounts: (accounts: Account[] | null) => void;
  setErrors: Dispatch<SetStateAction<Partial<Record<ResourceKey, string>>>>;
  setLoading: Dispatch<SetStateAction<Record<ResourceKey, boolean>>>;
  setSummary: (summary: DashboardSummary | null) => void;
};

type RaceRequestState = ResourceRequestState & {
  setRaceWarning: (warning: string | null) => void;
};

function runResourceRequests(settings: SimulatorSettings, state: ResourceRequestState) {
  fetchAccountResource("use-effect", settings)
    .then((nextAccount) => {
      state.setAccount(composeAccount(nextAccount, settings));
    })
    .catch((reason: unknown) => {
      state.setErrors((current) => ({
        ...current,
        account: reason instanceof Error ? reason.message : "Unknown account error",
      }));
    })
    .finally(() => {
      state.setLoading((current) => ({ ...current, account: false }));
    });

  fetchAccountsResource("use-effect", settings)
    .then((nextAccounts) => {
      state.setAccounts(composeAccounts(nextAccounts, settings));
    })
    .catch((reason: unknown) => {
      state.setErrors((current) => ({
        ...current,
        accounts: reason instanceof Error ? reason.message : "Unknown accounts error",
      }));
    })
    .finally(() => {
      state.setLoading((current) => ({ ...current, accounts: false }));
    });

  fetchSummaryResource("use-effect", settings)
    .then((nextSummary) => {
      state.setSummary(composeSummary(nextSummary, settings));
    })
    .catch((reason: unknown) => {
      state.setErrors((current) => ({
        ...current,
        summary: reason instanceof Error ? reason.message : "Unknown summary error",
      }));
    })
    .finally(() => {
      state.setLoading((current) => ({ ...current, summary: false }));
    });
}

function runRaceConditionDemo(settings: SimulatorSettings, state: RaceRequestState) {
  const freshSettings = withResourceLatency(settings, 120);
  const staleSettings = withResourceLatency(
    {
      ...settings,
      seed: Math.max(0, settings.seed - 1),
    },
    900,
  );

  runResourceRequests(freshSettings, state);

  fetchAccountResource("use-effect", staleSettings)
    .then((nextAccount) => {
      state.setAccount(composeAccount(nextAccount, staleSettings));
      state.setRaceWarning("古い Account response が遅れて返り、新しい表示を上書きしました。");
    })
    .catch(() => undefined);

  fetchAccountsResource("use-effect", staleSettings)
    .then((nextAccounts) => {
      state.setAccounts(composeAccounts(nextAccounts, staleSettings));
      state.setRaceWarning("古い Accounts response が遅れて返り、新しい表示を上書きしました。");
    })
    .catch(() => undefined);

  fetchSummaryResource("use-effect", staleSettings)
    .then((nextSummary) => {
      state.setSummary(composeSummary(nextSummary, staleSettings));
      state.setRaceWarning("古い Summary response が遅れて返り、新しい表示を上書きしました。");
    })
    .catch(() => undefined)
    .finally(() => {
      state.setLoading({ account: false, accounts: false, summary: false });
    });
}

function withResourceLatency(settings: SimulatorSettings, latency: number): SimulatorSettings {
  return {
    ...settings,
    latency,
    resourceLatencies: {
      account: latency,
      accounts: latency,
      summary: latency,
    },
  };
}
