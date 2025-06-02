"use client";

import globalClasses from "@/styles/global.module.css";
import classes from "@/styles/mode-toggle.module.css";
import {
    ActionIcon,
    useComputedColorScheme,
    useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import cx from "clsx";

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
            color="dark"
            aria-label="Toggle color scheme"
            className={cx(
                globalClasses.stickyTop,
                globalClasses.highZ
            )}
            style={{ top: "10px" }}
        >
            <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
            <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
        </ActionIcon>
    );
}
