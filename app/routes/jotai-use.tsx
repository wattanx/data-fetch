import { FetchDashboard } from "../components/fetch-dashboard";

export function meta() {
  return [{ title: "Jotai async atom | Fetch Strategy Studio" }];
}

export default function JotaiUseRoute() {
  return <FetchDashboard activeStrategy="jotai-use" />;
}
