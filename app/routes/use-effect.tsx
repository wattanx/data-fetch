import { FetchDashboard } from "../components/fetch-dashboard";

export function meta() {
  return [{ title: "useEffect baseline | Fetch Strategy Studio" }];
}

export default function UseEffectRoute() {
  return <FetchDashboard activeStrategy="use-effect" />;
}
