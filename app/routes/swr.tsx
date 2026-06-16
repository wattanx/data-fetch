import useSWR from "swr";
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
} from "../lib/fetch-lab";

export function meta() {
  return [{ title: "SWR | Fetch Strategy Studio" }];
}

export default function SwrRoute() {
  const controls = useDashboardControls();
  const { settings } = controls;
  const key = [
    settings.resourceLatencies.account,
    settings.resourceLatencies.accounts,
    settings.resourceLatencies.summary,
    settings.resourceErrors.account,
    settings.resourceErrors.accounts,
    settings.resourceErrors.summary,
    settings.race,
    settings.strict,
    settings.seed,
  ] as const;
  const account = useSWR(["account", ...key], () => fetchAccountResource("swr", settings), {
    keepPreviousData: true,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const accounts = useSWR(["accounts", ...key], () => fetchAccountsResource("swr", settings), {
    keepPreviousData: true,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const summary = useSWR(["summary", ...key], () => fetchSummaryResource("swr", settings), {
    keepPreviousData: true,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const isValidating = account.isValidating || accounts.isValidating || summary.isValidating;

  function mutateResources() {
    void Promise.all([account.mutate(), accounts.mutate(), summary.mutate()]);
  }

  return (
    <DashboardPage activeStrategy="swr" controls={controls}>
      <ProgressiveDataPanel
        account={
          settings.resourceErrors.account || account.error ? (
            <ResourceSectionError label="Account" refetch={mutateResources} />
          ) : account.data ? (
            <AccountOverviewSection account={composeAccount(account.data, settings)} />
          ) : (
            <AccountOverviewSkeleton />
          )
        }
        accounts={
          settings.resourceErrors.accounts || accounts.error ? (
            <ResourceSectionError label="Accounts" refetch={mutateResources} />
          ) : accounts.data ? (
            <AccountsTableSection accounts={composeAccounts(accounts.data, settings)} />
          ) : (
            <AccountsTableSkeleton />
          )
        }
        badge={isValidating ? "Updating cached data" : "Progressive"}
        summary={
          settings.resourceErrors.summary || summary.error ? (
            <ResourceSectionError label="Summary" refetch={mutateResources} />
          ) : summary.data ? (
            <SummaryMetricSection summary={composeSummary(summary.data, settings)} />
          ) : (
            <SummaryMetricsSkeleton />
          )
        }
      />
    </DashboardPage>
  );
}
