// app/admin/layout.tsx

import { AdminContextProvider } from "@/lib/contexts/admin-context-provider";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminContextProvider>{children}</AdminContextProvider>;
}
