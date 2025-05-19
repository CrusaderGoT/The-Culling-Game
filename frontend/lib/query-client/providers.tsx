"use client";

import { getQueryClient } from "@/lib/query-client/get-query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";

export default function TanstackProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    const queryClient = getQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools />
        </QueryClientProvider>
    );
}
