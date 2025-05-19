// auth/auth-provider.tsx
"use client";

import { createContext, ReactNode, useEffect, useState } from "react";
import { verifySession } from "./session";

export const AuthContext = createContext<string>("");

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string>("");

    useEffect(() => {
        async function vT() {
            const token = await verifySession();
            setToken(token);
        }
        vT();
    }, [setToken]);

    return (
        <AuthContext.Provider value={token}>{children}</AuthContext.Provider>
    );
}
