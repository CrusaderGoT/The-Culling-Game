// auth/auth-provider.tsx
"use client";

import { UserInfo } from "@/apis/client";
import {
    refreshTokenMutation,
    verifyTokenMutation,
} from "@/apis/client/@tanstack/react-query.gen";
import { getAPIErrorMessage } from "@/components/ui/display-api-error";
import { VerifyUser } from "@/components/user/verify-user";
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

    // loadedToken: raw value from cookie, not yet verified
    // realToken:   verified and ready to use site-wide
    const [loadedToken, setLoadedToken] = useState<string | undefined>(
        undefined
    );
    const [realToken, setRealToken] = useState<string | undefined>(undefined);
    const [refreshToken, setRefreshToken] = useState<string | undefined>(
        undefined
    );
    const [tokensLoaded, setTokensLoaded] = useState(false);
    const [tokenExpiresIn, setTokenExpiresIn] = useState<Date | undefined>(
        undefined
    );
    const [tokenExpired, setTokenExpired] = useState(false);

    const mountedRef = useMounted();
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Online / Offline detection ──────────────────────────────────────────
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // BUG FIX: removed `|| true` which made this check always return true
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // ─── Load tokens from cookies ─────────────────────────────────────────────
    useEffect(() => {
        let canceled = false;

        async function loadTokens() {
            try {
                const [accessToken, refreshTokenValue] = await Promise.all([
                    getClientCookie(tokenNames.access),
                    getClientCookie(tokenNames.refresh),
                ]);

                if (canceled) return;
                setLoadedToken(accessToken);
                setRefreshToken(refreshTokenValue ?? "");
            } catch (err) {
                if (canceled) return;
                console.error("Error loading tokens:", err);
            } finally {
                if (!canceled) setTokensLoaded(true);
            }
        }

        loadTokens();
        return () => {
            canceled = true;
        };
        // Only run once on mount — mountedRef is intentionally omitted because
        // re-loading tokens every time the component mounts/unmounts is undesirable.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Mutations ────────────────────────────────────────────────────────────
    const { mutateAsync: refreshTokenAsync, error: refreshError } = useMutation(
        {
            ...refreshTokenMutation(),
            onError: async (e) => {
                if (!mountedRef) return;

                await deleteSession();
                console.error("Refresh token error:", getAPIErrorMessage(e));
                notifications.show({
                    message: "Session Expired — Log In To Continue",
                    color: "yellow",
                });

                redirect(`/login?next=${encodeURIComponent(path)}`);
            },
            onSuccess: async (t) => {
                if (!mountedRef) return;

                await createSession(t);

                const expDate = new Date(Date.now() + t.expires_in);
                // Update all token state atomically to avoid inconsistent windows
                setLoadedToken(t.access_token);
                setRealToken(t.access_token);
                setRefreshToken(t.refresh_token);
                setTokenExpiresIn(expDate);
                setTokenExpired(false);
            },
        }
    );

    const { mutateAsync: verifyTokenAsync } = useMutation({
        ...verifyTokenMutation(),
        retry: (failureCount) =>
            failureCount < 2 && !!loadedToken && mountedRef,
        onError: async () => {
            setLoadedToken(undefined);

            if (refreshToken) {
                await refreshTokenAsync({
                    body: { refresh_token: refreshToken },
                });
            } else {
                redirect(`/login?next=${encodeURIComponent(path)}`);
            }
        },
    });

    // ─── Verify / refresh token on load and when token expires ───────────────
    // Use a ref to track in-flight checks so we don't add pending booleans to
    // the dependency array — that would cause the effect to re-fire each time a
    // mutation settles, creating an infinite verify loop.
    const isCheckingRef = useRef(false);

    useEffect(() => {
        if (!tokensLoaded || !isOnline) return;
        if (isCheckingRef.current) return;

        let canceled = false;
        isCheckingRef.current = true;

        async function runTokenCheck() {
            try {
                if (refreshToken && (!loadedToken || tokenExpired)) {
                    // No valid access token — get a new one via refresh
                    await refreshTokenAsync({
                        body: { refresh_token: refreshToken },
                    });
                } else if (loadedToken && !tokenExpired) {
                    const tokenData = await verifyTokenAsync({
                        body: { token: loadedToken },
                    });

                    if (canceled || !tokenData) return;

                    setRealToken(loadedToken);
                    setTokenExpiresIn(new Date(tokenData.exp));
                    setTokenExpired(false);
                }
            } catch {
                // Individual mutation onError handlers deal with redirects/refresh fallback
            } finally {
                if (!canceled) isCheckingRef.current = false;
            }
        }

        runTokenCheck();
        return () => {
            canceled = true;
            isCheckingRef.current = false;
        };
    }, [
        tokensLoaded,
        isOnline,
        loadedToken,
        refreshToken,
        tokenExpired,
        verifyTokenAsync,
        refreshTokenAsync,
    ]);

    // ─── Schedule proactive token refresh before expiry ───────────────────────
    useEffect(() => {
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);

        // Don't schedule if there's nothing to refresh against, or refresh already failed
        if (!tokenExpiresIn || !mountedRef || refreshError || !isOnline) return;

        const REFRESH_BUFFER_MS = 30_000; // refresh 30 s before expiry
        const timeUntilRefresh =
            tokenExpiresIn.getTime() - Date.now() - REFRESH_BUFFER_MS;

        if (timeUntilRefresh <= 0) {
            setTokenExpired(true);
        } else {
            refreshTimeoutRef.current = setTimeout(() => {
                if (mountedRef) setTokenExpired(true);
            }, timeUntilRefresh);
        }

        return () => {
            if (refreshTimeoutRef.current)
                clearTimeout(refreshTimeoutRef.current);
        };
    }, [tokenExpiresIn, mountedRef, refreshError, isOnline]);

    // ─── Current user ─────────────────────────────────────────────────────────
    const {
        data: user,
        isPending: isPendingUser,
        error: userError,
    } = useCurrentUser(realToken);

    const value = useMemo<ContextProp>(
        () => ({ token: realToken, isOnline, user }),
        [realToken, isOnline, user]
    );

    // `user` can be undefined while loading or on error.
    // The original `!user.is_verified` would throw in those cases.
    const showVerifyPrompt =
        !isPendingUser && !userError && user != null && !user.is_verified;

    return (
        <AuthContext.Provider value={value}>
            {showVerifyPrompt ? <VerifyUser user={user} /> : children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
