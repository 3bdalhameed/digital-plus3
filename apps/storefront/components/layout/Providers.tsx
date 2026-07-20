"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { CartToast } from "@/components/layout/CartToast";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* Global cart-added toast. Mounted once at root so every
            addItem across the app triggers the same slide-in
            regardless of which surface fired it. */}
        <CartToast />
      </QueryClientProvider>
    </SessionProvider>
  );
}
