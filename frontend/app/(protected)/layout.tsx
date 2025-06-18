// app/(protected)/layout.tsx

import { AuthProvider } from "@/lib/contexts/auth-provider";


export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthProvider>{children}</AuthProvider>;
}
