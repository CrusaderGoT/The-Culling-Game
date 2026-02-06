// app/(protected)/layout.tsx

import { IsOffline } from "@/components/ui/is-offline";
import { ShellHeader } from "@/components/ui/shell/shell-header";
import { ShellNavbar } from "@/components/ui/shell/shell-navbar";
import { AuthContextProvider } from "@/lib/contexts/auth-context-provider";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthContextProvider>
            <IsOffline />
            <ShellHeader />
            <ShellNavbar />
            {children}
        </AuthContextProvider>
    );
}
