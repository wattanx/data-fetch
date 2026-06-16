import {
  AlertTriangle,
  Check,
  Code2,
  GitBranch,
  ListRestart,
  Monitor,
  RefreshCw,
  Route,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { Component, Suspense, useEffect, useState, type ReactNode } from "react";
import { atom, Provider, useAtomValue } from "jotai";
import { atomFamily } from "jotai/utils";
import useSWR from "swr";
import {
  defaultSettings,
  fetchAccountDashboard,
  getStrategy,
  makePayload,
  parseSettings,
  settingsToSearch,
  strategies,
  type DashboardPayload,
  type SimulatorSettings,
  type StrategyId,
  type StrategyMeta,
} from "../lib/fetch-lab";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./ui/popover";

type FetchDashboardProps = {
  activeStrategy: StrategyId;
  loaderData?: DashboardPayload;
  loaderError?: string;
};

const routeTabs = [
  { to: "/client-loader", label: "Monitor", icon: Monitor, strategy: "client-loader" },
  { to: "/jotai-use", label: "Jotai async atom", icon: Sparkles, strategy: "jotai-use" },
  { to: "/swr", label: "SWR", icon: ListRestart, strategy: "swr" },
  { to: "/use-effect", label: "useEffect", icon: AlertTriangle, strategy: "use-effect" },
] satisfies Array<{ to: string; label: string; icon: typeof Monitor; strategy: StrategyId }>;

const codeSamples: Record<StrategyId, Record<string, string>> = {
  "client-loader": {
    "route.tsx": `export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const settings = parseSettings(new URL(request.url).searchParams);
  const account = await fetchAccountDashboard("client-loader", settings, request.signal);
  return account;
}

export default function Route() {
  const data = useLoaderData<typeof clientLoader>();
  return <AccountView data={data} />;
}`,
    "api.ts": `export async function fetchAccountDashboard(strategy, settings, signal) {
  await wait(settings.latency, signal);
  if (settings.error) throw new Error("500 from /api/accounts/:id");
  return makePayload(strategy, settings);
}`,
    "notes.md": `Why this works:
- data resolves before the route renders
- navigation cancellation is owned by the router
- errors flow into route error boundaries
- revalidation is explicit instead of component-local`,
  },
  "jotai-use": {
    "route.tsx": `const dashboardAtom = atomFamily((key: string) =>
  atom(async () => fetchAccountDashboard("jotai-use", parseSettingsKey(key)))
);

function AccountResource({ settings }) {
  const data = useAtomValue(dashboardAtom(settingsKey(settings)));
  return <AccountView data={data} />;
}`,
    "atom.ts": `const userAtom = atomFamily((userId: string) =>
  atom(async () => fetchUser(userId))
);

const accountAtom = atomFamily((key: string) =>
  atom(async () => fetchAccountDashboard("jotai-use", parseSettingsKey(key)))
);

// Fixed data: define the async atom outside.
// Parameterized data: use atomFamily.
// useAtomValue suspends and returns the resolved value.`,
    "notes.md": `Good fit:
- shared client resources
- Suspense-first loading
- explicit invalidation

Watch out:
- cache lifetime is your design decision`,
  },
  swr: {
    "route.tsx": `const { data, error, isLoading, isValidating, mutate } = useSWR(
  ["account", settings],
  ([, settings]) => fetchAccountDashboard("swr", settings)
);

return <AccountView data={data} validating={isValidating} />;`,
    "swr.ts": `useSWR(key, fetcher, {
  keepPreviousData: true,
  revalidateOnFocus: true,
  shouldRetryOnError: false,
});

// Fast UX, but stale data needs visible language.`,
    "notes.md": `SWR shines for client-only widgets.
The caveat is ownership: route loaders and SWR can both think they own freshness.`,
  },
  "use-effect": {
    "route.tsx": `useEffect(() => {
  setLoading(true);
  fetchAccountDashboard("use-effect", settings)
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, [settings]);

// Missing abort + cache + dedupe makes UX policy local and fragile.`,
    "pitfalls.md": `Failure modes shown here:
- race condition when older responses win
- duplicate requests in Strict Mode development
- no cache by default
- loading and error state spread across components`,
  },
};

export function FetchDashboard({ activeStrategy, loaderData, loaderError }: FetchDashboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const settings = parseSettings(searchParams);
  const selected = getStrategy(activeStrategy);
  const [activeCodeTab, setActiveCodeTab] = useState(Object.keys(codeSamples[activeStrategy])[0]);

  useEffect(() => {
    setActiveCodeTab(Object.keys(codeSamples[activeStrategy])[0]);
  }, [activeStrategy]);

  function updateSettings(next: Partial<SimulatorSettings>) {
    const merged = { ...settings, ...next };
    setSearchParams(settingsToSearch(merged), { preventScrollReset: true, replace: false });
  }

  function refetch() {
    updateSettings({ seed: settings.seed + 1 });
  }

  function reset() {
    setSearchParams(settingsToSearch(defaultSettings), {
      preventScrollReset: true,
      replace: false,
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#1d1d1f]">
      <TopBar />
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-4 py-4">
        <section className="flex flex-col gap-3">
          <div>
            <div>
              <h1 className="text-[17px] font-semibold tracking-normal">Experience Monitor</h1>
              <p className="mt-1 text-[13px] text-[#6e6e73]">
                Side-by-side comparison of data fetching strategies for SaaS dashboards.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#dfdfda] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7e7e2] px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold">Deep Dive: {selected.label}</h2>
              <span className="rounded-md border border-[#cfe7d3] bg-[#f0fbf1] px-2 py-0.5 text-[11px] font-medium text-[#177b35]">
                Selected
              </span>
            </div>
            <div className="text-[12px] text-[#6e6e73]">
              <span>Generated {loaderData?.generatedAt ?? "live"}</span>
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-[0.92fr_1.08fr]">
            <DashboardDataPanel
              activeStrategy={activeStrategy}
              loaderData={loaderData}
              loaderError={loaderError}
              settings={settings}
              refetch={refetch}
            />
            <ImplementationPanel
              activeStrategy={activeStrategy}
              activeCodeTab={activeCodeTab}
              setActiveCodeTab={setActiveCodeTab}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3 pb-4">
          <div>
            <h2 className="text-[15px] font-semibold">Compare Strategies</h2>
            <p className="mt-1 text-[12px] text-[#6e6e73]">
              Switch strategies after reviewing the active implementation.
            </p>
          </div>
          <StrategyGrid activeStrategy={activeStrategy} navigate={navigate} settings={settings} />
        </section>
      </div>
      <FloatingTweaks
        refetch={refetch}
        reset={reset}
        settings={settings}
        updateSettings={updateSettings}
      />
    </main>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#deded9] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center gap-4 px-4">
        <Link className="flex min-w-fit items-center gap-2" to="/client-loader">
          <Zap className="fill-[#1d1d1f] text-[#1d1d1f]" size={21} />
          <span className="text-[15px] font-semibold">Fetch Strategy Studio</span>
          <span className="rounded-full bg-[#ececea] px-2 py-0.5 text-[11px] font-medium text-[#656565]">
            Prototype
          </span>
        </Link>
        <nav className="hidden h-full items-center gap-1 md:flex">
          {routeTabs.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `flex h-full items-center gap-2 border-b-2 px-4 text-[13px] font-medium ${
                  isActive
                    ? "border-[#1d1d1f] text-[#1d1d1f]"
                    : "border-transparent text-[#6e6e73] hover:text-[#1d1d1f]"
                }`
              }
              key={item.to}
              preventScrollReset
              to={item.to}
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center">
          <a
            className="flex items-center gap-2 rounded-md border border-[#d8d8d2] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f]"
            href="https://github.com/wattanx/data-fetch"
            rel="noreferrer"
            target="_blank"
          >
            <GitBranch size={14} />
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

function StrategyGrid({
  activeStrategy,
  navigate,
  settings,
}: {
  activeStrategy: StrategyId;
  navigate: ReturnType<typeof useNavigate>;
  settings: SimulatorSettings;
}) {
  return (
    <div className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-4">
      {strategies.map((strategy) => (
        <Link
          className={`min-w-0 rounded-lg border bg-white p-2.5 transition ${
            activeStrategy === strategy.id
              ? "border-[#4ab866] ring-1 ring-[#4ab866]"
              : "border-[#dfdfda] hover:border-[#b9b9b2]"
          }`}
          key={strategy.id}
          onClick={(event) => {
            event.preventDefault();
            const scrollY = window.scrollY;
            const restoreScroll = () => window.scrollTo({ top: scrollY, behavior: "auto" });
            const navigation = navigate(`/${strategy.id}?${settingsToSearch(settings)}`, {
              preventScrollReset: true,
            });

            void Promise.resolve(navigation).then(() => {
              requestAnimationFrame(restoreScroll);
              window.setTimeout(restoreScroll, 120);
            });
          }}
          preventScrollReset
          to={`/${strategy.id}?${settingsToSearch(settings)}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`flex size-4 items-center justify-center rounded text-[10px] font-semibold text-white ${accentBg(strategy.accent)}`}
              >
                {strategy.rank}
              </span>
              <h3 className="text-[12px] font-semibold">{strategy.label}</h3>
            </div>
            {activeStrategy === strategy.id ? (
              <span className="rounded-md bg-[#e9f8ec] px-1.5 py-0.5 text-[10px] font-medium text-[#177b35]">
                Selected
              </span>
            ) : (
              <span className="text-[#8a8a8e]">...</span>
            )}
          </div>

          <div className="mt-2 grid grid-cols-[1.05fr_0.85fr] gap-1.5">
            <div className="rounded-md border border-[#e4e4df] p-2">
              <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium">
                Preview
                <span className="text-[#8a8a8e]">i</span>
              </div>
              <SkeletonPreview
                active={
                  strategy.id === "use-effect" || (strategy.id === "swr" && settings.seed > 1)
                }
              />
            </div>
            <div className="rounded-md border border-[#e4e4df] p-2">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium">
                Error Boundary
                {strategy.errorBoundary === "late" ? (
                  <AlertTriangle className="text-[#d12f2f]" size={12} />
                ) : (
                  <Check className="text-[#1d8f3d]" size={12} />
                )}
              </div>
              <p className="text-[10px] leading-4 text-[#6e6e73]">
                {strategy.errorBoundary === "late"
                  ? "Late catch, UI may flicker"
                  : "Catch & render"}
              </p>
              <button
                className="mt-2 rounded-md border border-[#d8d8d2] px-2 py-0.5 text-[10px]"
                type="button"
              >
                Retry
              </button>
            </div>
          </div>

          <MetricRows strategy={strategy} settings={settings} />
        </Link>
      ))}
    </div>
  );
}

function MetricRows({
  strategy,
  settings,
}: {
  strategy: ReturnType<typeof getStrategy>;
  settings: SimulatorSettings;
}) {
  const duplicateRequests =
    strategy.id === "use-effect" && settings.strict ? 3 : strategy.duplicateRequests;
  const score = Math.max(
    18,
    strategy.uxScore -
      (settings.error ? 18 : 0) -
      (settings.race && strategy.id === "use-effect" ? 11 : 0),
  );

  return (
    <div className="mt-1.5 overflow-hidden rounded-md border border-[#e4e4df] text-[10px]">
      <InfoRow label="Stale Data" value={strategy.staleData} />
      <InfoRow label="Cache Behavior" value={strategy.cacheBehavior} />
      <InfoRow
        label="Duplicate Requests"
        value={`${duplicateRequests} per navigation`}
        strong={duplicateRequests > 0}
      />
      <div className="grid grid-cols-[100px_1fr] border-t border-[#eeeeea]">
        <div className="px-2 py-1.5 font-medium">UX Score</div>
        <div className="flex items-center gap-1.5 px-2 py-1.5 text-[#3f3f43]">
          <ScoreRing score={score} accent={strategy.accent} />
          <span className="font-semibold">{score}</span>
          <span className="text-[#8a8a8e]">/100</span>
          <span className="text-[#6e6e73]">
            {score > 88 ? "Excellent" : score > 65 ? "Good" : "Poor"}
          </span>
        </div>
      </div>
      <InfoRow label="Notes" value={strategy.notes} />
    </div>
  );
}

function DashboardDataPanel({
  activeStrategy,
  loaderData,
  loaderError,
  settings,
  refetch,
}: {
  activeStrategy: StrategyId;
  loaderData?: DashboardPayload;
  loaderError?: string;
  settings: SimulatorSettings;
  refetch: () => void;
}) {
  if (activeStrategy === "client-loader" && loaderError) {
    return <ErrorPanel message={loaderError} refetch={refetch} title="Route Error Boundary" />;
  }

  if (activeStrategy === "client-loader" && loaderData) {
    return <ResolvedDataPanel data={loaderData} />;
  }

  if (activeStrategy === "client-loader") {
    return <PanelSkeleton title="clientLoader is resolving before render" />;
  }

  if (activeStrategy === "jotai-use") {
    return (
      <Provider>
        <ResourceBoundary resetKey={settingsKey(settings)} refetch={refetch}>
          <Suspense fallback={<PanelSkeleton title="Jotai resource is suspending" />}>
            <JotaiResourcePanel settings={settings} />
          </Suspense>
        </ResourceBoundary>
      </Provider>
    );
  }

  if (activeStrategy === "swr") {
    return <SwrDataPanel settings={settings} />;
  }

  return <UseEffectDataPanel settings={settings} refetch={refetch} />;
}

function JotaiResourcePanel({ settings }: { settings: SimulatorSettings }) {
  const dashboardAtom = getJotaiDashboardAtom(settings);
  const data = useAtomValue(dashboardAtom);
  return <ResolvedDataPanel data={data} />;
}

function SwrDataPanel({ settings }: { settings: SimulatorSettings }) {
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

  if (isLoading && !data) return <PanelSkeleton title="SWR is loading the first response" />;
  if (error && !data) return <ErrorPanel message={error.message} refetch={() => void mutate()} />;
  return (
    <ResolvedDataPanel
      data={data ?? makePayload("swr", settings)}
      badge={isValidating ? "Updating cached data" : "Serving cached view"}
    />
  );
}

function UseEffectDataPanel({
  settings,
  refetch,
}: {
  settings: SimulatorSettings;
  refetch: () => void;
}) {
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

  if (loading && !data) return <PanelSkeleton title="Component-local loading state" />;
  if (error && !data) return <ErrorPanel message={error} refetch={refetch} />;
  return (
    <ResolvedDataPanel
      data={data ?? makePayload("use-effect", settings)}
      badge={
        loading ? "Local state fetching again" : error ? "Late error catch" : "No cache policy"
      }
      warning={error ?? undefined}
    />
  );
}

function ResolvedDataPanel({
  data,
  badge,
  warning,
}: {
  data: DashboardPayload;
  badge?: string;
  warning?: string;
}) {
  return (
    <div className="min-w-0 border-r border-[#e7e7e2] p-4">
      <SectionTitle title="Account Overview" badge={badge ?? "Active"} />
      {warning ? (
        <div className="mb-3 rounded-md border border-[#f1c6c6] bg-[#fff7f7] px-3 py-2 text-[12px] text-[#a12a2a]">
          {warning}
        </div>
      ) : null}
      <div className="rounded-lg border border-[#e2e2dc]">
        <div className="grid gap-3 border-b border-[#eeeeea] p-4 sm:grid-cols-[1fr_140px]">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-[#111] text-white">
              <Route size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-semibold">{data.account.name}</p>
                <span className="rounded-full bg-[#ecf8ef] px-2 py-0.5 text-[11px] font-medium text-[#177b35]">
                  {data.account.status}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[#6e6e73]">
                {data.account.domain} · {data.account.id}
              </p>
            </div>
          </div>
          <div className="border-l border-[#eeeeea] pl-4">
            <p className="text-[11px] text-[#6e6e73]">MRR</p>
            <p className="text-[22px] font-semibold tracking-normal">
              ${data.account.mrr.toLocaleString()}
            </p>
            <p className="text-[11px] font-medium text-[#17833b]">+ 12.4%</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 lg:grid-cols-4">
          <MiniMetric label="Users" value={data.summary.users.toString()} change="+ 5.1%" />
          <MiniMetric label="Projects" value={data.summary.projects.toString()} change="+ 9.0%" />
          <MiniMetric
            label="Requests"
            value={data.summary.requests.toLocaleString()}
            change="+ 18.7%"
          />
          <MiniMetric
            label="Error Rate"
            value={`${data.summary.errorRate.toFixed(2)}%`}
            change="- 32.1%"
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[#e2e2dc]">
        <div className="flex items-center justify-between border-b border-[#eeeeea] px-3 py-2">
          <h3 className="text-[13px] font-semibold">Recent Accounts</h3>
          <span className="text-[11px] text-[#8a8a8e]">{data.generatedAt}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse text-left text-[12px]">
            <thead className="text-[#6e6e73]">
              <tr className="border-b border-[#eeeeea]">
                <th className="px-3 py-2 font-medium">Account</th>
                <th className="px-3 py-2 font-medium">MRR</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Requests</th>
                <th className="px-3 py-2 font-medium">Incidents</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((account, index) => (
                <tr
                  className={index === 0 ? "bg-[#f5f8fb]" : "border-t border-[#f1f1ed]"}
                  key={account.id}
                >
                  <td className="px-3 py-2">
                    <p className="font-medium">{account.name}</p>
                    <p className="text-[11px] text-[#8a8a8e]">{account.domain}</p>
                  </td>
                  <td className="px-3 py-2">${account.mrr.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${statusClass(account.status)}`}
                    >
                      {account.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{account.requests.toLocaleString()}</td>
                  <td className="px-3 py-2">{account.incidents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FloatingTweaks({
  refetch,
  reset,
  settings,
  updateSettings,
}: {
  refetch: () => void;
  reset: () => void;
  settings: SimulatorSettings;
  updateSettings: (next: Partial<SimulatorSettings>) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover>
        <PopoverTrigger
          aria-label="Open tweaks"
          className="flex size-8 items-center justify-center rounded-full border border-[#cfcfca] bg-[#1d1d1f] text-white shadow-[0_8px_22px_rgba(0,0,0,0.18)] transition hover:bg-[#2c2c2e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1f] focus-visible:ring-offset-2"
        >
          <SlidersHorizontal size={14} />
        </PopoverTrigger>

        <PopoverContent
          aria-label="Tweaks"
          className="w-[min(calc(100vw-2rem),360px)] p-3"
          side="top"
          align="end"
          sideOffset={10}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <PopoverHeader>
              <PopoverTitle className="text-[13px] font-semibold">Tweaks</PopoverTitle>
              <PopoverDescription className="text-[11px] text-[#6e6e73]">
                API behavior controls
              </PopoverDescription>
            </PopoverHeader>
            <PopoverClose
              aria-label="Close tweaks"
              className="flex size-7 items-center justify-center rounded-md border border-[#d8d8d2] text-[#6e6e73] hover:bg-[#f4f4f1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1f]"
            >
              <X size={14} />
            </PopoverClose>
          </div>

          <TweaksPanel
            refetch={refetch}
            reset={reset}
            settings={settings}
            updateSettings={updateSettings}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TweaksPanel({
  refetch,
  reset,
  settings,
  updateSettings,
}: {
  refetch: () => void;
  reset: () => void;
  settings: SimulatorSettings;
  updateSettings: (next: Partial<SimulatorSettings>) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 rounded-md border border-[#e2e2dc] bg-[#fbfbf9] px-2.5 py-2">
        <div>
          <p className="text-[11px] font-medium">Endpoint</p>
          <p className="mt-0.5 text-[11px] text-[#6e6e73]">GET /api/accounts/:id</p>
        </div>
        <span className="rounded-md border border-[#d8d8d2] bg-white px-2 py-1 text-[10px] font-medium text-[#6e6e73]">
          acct_7f9a2d1b
        </span>
      </div>

      <label className="grid gap-1.5 text-[11px]">
        <span className="flex items-center justify-between font-medium">
          Latency
          <span>{settings.latency} ms</span>
        </span>
        <input
          className="accent-[#1d1d1f]"
          max={1500}
          min={0}
          onChange={(event) => updateSettings({ latency: Number(event.target.value) })}
          step={50}
          type="range"
          value={settings.latency}
        />
        <span className="flex justify-between text-[10px] text-[#8a8a8e]">
          <span>0</span>
          <span>500</span>
          <span>1000</span>
          <span>1500</span>
        </span>
      </label>

      <div className="grid gap-1.5">
        <ToggleTile
          checked={settings.error}
          description="Return 500"
          label="Simulate Error"
          onChange={(error) => updateSettings({ error })}
        />
        <ToggleTile
          checked={settings.race}
          description="Out-of-order responses"
          label="Race Condition"
          onChange={(race) => updateSettings({ race })}
        />
        <ToggleTile
          checked={settings.strict}
          description="Double invoke in dev"
          label="React Strict Mode"
          onChange={(strict) => updateSettings({ strict })}
        />
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        <button
          className="flex items-center justify-center gap-2 rounded-md border border-[#1d1d1f] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#1d1d1f]"
          onClick={refetch}
          type="button"
        >
          <RefreshCw size={13} />
          Refetch
        </button>
        <button
          className="rounded-md border border-[#d8d8d2] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#1d1d1f]"
          onClick={reset}
          type="button"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function ImplementationPanel({
  activeStrategy,
  activeCodeTab,
  setActiveCodeTab,
}: {
  activeStrategy: StrategyId;
  activeCodeTab: string;
  setActiveCodeTab: (tab: string) => void;
}) {
  const selected = getStrategy(activeStrategy);
  const tabs = Object.keys(codeSamples[activeStrategy]);
  const currentCode = codeSamples[activeStrategy][activeCodeTab] ?? "";

  return (
    <div className="min-w-0 p-4">
      <div className="overflow-hidden rounded-lg border border-[#d8d8d2]">
        <div className="flex items-center overflow-x-auto border-b border-[#2b2f36] bg-[#f4f4f1]">
          {tabs.map((tab) => (
            <button
              className={`min-w-24 border-r border-[#deded9] px-4 py-2 text-[12px] font-medium ${
                activeCodeTab === tab ? "bg-[#1f242b] text-white" : "text-[#555]"
              }`}
              key={tab}
              onClick={() => setActiveCodeTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
          <Code2 className="ml-auto mr-3 text-[#6e6e73]" size={15} />
        </div>
        <pre className="min-h-[260px] overflow-auto bg-[#1f242b] p-4 text-[12px] leading-6 text-[#f5f5f7]">
          <code>{currentCode}</code>
        </pre>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-[#e2e2dc] p-4">
          <h3 className="mb-3 text-[13px] font-semibold">なぜうまく機能するか</h3>
          <ul className="grid gap-2 text-[12px] leading-5 text-[#555]">
            {selected.strengths.map((item) => (
              <li className="flex gap-2" key={item}>
                <Check className="mt-0.5 min-w-4 text-[#177b35]" size={15} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-[#ead8b9] bg-[#fffaf2] p-4">
          <h3 className="mb-3 text-[13px] font-semibold">注意したい制約</h3>
          <ul className="grid gap-2 text-[12px] leading-5 text-[#6a5735]">
            {selected.limitations.map((item) => (
              <li className="flex gap-2" key={item}>
                <AlertTriangle className="mt-0.5 min-w-4 text-[#c98200]" size={14} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PanelSkeleton({ title }: { title: string }) {
  return (
    <div className="min-w-0 border-r border-[#e7e7e2] p-4">
      <SectionTitle title={title} badge="Loading" />
      <div className="grid gap-3 rounded-lg border border-[#e2e2dc] p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="h-7 animate-pulse rounded-md bg-[#ededeb]" key={index} />
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({
  message,
  refetch,
  title = "Error Boundary Preview",
}: {
  message: string;
  refetch: () => void;
  title?: string;
}) {
  return (
    <div className="min-w-0 border-r border-[#e7e7e2] p-4">
      <SectionTitle title={title} badge="Error" />
      <div className="rounded-lg border border-[#f1c6c6] bg-[#fff7f7] p-4">
        <AlertTriangle className="mb-3 text-[#c53030]" size={22} />
        <h3 className="text-[15px] font-semibold">Simulated API failure</h3>
        <p className="mt-1 text-[12px] text-[#7a3a3a]">{message}</p>
        <button
          className="mt-4 rounded-md border border-[#d8d8d2] bg-white px-3 py-2 text-[12px] font-semibold"
          onClick={refetch}
          type="button"
        >
          Retry request
        </button>
      </div>
    </div>
  );
}

class ResourceBoundary extends Component<
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

const jotaiDashboardAtomFamily = atomFamily((key: string) =>
  atom(async () => fetchAccountDashboard("jotai-use", parseSettingsKey(key))),
);

function getJotaiDashboardAtom(settings: SimulatorSettings) {
  return jotaiDashboardAtomFamily(settingsKey(settings));
}

function SectionTitle({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[13px] font-semibold">{title}</h3>
      {badge ? (
        <span className="rounded-md bg-[#eef5ef] px-2 py-0.5 text-[11px] font-medium text-[#177b35]">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function MiniMetric({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div className="rounded-md border border-[#e4e4df] p-3">
      <p className="text-[11px] text-[#6e6e73]">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-[18px] font-semibold">{value}</p>
        <span className="text-[11px] font-medium text-[#17833b]">{change}</span>
      </div>
    </div>
  );
}

function ToggleTile({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-[#e2e2dc] p-2.5">
      <span>
        <span className="block text-[11px] font-medium">{label}</span>
        <span className="mt-0.5 block text-[10px] leading-4 text-[#6e6e73]">{description}</span>
      </span>
      <span className="relative inline-flex h-5 w-9 items-center">
        <input
          checked={checked}
          className="peer sr-only"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="absolute inset-0 rounded-full bg-[#d8d8d2] transition peer-checked:bg-[#1d1d1f]" />
        <span className="absolute left-0.5 size-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[100px_1fr] border-t border-[#eeeeea] first:border-t-0">
      <div className="px-2 py-1.5 font-medium">{label}</div>
      <div className={`px-2 py-1.5 ${strong ? "font-semibold text-[#c53030]" : "text-[#555]"}`}>
        {value}
      </div>
    </div>
  );
}

function SkeletonPreview({ active }: { active: boolean }) {
  return (
    <div className="rounded-md bg-[#f4f4f1] p-2">
      <div className="flex items-center gap-1.5">
        <div className={`size-5 rounded-full bg-[#deded9] ${active ? "animate-pulse" : ""}`} />
        <div className="grid flex-1 gap-1.5">
          <div className={`h-2 rounded-full bg-[#d7d7d2] ${active ? "animate-pulse" : ""}`} />
          <div className={`h-2 w-2/3 rounded-full bg-[#deded9] ${active ? "animate-pulse" : ""}`} />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <div className={`h-4 rounded bg-[#deded9] ${active ? "animate-pulse" : ""}`} />
        <div className={`h-4 rounded bg-[#deded9] ${active ? "animate-pulse" : ""}`} />
        <div className={`h-4 rounded bg-[#deded9] ${active ? "animate-pulse" : ""}`} />
      </div>
    </div>
  );
}

function ScoreRing({ score, accent }: { score: number; accent: StrategyMeta["accent"] }) {
  const color =
    accent === "green" || accent === "blue"
      ? "#1fa247"
      : accent === "amber"
        ? "#d99400"
        : "#d94a4a";
  return (
    <span
      className="inline-block size-7 rounded-full"
      style={{
        background: `conic-gradient(${color} ${score * 3.6}deg, #e5e5df 0deg)`,
        padding: 3,
      }}
    >
      <span className="block size-full rounded-full bg-white" />
    </span>
  );
}

function accentBg(accent: StrategyMeta["accent"]) {
  if (accent === "green") return "bg-[#28a745]";
  if (accent === "blue") return "bg-[#2f7ee6]";
  if (accent === "amber") return "bg-[#d99a00]";
  return "bg-[#d64545]";
}

function statusClass(status: "Active" | "Trial" | "At risk") {
  if (status === "Active") return "bg-[#ecf8ef] text-[#177b35]";
  if (status === "Trial") return "bg-[#fff5df] text-[#996600]";
  return "bg-[#fff0f0] text-[#ad3030]";
}
