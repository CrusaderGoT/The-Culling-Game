// app/(protected)/layout.tsx

import { IsOffline } from "@/components/ui/is-offline";
import { ShellHeader } from "@/components/ui/shell/shell-header";
import { ShellNavbar } from "@/components/ui/shell/shell-navbar";
import { AuthProvider } from "@/lib/contexts/auth-provider";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <IsOffline />
            <ShellHeader />
            <ShellNavbar />
            {children}
        </AuthProvider>
    );
}
