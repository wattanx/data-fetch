export type StrategyId = "client-loader" | "jotai-use" | "swr" | "use-effect";

export type ScenarioMode = "normal" | "slow" | "error" | "race" | "strict";

export type SimulatorSettings = {
  latency: number;
  error: boolean;
  race: boolean;
  strict: boolean;
  seed: number;
};

export type Account = {
  id: string;
  name: string;
  domain: string;
  mrr: number;
  status: "Active" | "Trial" | "At risk";
  requests: number;
  incidents: number;
};

export type RequestLog = {
  id: string;
  time: string;
  strategy: string;
  status: "200 OK" | "500 Error" | "stale" | "aborted";
  latency: number;
  size: string;
};

export type DashboardPayload = {
  account: Account;
  accounts: Account[];
  logs: RequestLog[];
  generatedAt: string;
  summary: {
    users: number;
    projects: number;
    requests: number;
    errorRate: number;
  };
};

export type StrategyMeta = {
  id: StrategyId;
  label: string;
  rank: number;
  cacheBehavior: string;
  duplicateRequests: number;
  uxScore: number;
  uxLabel: string;
  staleData: string;
  errorBoundary: "clean" | "manual" | "late";
  notes: string;
  accent: "green" | "blue" | "amber" | "red";
  strengths: string[];
  limitations: string[];
};

export const strategies: StrategyMeta[] = [
  {
    id: "client-loader",
    label: "React Router clientLoader",
    rank: 1,
    cacheBehavior: "Request deduped by router cache",
    duplicateRequests: 0,
    uxScore: 96,
    uxLabel: "Excellent",
    staleData: "No stale data shown",
    errorBoundary: "clean",
    notes: "Clean boundaries, no waterfalls, built-in revalidation.",
    accent: "green",
    strengths: [
      "Data is loaded before render, eliminating local loading flicker.",
      "Automatic request deduplication across navigation.",
      "Thrown responses land in route error boundaries.",
      "Revalidation can be scoped to navigation, submit, and focus events.",
    ],
    limitations: [
      "Runs during navigation, so highly dynamic widgets may need local fetching too.",
      "Best when route ownership matches data ownership.",
      "Requires React Router data APIs.",
    ],
  },
  {
    id: "jotai-use",
    label: "Jotai + use",
    rank: 2,
    cacheBehavior: "Atom cache, scoped in memory",
    duplicateRequests: 0,
    uxScore: 92,
    uxLabel: "Excellent",
    staleData: "No stale data shown",
    errorBoundary: "clean",
    notes: "Simple mental model, great UX, manual invalidation.",
    accent: "blue",
    strengths: [
      "Promise atoms keep async state colocated without component effects.",
      "Suspense controls loading, and error boundaries control failures.",
      "Scoped atoms make preloading and invalidation explicit.",
      "Works well for shared client state that multiple panels read.",
    ],
    limitations: [
      "You own invalidation and cache lifetime policy.",
      "Requires a Suspense-ready app shell.",
      "Debugging async atom graphs needs team discipline.",
    ],
  },
  {
    id: "swr",
    label: "SWR",
    rank: 3,
    cacheBehavior: "SWR cache, revalidate on focus/reconnect",
    duplicateRequests: 1,
    uxScore: 78,
    uxLabel: "Good",
    staleData: "Stale-while-revalidate",
    errorBoundary: "manual",
    notes: "Fast perceived performance, but stale data must be communicated.",
    accent: "amber",
    strengths: [
      "Fast perceived performance when cached data is acceptable.",
      "Focus and reconnect revalidation are useful defaults.",
      "Great for many independent client-only widgets.",
      "Small API surface for common fetching needs.",
    ],
    limitations: [
      "Stale data can be ambiguous without clear UI language.",
      "Route transitions can duplicate ownership with loaders.",
      "Error and loading states often spread across components.",
    ],
  },
  {
    id: "use-effect",
    label: "useEffect (Baseline)",
    rank: 4,
    cacheBehavior: "None by default",
    duplicateRequests: 3,
    uxScore: 42,
    uxLabel: "Poor",
    staleData: "Stale data likely",
    errorBoundary: "late",
    notes: "Prone to race conditions, waterfalls, flicker, and Strict Mode surprises.",
    accent: "red",
    strengths: [
      "Very flexible for one-off side effects.",
      "No extra dependency or router coupling.",
      "Can be acceptable for non-critical background work.",
    ],
    limitations: [
      "Race conditions require manual AbortController handling.",
      "Strict Mode can expose duplicate request assumptions in development.",
      "No cache, dedupe, or revalidation policy by default.",
      "Loading and error state are scattered across components.",
    ],
  },
];

