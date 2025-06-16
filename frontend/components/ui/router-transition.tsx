"use client";

import { NavigationProgress, nprogress } from "@mantine/nprogress";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function RouterTransition() {
    const pathname = usePathname();
    const prevPath = useRef(pathname);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (prevPath.current !== pathname) {
            nprogress.start();

            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Complete after a delay or when page is ready
            timeoutRef.current = setTimeout(() => {
                nprogress.complete();
            }, 500);

            prevPath.current = pathname;
        }

        // Cleanup on unmount
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [pathname]);

    return <NavigationProgress />;
}
