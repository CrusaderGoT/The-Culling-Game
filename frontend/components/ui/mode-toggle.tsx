"use client";

import gstyles from "@/styles/global.module.css";
import styles from "@/styles/mode-toggle.module.css";
import {
    ActionIcon,
    useComputedColorScheme,
    useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import clsx from "clsx";

export function ModeToggle() {
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme("light", {
        getInitialValueInEffect: true,
    });

    return (
        <ActionIcon
            onClick={() =>
                setColorScheme(
                    computedColorScheme === "light" ? "dark" : "light"
                )
            }
            variant="subtle"
            radius={"xl"}
            size="md"
            color="charcoal"
            aria-label="Toggle color scheme"
            className={clsx(gstyles.stickyTop, gstyles.highZ)}
        >
            <IconSun
                className={clsx(styles.icon, styles.light)}
                stroke={1.5}
            />
            <IconMoon
                className={clsx(styles.icon, styles.dark)}
                stroke={1.5}
            />
        </ActionIcon>
    );
}
