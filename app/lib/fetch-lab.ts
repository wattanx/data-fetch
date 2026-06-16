export type StrategyId = "client-loader" | "jotai-use" | "swr" | "use-effect";

export type ScenarioMode = "normal" | "slow" | "error" | "race";

export type ResourceKey = "account" | "accounts" | "summary";

export type ResourceLatencies = Record<ResourceKey, number>;

export type ResourceErrors = Record<ResourceKey, boolean>;

export type SimulatorSettings = {
  latency: number;
  resourceLatencies: ResourceLatencies;
  resourceErrors: ResourceErrors;
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

export type DashboardSummary = DashboardPayload["summary"];

export type DashboardResources = {
  account: Account;
  accounts: Account[];
  summary: DashboardSummary;
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
      "描画前にデータを解決するため、コンポーネント内のローディングちらつきを抑えられる。",
      "ナビゲーション中のリクエスト重複を Router 側で抑制できる。",
      "throw したレスポンスをルートの ErrorBoundary に集約できる。",
      "ナビゲーション、submit、focus などに合わせて再検証を設計しやすい。",
    ],
    limitations: [
      "ナビゲーション単位で動くため、高頻度に変わるウィジェットは別の取得戦略が必要な場合がある。",
      "ルートの責務とデータの責務が一致している画面で特に効果が出る。",
      "React Router の data API を前提にする。",
    ],
  },
  {
    id: "jotai-use",
    label: "Jotai async atom",
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
      "async atom に非同期状態を寄せられるため、コンポーネントの effect を減らせる。",
      "ローディングは Suspense、失敗は ErrorBoundary に分離できる。",
      "atomFamily を使うと、引数付きデータのプリロードや無効化を明示しやすい。",
      "複数パネルで共有するクライアント状態と相性が良い。",
    ],
    limitations: [
      "無効化やキャッシュ寿命のポリシーはアプリ側で設計する必要がある。",
      "Suspense 前提のアプリシェルや境界設計が必要になる。",
      "非同期 atom の依存関係が増えると、チーム内で設計ルールが必要になる。",
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
      "キャッシュ済みデータを許容できる場面では体感速度を上げやすい。",
      "focus や reconnect 時の再検証がデフォルトで扱いやすい。",
      "独立した client-only ウィジェットが多い画面で使いやすい。",
      "よくある fetch 要件を少ない API で書ける。",
    ],
    limitations: [
      "stale な表示であることを UI で明示しないと、ユーザーが状態を誤解しやすい。",
      "ルート loader と併用すると、どちらが freshness を持つのか責務が重複しやすい。",
      "ローディングやエラー状態がコンポーネントごとに分散しやすい。",
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
      "単発の副作用には柔軟に使える。",
      "追加ライブラリや Router への依存なしで書ける。",
      "重要度の低いバックグラウンド処理なら許容できる場合がある。",
    ],
    limitations: [
      "race condition を避けるには AbortController などを手動で扱う必要がある。",
      "Strict Mode の開発時挙動で、重複リクエスト前提の弱さが露出しやすい。",
      "キャッシュ、dedupe、再検証ポリシーがデフォルトでは存在しない。",
      "ローディングやエラー状態がコンポーネント内に散らばりやすい。",
    ],
  },
];

export const defaultSettings: SimulatorSettings = {
  latency: 1100,
  resourceLatencies: {
    account: 350,
    accounts: 1100,
    summary: 650,
  },
  resourceErrors: {
    account: false,
    accounts: false,
    summary: false,
  },
  error: false,
  race: false,
  strict: true,
  seed: 1,
};

const resourceUrls = {
  account: "/api/account.json",
  accounts: "/api/accounts.json",
  summary: "/api/summary.json",
} as const;

export const resourceSpecs = [
  { key: "account", label: "Account", path: resourceUrls.account },
  { key: "accounts", label: "Accounts", path: resourceUrls.accounts },
  { key: "summary", label: "Summary", path: resourceUrls.summary },
] satisfies Array<{ key: ResourceKey; label: string; path: string }>;

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
  const resourceDefaults =
    mode === "slow"
      ? {
          account: 850,
          accounts: 1500,
          summary: 1150,
        }
      : defaultSettings.resourceLatencies;
  const resourceLatencies = {
    account: parseResourceLatency(searchParams, "accountLatency", resourceDefaults.account),
    accounts: parseResourceLatency(searchParams, "accountsLatency", resourceDefaults.accounts),
    summary: parseResourceLatency(searchParams, "summaryLatency", resourceDefaults.summary),
  };
  const allResourcesError = searchParams.get("error") === "1" || mode === "error";
  const resourceErrors = {
    account: parseResourceError(searchParams, "accountError", allResourcesError),
    accounts: parseResourceError(searchParams, "accountsError", allResourcesError),
    summary: parseResourceError(searchParams, "summaryError", allResourcesError),
  };

  return {
    latency: maxResourceLatency(resourceLatencies),
    resourceLatencies,
    resourceErrors,
    error: hasResourceError(resourceErrors),
    race: searchParams.get("race") === "1" || mode === "race",
    strict: true,
    seed: Number(searchParams.get("seed") ?? defaultSettings.seed),
  };
}

