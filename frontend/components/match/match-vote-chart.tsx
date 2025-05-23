import { BaseCtAppInfo, BaseVoteInfo, PlayerInfo } from "@/api/client";
import { getColorFromId } from "@/lib/utils";
import { BarChart } from "@mantine/charts";

// Props
type MatchVoteChartProps = {
    players: PlayerInfo[];
    votes: BaseVoteInfo[];
};

export function MatchVoteChart({ players, votes }: MatchVoteChartProps) {
    // Derive CT apps from players
    const ctAppMap = new Map<number, BaseCtAppInfo>();
    players.forEach((player) => {
        player.cursed_technique.applications.forEach((app) => {
            ctAppMap.set(app.id, app);
        });
    });

    // Group votes by player and ct_app
    const votesByPlayer = votes.reduce((acc, vote) => {
        if (!vote.player_id) return acc;
        const playerId = vote.player_id;
        if (!acc[playerId]) acc[playerId] = {};

        if (vote.ct_app_id) {
            const ctApp = ctAppMap.get(vote.ct_app_id);
            const ctAppName = ctApp ? ctApp.name : `CT App ${vote.ct_app_id}`;
            if (!acc[playerId][ctAppName]) acc[playerId][ctAppName] = 0;
            acc[playerId][ctAppName] += vote.point;
        } else {
            if (!acc[playerId]["Direct Votes"])
                acc[playerId]["Direct Votes"] = 0;
            acc[playerId]["Direct Votes"] += vote.point;
        }

        return acc;
    }, {} as Record<number, Record<string, number>>);

    // Convert to chart data format
    const data = players
        .map((player) => {
            const playerVotes = votesByPlayer[player.id] || {};
            return {
                player: player.name,
                ...playerVotes,
            };
        })
        .filter((playerData) => {
            const { player, ...voteData } = playerData;
            return Object.keys(voteData).length > 0;
        });

    // Get all unique CT app names for series
    const allCtAppNames = new Set<string>();
    Object.values(votesByPlayer).forEach((playerVotes) => {
        Object.keys(playerVotes).forEach((ctAppName) => {
            allCtAppNames.add(ctAppName);
        });
    });

    // Map ctAppName to appId for color generation
    const nameToAppId = new Map<string, number>();
    ctAppMap.forEach((app) => {
        nameToAppId.set(app.name, app.id);
    });
    nameToAppId.set("Direct Votes", -1); // Assign special ID for direct votes

    const series = Array.from(allCtAppNames).map((ctAppName) => {
        const appId = nameToAppId.get(ctAppName);
        return {
            name: ctAppName,
            color: getColorFromId(
                appId !== undefined ? appId : ctAppName.length
            ),
        };
    });

    if (data.length === 0) {
        return <div>No votes to display.</div>;
    }

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
            xAxisLabel="Vote Points"
            tooltipAnimationDuration={200}
            barChartProps={{ maxBarSize: 50 }}
        />
    );
}
