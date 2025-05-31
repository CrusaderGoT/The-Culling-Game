// auth/auth-provider.tsx
"use client";
import {
    refreshTokenMutation,
    verifyTokenOptions,
} from "@/api/client/@tanstack/react-query.gen";
import {
    createSession,
    deleteSession,
    getClientCookie,
} from "@/lib/auth/session";
import { tokenNames } from "@/lib/constants/AUTHCONSTANTS";
import { useMounted } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { redirect, usePathname } from "next/navigation";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

export const AuthContext = createContext<string>("");

export function AuthProvider({ children }: { children: ReactNode }) {
    const path = usePathname() || "/match";
    const [token, setToken] = useState<string>("");
    const [refreshToken, setRefreshToken] = useState<string>("");
    const [tokensLoaded, setTokensLoaded] = useState(false);
    const mountedRef = useMounted();

    // Load both tokens in a single useEffect
    useEffect(() => {
        let canceled = false;

        async function loadTokens() {
            try {
                const [accessToken, refreshTokenValue] = await Promise.all([
                    getClientCookie(tokenNames.access),
                    getClientCookie(tokenNames.refresh),
                ]);

                if (!canceled && mountedRef) {
                    setToken(accessToken || "");
                    setRefreshToken(refreshTokenValue || "");
                    setTokensLoaded(true);
                }
            } catch (err) {
                if (!canceled && mountedRef) {
                    console.error("Error loading tokens:", err);
                    setTokensLoaded(true); // Still mark as loaded to prevent infinite loading
                }
            }
        }

        loadTokens();

        return () => {
            canceled = true;
        };
    }, [mountedRef]);

    // Always run verify query when tokens are loaded (even with empty token)
    const { isError, isLoading } = useQuery({
        ...verifyTokenOptions({ body: { token: token } }),
        enabled: tokensLoaded, // Run as soon as tokens are loaded
        refetchInterval: token ? 13 * 60 * 1000 : false, // Only auto-refresh if we have a token
        retry: (failureCount) => {
            if (failureCount < 2 && !!token && mountedRef) return true;
            return false;
        },
    });

    const { isPending: isRefreshing, mutate } = useMutation({
        ...refreshTokenMutation(),
        onError: async (e) => {
            if (!mountedRef) return;

            await deleteSession();
            console.error("Refresh token error:", e);
            notifications.show({
                message: "Session Expired Log In To Continue",
                color: "yellow",
            });
            redirect(`/login?next=${encodeURIComponent(path)}`);
        },
        onSuccess: async (t) => {
            if (!mountedRef) return;

            await createSession(t);
            setToken(t.access_token);
            setRefreshToken(t.refresh_token);
        },
    });

    // Refresh logic - handle both error states and missing token scenarios
    useEffect(() => {
        if (!tokensLoaded || isRefreshing || !mountedRef) return;

        // Scenario 1: Verify failed and we have refresh token
        // Scenario 2: No access token but we have refresh token (token removed from session)
        const shouldRefresh =
            refreshToken && ((isError && !isLoading) || (!token && !isLoading));

        if (shouldRefresh) {
            mutate({
                body: { refresh_token: refreshToken },
            });
        }
    }, [
        isError,
        refreshToken,
        isRefreshing,
        isLoading,
        mutate,
        tokensLoaded,
        token,
        mountedRef,
    ]);

    // Redirect logic - improved to handle all no-auth scenarios
    useEffect(() => {
        if (!tokensLoaded) return; // Wait for tokens to load

        const hasNoTokens = !token && !refreshToken;
        const hasFailedAuth = isError && !refreshToken && !isRefreshing;

        if ((hasNoTokens || hasFailedAuth) && mountedRef) {
            redirect(`/login?next=${encodeURIComponent(path)}`);
        }
    }, [
        tokensLoaded,
        token,
        refreshToken,
        isError,
        isRefreshing,
        path,
        mountedRef,
    ]);

    return (
        <AuthContext.Provider value={token}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
