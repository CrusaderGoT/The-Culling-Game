// auth/auth-provider.tsx
"use client";

import { UserInfo } from "@/api/client";
import {
    refreshTokenMutation,
    verifyTokenOptions,
} from "@/api/client/@tanstack/react-query.gen";
import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { tokenNames } from "@/lib/constants/AUTHCONSTANTS";
import { useCurrentUser } from "@/lib/hooks/users";
import { createSession, deleteSession, getClientCookie } from "@/lib/session";
import { useMounted } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { redirect, usePathname } from "next/navigation";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

type ContextProp = {
    token: string;
    isOnline: boolean;
    user: {
        userInfo?: UserInfo;
        isPendingUser: boolean;
    };
};

export const AuthContext = createContext<ContextProp>({
    token: "",
    isOnline: false,
    user: {
        isPendingUser: true,
    },
});

export function AuthContextProvider({ children }: { children: ReactNode }) {
    const path = usePathname() || "/match";
    const [token, setToken] = useState<string>("");
    const [refreshToken, setRefreshToken] = useState<string>("");
    const [tokensLoaded, setTokensLoaded] = useState(false);
    const [tokenExpiresIn, setTokenExpiresIn] = useState<Date>();
    const [tokenExpired, setTokenExpired] = useState(false);
    const mountedRef = useMounted();
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Initial check
        setIsOnline(navigator.onLine || true);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

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
    const {
        isError,
        isLoading,
        data: tokenData,
    } = useQuery({
        ...verifyTokenOptions({ body: { token: token } }),
        enabled: tokensLoaded && isOnline,
        retry: (failureCount) => {
            return failureCount < 2 && !!token && mountedRef;
        },
    });

    const {
        isPending: isRefreshing,
        mutateAsync,
        error: refreshError,
    } = useMutation({
        ...refreshTokenMutation(),
        onError: async (e) => {
            if (!mountedRef) return;

            await deleteSession();

            console.log("Refresh token error:", getAPIErrorMessage(e));

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

            // Handle expiration - t.expires_in is in milliseconds
            const expiresAt = Date.now() + t.expires_in;
            const expDate = new Date(expiresAt);
            setTokenExpiresIn(expDate);
            setTokenExpired(false); // Reset expired state
        },
        retry: false, // one fail -> session is deleted
    });

    const { data: user, isPending: userIsPending } = useCurrentUser(
        token,
        isError
    );

    // Set token expires after successful token verification
    useEffect(() => {
        if (tokenData) {
            // tokenData.exp is a date time
            const expDate = new Date(tokenData.exp);
            setTokenExpiresIn(expDate);
            setTokenExpired(false); // Reset expired state
        }
    }, [tokenData]);

    // Timer-based expiration tracking
    useEffect(() => {
        // Clear existing timeout
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        if (!tokenExpiresIn || !mountedRef || refreshError || !isOnline) return;

        const REFRESH_BUFFER_MS = 30000; // 30 seconds before expiration
        const now = Date.now();
        const timeUntilRefresh =
            tokenExpiresIn.getTime() - now - REFRESH_BUFFER_MS;

        if (timeUntilRefresh <= 0) {
            // Token is already expired or should be refreshed now
            setTokenExpired(true);
        } else {
            // Set timer to mark token as expired at the right time
            refreshTimeoutRef.current = setTimeout(() => {
                if (mountedRef) {
                    setTokenExpired(true);
                }
            }, timeUntilRefresh);
        }

        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [tokenExpiresIn, mountedRef, refreshError, isOnline]);

    // Simplified refresh logic
    useEffect(() => {
        if (!tokensLoaded || isRefreshing || !mountedRef) return;

        // Scenario 1: Verify failed and we have refresh token
        // Scenario 2: No access token but we have refresh token (token removed from session)
        // Scenario 3: Token has expired
        const shouldRefresh =
            refreshToken &&
            !refreshError && // this prevents loop when fail
            isOnline &&
            ((isError && !isLoading) || (!token && !isLoading) || tokenExpired);

        if (shouldRefresh) {
            async function refreshTokenAsyncMutate() {
                const rt = await mutateAsync({
                    body: { refresh_token: refreshToken },
                });
            }
            refreshTokenAsyncMutate();
        }
    }, [
        isError,
        refreshToken,
        refreshError,
        isRefreshing,
        isLoading,
        mutateAsync,
        tokensLoaded,
        token,
        mountedRef,
        tokenExpired,
        isOnline,
        path,
    ]);

    // Redirect logic
    useEffect(() => {
        if (!tokensLoaded) return;

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

    const value = useMemo<ContextProp>(() => {
        return {
            token: token,
            isOnline: isOnline,
            user: {
                userInfo: user,
                isPendingUser: userIsPending,
            },
        };
    }, [token, isOnline, user, userIsPending]);

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
