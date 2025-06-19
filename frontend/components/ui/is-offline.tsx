"use client";

import { useAuth } from "@/lib/contexts/auth-provider";
import gstyles from "@/styles/global.module.css";
import { Alert, Center } from "@mantine/core";
import { IconNetworkOff } from "@tabler/icons-react";
import clsx from "clsx";

export function IsOffline() {
    const { isOnline } = useAuth();

    if (isOnline) {
        return null;
    }

    return (
        <Center className={clsx(gstyles.offline)}>
            <Alert
                title="You are Offline"
                icon={<IconNetworkOff />}
                color="red.9"
            />
        </Center>
    );
}
