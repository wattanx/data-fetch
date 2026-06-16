import { Suspense, useMemo } from "react";
import { Await, useLoaderData, useRouteError } from "react-router";
import type { ShouldRevalidateFunction } from "react-router";
import {
  AccountOverviewSection,
  AccountOverviewSkeleton,
  AccountsTableSection,
  AccountsTableSkeleton,
  DashboardPage,
  ErrorPanel,
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
  parseSettings,
} from "../lib/fetch-lab";
import type { Route } from "./+types/client-loader";

export function meta() {
  return [{ title: "clientLoader | Fetch Strategy Studio" }];
}

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const settings = parseSettings(new URL(request.url).searchParams);
  return {
    account: fetchAccountResource("client-loader", settings, request.signal),
    accounts: fetchAccountsResource("client-loader", settings, request.signal),
    summary: fetchSummaryResource("client-loader", settings, request.signal),
  };
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  defaultShouldRevalidate,
  nextUrl,
}) => {
  return currentUrl.search !== nextUrl.search || defaultShouldRevalidate;
};

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
  const { account, accounts, summary } = useLoaderData<typeof clientLoader>();
  const accountResource = useMemo(
    () => Promise.resolve(account).then((data) => composeAccount(data, controls.settings)),
    [
      account,
      controls.settings.resourceLatencies.account,
      controls.settings.resourceErrors.account,
      controls.settings.race,
      controls.settings.seed,
      controls.settings.strict,
    ],
  );
  const accountsResource = useMemo(
    () => Promise.resolve(accounts).then((data) => composeAccounts(data, controls.settings)),
    [
      accounts,
      controls.settings.resourceLatencies.accounts,
      controls.settings.resourceErrors.accounts,
      controls.settings.race,
      controls.settings.seed,
      controls.settings.strict,
    ],
  );
  const summaryResource = useMemo(
    () => Promise.resolve(summary).then((data) => composeSummary(data, controls.settings)),
    [
      summary,
      controls.settings.resourceLatencies.summary,
      controls.settings.resourceErrors.summary,
      controls.settings.race,
      controls.settings.seed,
      controls.settings.strict,
    ],
  );

  return (
    <DashboardPage activeStrategy="client-loader" controls={controls}>
      <ProgressiveDataPanel
        account={
          controls.settings.resourceErrors.account ? (
            <ResourceSectionError label="Account" refetch={controls.refetch} />
          ) : (
            <Suspense fallback={<AccountOverviewSkeleton />}>
              <Await
                resolve={accountResource}
                errorElement={<ResourceSectionError label="Account" refetch={controls.refetch} />}
              >
                {(data) => <AccountOverviewSection account={data} />}
              </Await>
            </Suspense>
          )
        }
        accounts={
          controls.settings.resourceErrors.accounts ? (
            <ResourceSectionError label="Accounts" refetch={controls.refetch} />
          ) : (
            <Suspense fallback={<AccountsTableSkeleton />}>
              <Await
                resolve={accountsResource}
                errorElement={<ResourceSectionError label="Accounts" refetch={controls.refetch} />}
              >
                {(data) => <AccountsTableSection accounts={data} />}
              </Await>
            </Suspense>
          )
        }
        badge="Progressive"
        summary={
          controls.settings.resourceErrors.summary ? (
            <ResourceSectionError label="Summary" refetch={controls.refetch} />
          ) : (
            <Suspense fallback={<SummaryMetricsSkeleton />}>
              <Await
                resolve={summaryResource}
                errorElement={<ResourceSectionError label="Summary" refetch={controls.refetch} />}
              >
                {(data) => <SummaryMetricSection summary={data} />}
              </Await>
            </Suspense>
          )
        }
      />
    </DashboardPage>
  );
}
