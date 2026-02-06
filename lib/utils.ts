import {
    AdminInfo,
    BaseAdminInfo,
    BaseCtAppInfo,
    ModelName,
    PermissionLevel,
    PlayerInfo,
} from "@/api/client";
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
            Number((ctAppPoints.value += vote.point).toFixed(1));
        } else {
            // In case vote references a ctapp not in ctAppMap
            ctAppPointsMap.set(ctAppId, {
                name: `Application ID ${ctAppId}`,
                value: Number(vote.point.toFixed(1)),
                color: getColorFromId(ctAppId),
                key: ctAppId,
            });
        }
    });

    const data = Array.from(ctAppPointsMap.values());
    return data;
}
/**
 * Checks if the given admin has all specified permission levels for a particular model.
 *
 * @param admin - The admin user whose permissions are being checked.
 * @param model - The name of the model to check permissions against.
 * @param levels - An array of required permission levels to verify. [1=CREATE, 2=READ, 3=UPDATE, 4=DELETE]
 * @returns `true` if the admin has all specified permission levels for the model, otherwise `false`.
 */
export function checkAdminPermission(
    admin: AdminInfo | BaseAdminInfo,
    model: ModelName,
    levels: PermissionLevel[]
) {
    return levels.every((level) =>
        admin.permissions.some(
            (perm) => perm.model === model && perm.level === level
        )
    );
}