export function settingsToSearch(settings: SimulatorSettings) {
  const next = new URLSearchParams();
  next.set("accountLatency", String(settings.resourceLatencies.account));
  next.set("accountsLatency", String(settings.resourceLatencies.accounts));
  next.set("summaryLatency", String(settings.resourceLatencies.summary));
  if (settings.resourceErrors.account) next.set("accountError", "1");
  if (settings.resourceErrors.accounts) next.set("accountsError", "1");
  if (settings.resourceErrors.summary) next.set("summaryError", "1");
  next.set("seed", String(settings.seed));
  if (settings.race) next.set("race", "1");
  return next;
}

export async function fetchAccountDashboard(
  strategyId: StrategyId,
  settings: SimulatorSettings,
  signal?: AbortSignal,
) {
  const [account, accounts, summary] = await Promise.all([
    fetchAccountResource(strategyId, settings, signal),
    fetchAccountsResource(strategyId, settings, signal),
    fetchSummaryResource(strategyId, settings, signal),
  ]);

  return composeDashboardPayload({ account, accounts, summary }, strategyId, settings);
}

export function fetchAccountResource(
  _strategyId: StrategyId,
  settings: SimulatorSettings,
  signal?: AbortSignal,
) {
  return fetchResource<Account>("account", settings, signal);
}

export function fetchAccountsResource(
  _strategyId: StrategyId,
  settings: SimulatorSettings,
  signal?: AbortSignal,
) {
  return fetchResource<Account[]>("accounts", settings, signal);
}

export function fetchSummaryResource(
  _strategyId: StrategyId,
  settings: SimulatorSettings,
  signal?: AbortSignal,
) {
  return fetchResource<DashboardSummary>("summary", settings, signal);
}

export function makePayload(strategyId: StrategyId, settings: SimulatorSettings): DashboardPayload {
  return composeDashboardPayload(
    {
      account: baseAccounts[0],
      accounts: baseAccounts,
      summary: {
        users: 128,
        projects: 24,
        requests: 2431,
        errorRate: 0.18,
      },
    },
    strategyId,
    settings,
  );
}

export function composeDashboardPayload(
  resources: DashboardResources,
  strategyId: StrategyId,
  settings: SimulatorSettings,
): DashboardPayload {
  const { account, accounts, summary } = resources;
  const logs = makeLogs(strategyId, settings);

  return {
    account: composeAccount(account, settings),
    accounts: composeAccounts(accounts, settings),
    logs,
    generatedAt: generatedTime(),
    summary: composeSummary(summary, settings),
  };
}

export function composeAccount(account: Account, settings: SimulatorSettings): Account {
  return {
    ...account,
    requests: account.requests + settings.seed * 7,
    mrr: account.mrr + settings.seed * 120,
  };
}

export function composeAccounts(accounts: Account[], settings: SimulatorSettings): Account[] {
  return accounts.map((item, index) => ({
    ...item,
    requests: item.requests + settings.seed * (index + 2),
    mrr: item.mrr + settings.seed * (index + 1) * 40,
  }));
}

export function composeSummary(
  summary: DashboardSummary,
  settings: SimulatorSettings,
): DashboardSummary {
  return {
    users: summary.users + settings.seed,
    projects: summary.projects + (settings.seed % 4),
    requests: summary.requests + settings.seed * 7,
    errorRate: settings.resourceErrors.summary ? 3.8 : summary.errorRate + settings.seed * 0.01,
  };
}

export function generatedTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

async function fetchResource<T>(
  resource: ResourceKey,
  settings: SimulatorSettings,
  signal?: AbortSignal,
): Promise<T> {
  const url = resourceUrls[resource];

  await wait(settings.resourceLatencies[resource], signal);

  if (settings.resourceErrors[resource]) {
    throw new Error(`Simulated 500 response from ${url}`);
  }

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Unexpected ${response.status} response from ${url}`);
  }

  return (await response.json()) as T;
}

function makeLogs(strategyId: StrategyId, settings: SimulatorSettings): RequestLog[] {
  const strategy = getStrategy(strategyId);
  const duplicateCount =
    strategyId === "use-effect" && settings.strict ? 3 : strategy.duplicateRequests;
  const rows = [
    strategy.label,
    "Jotai async atom",
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

function parseResourceLatency(searchParams: URLSearchParams, key: string, fallback: number) {
  return clamp(Number(searchParams.get(key) ?? searchParams.get("latency") ?? fallback), 0, 2000);
}

function parseResourceError(searchParams: URLSearchParams, key: string, fallback: boolean) {
  const value = searchParams.get(key);
  if (value === null) return fallback;
  return value === "1";
}

function hasResourceError(resourceErrors: ResourceErrors) {
  return resourceErrors.account || resourceErrors.accounts || resourceErrors.summary;
}

function maxResourceLatency(resourceLatencies: ResourceLatencies) {
  return Math.max(resourceLatencies.account, resourceLatencies.accounts, resourceLatencies.summary);
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
