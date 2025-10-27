import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import Constants from "expo-constants";
import superjson from "superjson";
import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const sanitizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const getBaseUrl = (): string | null => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL?.trim();
  if (envUrl) {
    return sanitizeBaseUrl(envUrl);
  }

  const extraUrl =
    Constants?.expoConfig?.extra?.rorkApiBaseUrl ??
    Constants?.manifest?.extra?.rorkApiBaseUrl;

  if (typeof extraUrl === "string" && extraUrl.trim().length > 0) {
    return sanitizeBaseUrl(extraUrl.trim());
  }

  return null;
};

export const createTrpcClient = () => {
  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    console.warn(
      "[tRPC] Missing API base URL. Set EXPO_PUBLIC_RORK_API_BASE_URL or expo.extra.rorkApiBaseUrl."
    );
    return null;
  }

  return trpc.createClient({
    links: [
      httpLink({
        url: `${baseUrl}/api/trpc`,
        transformer: superjson,
      }),
    ],
  });
};

export type TrpcClient = ReturnType<(typeof trpc)["createClient"]>;