// app/admin/layout.tsx

import { AdminProvider } from "@/lib/contexts/admin-provider";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminProvider>{children}</AdminProvider>;
}
