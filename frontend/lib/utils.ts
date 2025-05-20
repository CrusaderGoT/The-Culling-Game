import { PlayerInfo } from "@/api/client";
import { MantineColor } from "@mantine/core";

export function cleanString(input: string) {
    return input.replace(/\//g, " ").replace(/-/g, " ");
}
export function getColorFromId(id: PlayerInfo["id"]): MantineColor {
    const colors: MantineColor[] = [
        "dark",
        "gray",
        "red",
        "pink",
        "grape",
        "violet",
        "indigo",
        "blue",
        "cyan",
        "teal",
        "green",
        "lime",
        "yellow",
        "orange",
        "gold",
        "deepred",
    ];

    const hash = Array.from(id.toString()).reduce(
        (acc, char) => acc + char.charCodeAt(0),
        0
    );
    return colors[hash % colors.length] || "gray";
}
