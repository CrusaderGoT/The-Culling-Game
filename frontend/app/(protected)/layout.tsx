// app/(protected)/layout.tsx

import { AuthProvider } from "@/lib/auth/auth-provider";

import { MainContainer } from "@/components/ui/container";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <MainContainer>{children}</MainContainer>
        </AuthProvider>
    );
}
