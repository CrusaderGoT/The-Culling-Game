import { MantineColor } from "@mantine/core";

export function cleanString(input: string) {
    return input.replace(/\//g, " ").replace(/-/g, " ");
}

export function getColorFromId(id: number): MantineColor {
    const colors: MantineColor[] = [
        "red",
        "cyan",
        "orange",
        "teal",
        "yellow",
        "blue",
        "lime",
        "violet",
        "green",
        "pink",
        "indigo",
        "gold",
        "grape",
        "deepred",
    ];

    const hash = Array.from(id.toString()).reduce(
        (acc, char) => acc + char.charCodeAt(0),
        0
    );
    return colors[hash % colors.length] || "gray";
}