export const defaultSettings: SimulatorSettings = {
  latency: 650,
  error: false,
  race: false,
  strict: false,
  seed: 1,
};

const baseAccounts: Account[] = [
  {
    id: "acct_7f9a2d1b",
    name: "Acme Corp.",
    domain: "acme.com",
    mrr: 28540,
    status: "Active",
    requests: 2431,
    incidents: 0,
  },
  {
    id: "acct_3b2c91aa",
    name: "Globex Inc.",
    domain: "globex.com",
    mrr: 16230,
    status: "Active",
    requests: 1842,
    incidents: 1,
  },
  {
    id: "acct_8120abef",
    name: "Initech",
    domain: "initech.com",
    mrr: 8910,
    status: "Active",
    requests: 913,
    incidents: 0,
  },
  {
    id: "acct_trial_17",
    name: "Soylent Corp.",
    domain: "soylent.com",
    mrr: 4120,
    status: "Trial",
    requests: 405,
    incidents: 0,
  },
  {
    id: "acct_umbrella",
    name: "Umbrella Co.",
    domain: "umbrella.com",
    mrr: 2340,
    status: "At risk",
    requests: 231,
    incidents: 1,
  },
];

export function getStrategy(id: StrategyId) {
  return strategies.find((strategy) => strategy.id === id) ?? strategies[0];
}

export function parseSettings(searchParams: URLSearchParams): SimulatorSettings {
  const mode = searchParams.get("mode") as ScenarioMode | null;
  const latencyFromMode = mode === "slow" ? 1200 : defaultSettings.latency;

  return {
    latency: clamp(Number(searchParams.get("latency") ?? latencyFromMode), 0, 1500),
    error: searchParams.get("error") === "1" || mode === "error",
    race: searchParams.get("race") === "1" || mode === "race",
    strict: searchParams.get("strict") === "1" || mode === "strict",
    seed: Number(searchParams.get("seed") ?? defaultSettings.seed),
  };
}

export function settingsToSearch(settings: SimulatorSettings) {
  const next = new URLSearchParams();
  next.set("latency", String(settings.latency));
  next.set("seed", String(settings.seed));
  if (settings.error) next.set("error", "1");
  if (settings.race) next.set("race", "1");
  if (settings.strict) next.set("strict", "1");
  return next;
}

export async function fetchAccountDashboard(
  strategyId: StrategyId,
  settings: SimulatorSettings,
  signal?: AbortSignal,
) {
  await wait(settings.latency, signal);

  if (settings.error) {
    throw new Error("Simulated 500 response from /api/accounts/:id");
  }

  return makePayload(strategyId, settings);
}

export function makePayload(strategyId: StrategyId, settings: SimulatorSettings): DashboardPayload {
  const account = baseAccounts[0];
  const requestBump = settings.seed * 7;
  const logs = makeLogs(strategyId, settings);

  return {
    account: {
      ...account,
      requests: account.requests + requestBump,
      mrr: account.mrr + settings.seed * 120,
    },
    accounts: baseAccounts.map((item, index) => ({
      ...item,
      requests: item.requests + settings.seed * (index + 2),
      mrr: item.mrr + settings.seed * (index + 1) * 40,
    })),
    logs,
    generatedAt: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    summary: {
      users: 128 + settings.seed,
      projects: 24 + (settings.seed % 4),
      requests: 2431 + requestBump,
      errorRate: settings.error ? 3.8 : 0.18 + settings.seed * 0.01,
    },
  };
}

function makeLogs(strategyId: StrategyId, settings: SimulatorSettings): RequestLog[] {
  const strategy = getStrategy(strategyId);
  const duplicateCount =
    strategyId === "use-effect" && settings.strict ? 3 : strategy.duplicateRequests;
  const rows = [
    strategy.label,
    "Jotai + use",
    "SWR (revalidated)",
    "clientLoader",
    "useEffect #1",
    "useEffect #2",
  ];

  return rows.slice(0, settings.race ? 6 : 5).map((label, index) => {
    const isDuplicate = strategyId === "use-effect" && index <= duplicateCount;
    const status: RequestLog["status"] =
      settings.error && index === 0
        ? "500 Error"
        : settings.race && index === 4
          ? "aborted"
          : "200 OK";
    return {
      id: `${label}-${index}-${settings.seed}`,
      time: offsetTime(index),
      strategy: isDuplicate ? `useEffect #${index + 1}` : label,
      status,
      latency: Math.max(80, settings.latency + index * 9 - (settings.race ? index * 28 : 0)),
      size: status === "500 Error" ? "1.2 KB" : "24.1 KB",
    };
  });
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = globalThis.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        globalThis.clearTimeout(timer);
        reject(new DOMException("Request aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function offsetTime(index: number) {
  const now = new Date(Date.now() - index * 21000);
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}
