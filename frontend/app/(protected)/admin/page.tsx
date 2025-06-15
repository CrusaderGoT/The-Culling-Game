"use client"; // remove later

import { useAdminContext } from "@/lib/contexts/admin-provider";

export default function AdminHomePage() {
    const { admin } = useAdminContext();

    return <div>Admin Dash {JSON.stringify(admin)}</div>;
}
