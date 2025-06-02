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
import globalClasses from "@/styles/global.module.css";
import { Alert, Center, Stack } from "@mantine/core";
import { useMounted } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconNetworkOff } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import cx from "clsx";
import { redirect, usePathname } from "next/navigation";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

export const AuthContext = createContext<string>("");

export function AuthProvider({ children }: { children: ReactNode }) {
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
        const checkOnlineStatus = async () => {
            const online =
                process.env.NODE_ENV !== "development"
                    ? navigator.onLine
                    : true;
            setIsOnline(online);
        };

        const interval = setInterval(checkOnlineStatus, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
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
        enabled: tokensLoaded,
        retry: (failureCount) => {
            return failureCount < 2 && !!token && mountedRef;
        },
    });

    const {
        isPending: isRefreshing,
        mutate,
        error: refreshError,
    } = useMutation({
        ...refreshTokenMutation(),
        onError: async (e) => {
            if (!mountedRef) return;

            await deleteSession();
            console.error("Refresh token error:", JSON.stringify(e));
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
        retry: (failureCount) => {
            return failureCount < 2;
        },
    });

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

        const REFRESH_BUFFER_MS = 5000; // 30 seconds before expiration
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
            ((isError && !isLoading) || (!token && !isLoading) || tokenExpired);

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
        tokenExpired,
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

    return (
        <AuthContext.Provider value={token}>
            <Stack>
                {!isOnline && (
                    <Center
                        className={cx(
                            globalClasses.stickyTop,
                            globalClasses.highZ
                        )}
                        style={{ top: 45 }}
                    >
                        <Alert
                            title="You are Offline"
                            icon={<IconNetworkOff />}
                            color="red.9"
                        />
                    </Center>
                )}

                {children}
            </Stack>
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
