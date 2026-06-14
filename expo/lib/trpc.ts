import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

/**
 * Resolves the backend base URL.
 *
 * IMPORTANT: this must never throw. It runs at module load (when `trpcClient`
 * is created), which happens during the import of the root layout — before the
 * React tree (and the ErrorBoundary) mounts. Throwing here crashes the whole JS
 * bundle on startup, which on a production build closes the app instantly.
 *
 * In the Rork preview `EXPO_PUBLIC_RORK_API_BASE_URL` is always defined, but a
 * standalone EAS/Play Store build only inlines env vars that are committed to a
 * `.env` or declared in `eas.json`, so we fall back to a sane default.
 */
const getBaseUrl = (): string => {
  return (
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL ??
    process.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL ??
    "https://beach-report-backend.rork.app"
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});