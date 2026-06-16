import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("client-loader", "routes/client-loader.tsx"),
  route("jotai-use", "routes/jotai-use.tsx"),
  route("swr", "routes/swr.tsx"),
  route("use-effect", "routes/use-effect.tsx"),
] satisfies RouteConfig;
