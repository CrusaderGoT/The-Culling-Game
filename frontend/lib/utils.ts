import { BaseCtAppInfo, PlayerInfo } from "@/api/client";
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

export function getCtAppMap(players: PlayerInfo[]): Map<number, BaseCtAppInfo> {
    const ctAppMap = new Map<number, BaseCtAppInfo>();
    players.forEach((player) => {
        player.cursed_technique.applications.forEach((app) => {
            ctAppMap.set(app.id, app);
        });
    });
    return ctAppMap;
}
export function calculateCtAppPoints(player: PlayerInfo) {
    const ctAppPointsMap = new Map<
        number,
        { name: string; value: number; color: string; key: number }
    >();

    // Derive CT apps from player
    const ctAppMap = getCtAppMap([player]);

    // Initialize all ctapps with value 0
    ctAppMap.forEach((ctApp) => {
        ctAppPointsMap.set(ctApp.id, {
            name: ctApp.name,
            value: 0.0,
            color: getColorFromId(ctApp.number),
            key: ctApp.id,
        });
    });

    player.votes.forEach((vote) => {
        const ctAppId = vote.ct_app_id;
        const ctAppPoints = ctAppPointsMap.get(ctAppId);
        if (ctAppPoints) {
            ctAppPoints.value += vote.point;
        } else {
            // In case vote references a ctapp not in ctAppMap
            ctAppPointsMap.set(ctAppId, {
                name: `Application ID ${ctAppId}`,
                value: vote.point,
                color: getColorFromId(ctAppId),
                key: ctAppId,
            });
        }
    });

    const data = Array.from(ctAppPointsMap.values());
    return data;
}
