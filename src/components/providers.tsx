"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // PERF: Increased staleTime to 5 minutes to reduce unnecessary refetches
            // Most NBA data doesn't change every minute (except live scores, which have their own refetchInterval)
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000, // PERF: Increased garbage collection time to 30 minutes for better cache retention
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 4xx (except 429 rate limit)
              if (error instanceof Error && error.message.includes("429")) {
                return failureCount < 5;
              }
              if (error instanceof Error && error.message.match(/4\d\d/)) {
                return false;
              }
              return failureCount < 3;
            },
            retryDelay: (attempt, error) => {
              // Longer backoff for rate limits
              if (error instanceof Error && error.message.includes("429")) {
                return Math.min(5000 * 2 ** attempt, 60000);
              }
              return Math.min(1000 * 2 ** attempt, 10000);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
