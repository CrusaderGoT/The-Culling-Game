// auth/auth-provider.tsx
"use client";

import { UserInfo } from "@/api/client";
import {
    refreshTokenMutation,
    verifyTokenMutation,
} from "@/api/client/@tanstack/react-query.gen";
import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { tokenNames } from "@/lib/constants/AUTHCONSTANTS";
import { useCurrentUser } from "@/lib/hooks/users";
import { createSession, deleteSession, getClientCookie } from "@/lib/session";
import { useMounted } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
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
    token: string | undefined;
    isOnline: boolean;
    user: UserInfo | undefined;
};

export const AuthContext = createContext<ContextProp>({
    token: undefined,
    isOnline: false,
    user: undefined,
});

export function AuthContextProvider({ children }: { children: ReactNode }) {
    const path = usePathname() || "/match";

    const [loadedToken, setLoadedToken] = useState<string | undefined>(
        undefined
    );
    const [realToken, setRealToken] = useState<string | undefined>(undefined);
    const [refreshToken, setRefreshToken] = useState<string | undefined>(
        undefined
    );
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
                    setLoadedToken(accessToken);
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

    const {
        isPending: isPendingRefreshToken,
        mutateAsync: refreshTokenAsync,
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
            setLoadedToken(t.access_token);
            setRealToken(t.access_token);
            setRefreshToken(t.refresh_token);

            // Handle expiration - t.expires_in is in milliseconds
            const expiresAt = Date.now() + t.expires_in;
            const expDate = new Date(expiresAt);
            setTokenExpiresIn(expDate);
            setTokenExpired(false); // Reset expired state
        },
    });

    const { mutateAsync: verifyTokenAsync, isPending: isPendingVerifyToken } =
        useMutation({
            ...verifyTokenMutation(),
            retry: (failureCount) => {
                return failureCount < 2 && !!loadedToken && mountedRef;
            },
            onError: async () => {
                // Remove invalid token
                setLoadedToken(undefined);

                // Refresh token if possible
                if (refreshToken) {
                    await refreshTokenAsync({
                        body: { refresh_token: refreshToken },
                    });
                } else {
                    // Redirect to login
                    redirect(`/login?next=${encodeURIComponent(path)}`);
                }
            },
        });

    // Effect for verify a token
    useEffect(() => {
        if (isPendingVerifyToken) return;

        async function verifyTokenEffect() {
            if (tokensLoaded && isOnline) {
                if (
                    refreshToken &&
                    !isPendingRefreshToken &&
                    (!loadedToken || tokenExpired)
                ) {
                    const refreshTokenValue = refreshToken;
                    await refreshTokenAsync({
                        body: { refresh_token: refreshTokenValue },
                    });
                } else if (loadedToken) {
                    const tokenData = await verifyTokenAsync({
                        body: { token: loadedToken },
                    });

                    // Set token expires after successful token verification
                    if (tokenData) {
                        setRealToken(loadedToken); // set verified token to be used site wide
                        // tokenData.exp is a date time
                        const expDate = new Date(tokenData.exp);
                        setTokenExpiresIn(expDate);
                        setTokenExpired(false); // Reset expired state
                    }
                }
            }
        }
        verifyTokenEffect();
    }, [
        tokensLoaded,
        isOnline,
        verifyTokenAsync,
        loadedToken,
        refreshToken,
        tokenExpired,
        refreshTokenAsync,
    ]);

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

    const { data: user } = useCurrentUser(realToken);

    const value = useMemo<ContextProp>(() => {
        return {
            token: realToken,
            isOnline: isOnline,
            user: user,
        };
    }, [realToken, isOnline, user]);

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
