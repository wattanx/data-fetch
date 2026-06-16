import { FetchDashboard } from "../components/fetch-dashboard";

export function meta() {
  return [{ title: "SWR | Fetch Strategy Studio" }];
}

export default function SwrRoute() {
  return <FetchDashboard activeStrategy="swr" />;
}
