// auth/auth-provider.tsx
"use client";

import { createContext, ReactNode } from "react";

export const AuthContext = createContext<string>("");

export function AuthProvider({
    token,
    children,
}: {
    token: string;
    children: ReactNode;
}) {
    return (
        <AuthContext.Provider value={token}>{children}</AuthContext.Provider>
    );
}
