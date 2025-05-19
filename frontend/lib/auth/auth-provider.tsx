// auth/auth-provider.tsx
"use client";

import { createContext, ReactNode, useContext } from "react";

import { verifySession } from "@/lib/auth/session";

import queryClient from "@/constants/queryClient";
import { useQuery } from "@tanstack/react-query";

import { usePathname, useRouter } from "next/navigation";

export const AuthContext = createContext<string>("");

export function AuthProvider({ children }: { children: ReactNode }) {
    const path = usePathname() || "/match";

    const router = useRouter();

    const redirectToRefresh = () => {
        router.push(`/api/auth/refresh?next=${encodeURIComponent(path)}`);
    };

    const { data: token = "" } = useQuery({
        queryKey: ["auth-token"],
        queryFn: async () => {
            try {
                const t = await verifySession();
                if (!t) {
                    console.error(
                        `No Verified Token\nContext: AuthProvider\npath: ${path}`
                    );
                    redirectToRefresh();
                    throw new Error("No Verified Token");
                }
                return t;
            } catch (e) {
                console.error(
                    `Error during await of verifySession\nContext: AuthProvider\npath: ${path}\n${e}`
                );
                redirectToRefresh();
            }
        },
        // refresh every 13 mins
        // The interval is set to 13 minutes because tokens typically expire after 15 minutes.
        // This ensures the token is refreshed slightly before expiration to avoid authentication issues.
        refetchInterval: 13 * 60 * 1000,
    });

    return (
        <AuthContext.Provider value={token}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export function useRefreshAuth() {
    return () => {
        return queryClient.invalidateQueries({ queryKey: ["auth-token"] });
    };
}
