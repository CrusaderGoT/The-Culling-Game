"use client";

import { useAuth } from "@/lib/contexts/auth-context-provider";
import { notFound } from "next/navigation";

export default function VerifyUserUIUX() {
    const { user } = useAuth();

    if (!user?.is_verified) notFound;
}
