import { useEffect, useState } from "react";
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

  useEffect(() => {
    setAccount(null);
    setAccounts(null);
    setSummary(null);
    setErrors({});
    setLoading({ account: true, accounts: true, summary: true });

    fetchAccountResource("use-effect", settings)
      .then((nextAccount) => {
        setAccount(composeAccount(nextAccount, settings));
      })
      .catch((reason: unknown) => {
        setErrors((current) => ({
          ...current,
          account: reason instanceof Error ? reason.message : "Unknown account error",
        }));
      })
      .finally(() => {
        setLoading((current) => ({ ...current, account: false }));
      });

    fetchAccountsResource("use-effect", settings)
      .then((nextAccounts) => {
        setAccounts(composeAccounts(nextAccounts, settings));
      })
      .catch((reason: unknown) => {
        setErrors((current) => ({
          ...current,
          accounts: reason instanceof Error ? reason.message : "Unknown accounts error",
        }));
      })
      .finally(() => {
        setLoading((current) => ({ ...current, accounts: false }));
      });

    fetchSummaryResource("use-effect", settings)
      .then((nextSummary) => {
        setSummary(composeSummary(nextSummary, settings));
      })
      .catch((reason: unknown) => {
        setErrors((current) => ({
          ...current,
          summary: reason instanceof Error ? reason.message : "Unknown summary error",
        }));
      })
      .finally(() => {
        setLoading((current) => ({ ...current, summary: false }));
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
          isLoading ? "Local state fetching" : hasError ? "Late error catch" : "No cache policy"
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
      />
    </DashboardPage>
  );
}
