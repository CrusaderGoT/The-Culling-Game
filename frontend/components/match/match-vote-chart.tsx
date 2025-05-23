import { BaseVoteInfo, PlayerInfo } from "@/api/client";
import { getColorFromId } from "@/lib/utils";
import { BarChart } from "@mantine/charts";

// Props type
type MatchVoteChartProps = {
    players: PlayerInfo[];
    votes: BaseVoteInfo[];
};

export function MatchVoteChart({ players, votes }: MatchVoteChartProps) {
    // 1. Build a lookup for CT App names and IDs
    const ctAppMap = new Map<number, { name: string; id: number }>();
    players.forEach((player) => {
        player.cursed_technique?.applications?.forEach((app) => {
            ctAppMap.set(app.id, { name: app.name, id: app.id });
        });
    });

    // 2. Fold votes into per-player buckets
    const data = players.map((player) => {
        const row: Record<string, number | string> = {
            player: player.name,
        };

        votes
            .filter((v) => v.player_id === player.id)
            .forEach((v) => {
                const app = v.ct_app_id ? ctAppMap.get(v.ct_app_id) : null;
                const key = app ? app.name : "Other";
                row[key] = Number(row[key] || 0) + v.point;
            });

        return row;
    });

    // 3. Gather all dynamic keys (everything except 'player')
    const keys = Array.from(
        data.reduce<Set<string>>((set, row) => {
            Object.keys(row).forEach((k) => {
                if (k !== "player") set.add(k);
            });
            return set;
        }, new Set())
    );

    if (keys.length === 0) {
        return <div>No votes available for the selected players.</div>;
    }

    // 4. Generate Mantine-compliant series with colors from app.id
    const nameToAppId = new Map<string, number>();
    ctAppMap.forEach((value) => {
        nameToAppId.set(value.name, value.id);
    });

    const series = keys.map((key) => {
        const appId = nameToAppId.get(key);
        let color: string;

        if (appId !== undefined) {
            color = getColorFromId(appId);
        } else {
            // For "Other" category or unknown keys, use a fallback
            const fallbackColor = getColorFromId(key.length);
            color = fallbackColor || "#cccccc";
        }

        return { name: key, color };
    });

    return (
        <BarChart
            type="stacked"
            orientation="vertical"
            h={300}
            data={data}
            dataKey="player"
            series={series}
            withLegend
            legendProps={{ verticalAlign: "bottom" }}
            tickLine="x"
            gridAxis="y"
            xAxisLabel="Points"
        />
    );
}
