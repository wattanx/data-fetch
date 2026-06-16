import { Navigate } from "react-router";

export function meta() {
  return [
    { title: "Fetch Strategy Studio" },
    {
      name: "description",
      content: "Interactive React data fetching patterns without useEffect-first architecture.",
    },
  ];
}

export default function Home() {
  return <Navigate replace to="/client-loader" />;
}
