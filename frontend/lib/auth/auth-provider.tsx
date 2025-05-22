// auth/auth-provider.tsx
"use client";

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

import { createSession, getClientCookie } from "@/lib/auth/session";
import { queryClient } from "@/lib/query-client/get-query-client";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
    refreshTokenMutation,
    verifyTokenOptions,
} from "@/api/client/@tanstack/react-query.gen";
import { tokenNames } from "@/lib/constants/AUTHCONSTANTS";
import { notifications } from "@mantine/notifications";
import { redirect, usePathname } from "next/navigation";

export const AuthContext = createContext<string>("");

export function AuthProvider({ children }: { children: ReactNode }) {
    const path = usePathname() || "/match";

    const [token, setToken] = useState<string>("");
    const [refreshToken, setRefreshToken] = useState<string>("");

    // Load both tokens in a single useEffect
    useEffect(() => {
        let canceled = false;

        async function loadTokens() {
            try {
                const [accessToken, refreshTokenValue] = await Promise.all([
                    getClientCookie(tokenNames.access),
                    getClientCookie(tokenNames.refresh),
                ]);

                if (!canceled) {
                    if (accessToken) setToken(accessToken);
                    if (refreshTokenValue) setRefreshToken(refreshTokenValue);
                }
            } catch (err) {
                if (!canceled) {
                    console.error(err);
                }
            }
        }

        loadTokens();

        return () => {
            canceled = true;
        };
    }, []);

    const { isError } = useQuery({
        ...verifyTokenOptions({ body: { token: token } }),
        refetchInterval: 13 * 60 * 1000, // refresh every 13 mins
        // retry 2 times and only if token hasn't been removed from session
        retry: (failureCount) => {
            if (failureCount < 2 && !!token) return true;
            return false;
        },
    });

    const { isPending, mutate } = useMutation({
        ...refreshTokenMutation(),
        onError: (e) => {
            console.error(e);
            notifications.show({
                message: "Session Expired Log In To Continue",
                color: "yellow",
            });
            redirect(`/login?next=${encodeURIComponent(path)}`);
        },
        onSuccess: async (t) => {
            await createSession(t);
            setToken(t.access_token);
            setRefreshToken(t.refresh_token);
        },
    });

    // refresh logic into useEffect to prevent infinite renders
    useEffect(() => {
        if (isError && refreshToken && !isPending && !token) {
            mutate({
                body: { refresh_token: refreshToken },
            });
        }
    }, [isError, refreshToken, isPending, mutate, token]);

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
