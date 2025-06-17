// app/(protected)/layout.tsx

import { AuthProvider } from "@/lib/contexts/auth-provider";

import { Shell } from "@/components/ui/shell";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <Shell>{children}</Shell>
        </AuthProvider>
    );
}
