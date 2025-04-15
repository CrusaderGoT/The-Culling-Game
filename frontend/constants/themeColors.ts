import { DefaultMantineColor, MantineColorsTuple } from "@mantine/core";

export const goldColor: MantineColorsTuple = [
    "#fffce1",
    "#fff8cb",
    "#ffef9a",
    "#ffe764",
    "#ffdf38",
    "#ffdb1c",
    "#ffd809",
    "#e3bf00",
    "#caaa00",
    "#ae9200",
];

export const deepRedColor: MantineColorsTuple = [
    // https://mantine.dev/colors-generator/?color=C91A25
    "#ffeaec",
    "#fcd4d7",
    "#f4a7ac",
    "#ec777e",
    "#e64f57",
    "#e3353f",
    "#e22732",
    "#c91a25",
    "#b41220",
    "#9e0419",
];

export const charcoalColor: MantineColorsTuple = [
    "#f3f5f7",
    "#e7e7e7",
    "#cbcecf",
    "#acb3b8",
    "#929ca4",
    "#808e98",
    "#778793",
    "#647580",
    "#576873",
    "#465a67",
];

type ExtendedCustomColors = "gold" | "deepred" | "charcoal" | DefaultMantineColor;

declare module "@mantine/core" {
    export interface MantineThemeColorsOverride {
        colors: Record<ExtendedCustomColors, MantineColorsTuple>;
    }
}
