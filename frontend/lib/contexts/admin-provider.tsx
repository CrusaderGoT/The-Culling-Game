"use client";

import { AdminInfo } from "@/api/client";
import { useAuth } from "@/lib/contexts/auth-provider";
import { useCurrentAdmin } from "@/lib/hooks/admins";
import { createContext, ReactNode, useContext, useMemo } from "react";

type AdminContextProp = {
    admin?: AdminInfo;
    isPending: boolean;
    error?: unknown;
    refresh: () => void;
};

export const AdminContext = createContext<AdminContextProp>({
    admin: undefined,
    isPending: false,
    error: undefined,
    refresh: () => {},
});

/**
 * Provides the current admin context to its children components.
 *
 * This component fetches the current admin's data using the authentication token,
 * and supplies the admin information, loading state, error, and a refresh function
 * to the context consumers via `AdminContext`.
 *
 * While the admin data is loading, it displays a loading message. If an error occurs,
 * it displays an error message. Otherwise, it renders the children components.
 *
 * Note: This provider must be used inside the `AuthProvider`, as it relies on `useAuth`
 * to access the authentication token.
 *
 * @param children - The React node(s) to be rendered within the provider.
 *
 * @returns The context provider wrapping the children, or a loading/error message.
 */
export function AdminProvider({ children }: { children: ReactNode }) {
    const { token } = useAuth();

    const { data, error, isPending, refetch } = useCurrentAdmin(token);

    // Memoize context value for efficiency
    const contextValue = useMemo(
        () => ({
            admin: data,
            isPending,
            error,
            refresh: refetch,
        }),
        [data, isPending, error, refetch]
    );

    return (
        <AdminContext.Provider value={contextValue}>
            {isPending ? (
                <div>Loading...</div>
            ) : error ? (
                <div>Failed to load admin info.</div>
            ) : (
                children
            )}
        </AdminContext.Provider>
    );
}

export function useAdminContext() {
    return useContext(AdminContext);
}
