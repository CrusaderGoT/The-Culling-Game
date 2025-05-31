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

    // Convert to chart data format
    const data: Record<string, string | number>[] = [];
    const series: { name: string; color: string }[] = [];

    players.forEach((player, index) => {
        const voteData = new Map<string, string | number>();
        const playerName = player.name.trim();

        // Handle duplicate player names
        voteData.set(
            "player",
            data.some((d) => d.player === playerName)
                ? `${playerName}-${index + 1}`
                : playerName
        );

        const playerVotes = votes.filter(
            (vote) => vote.player_id === player.id
        );

        playerVotes.forEach((vote) => {
            const ctApp = ctAppMap.get(vote.ct_app_id as number);
            if (!ctApp) return;

            let ctAppName = ctApp.name;

            // Handle duplicate CT app names
            if (data.some((d) => d.hasOwnProperty(ctAppName))) {
                ctAppName = `${ctAppName} (${voteData.get("player")})`;
            }

            // Update vote points
            const currentPoints = (voteData.get(ctAppName) as number) || 0;
            voteData.set(ctAppName, currentPoints + vote.point);

            // Add series entry if not exists
            if (!series.some((s) => s.name === ctAppName)) {
                series.push({
                    name: ctAppName,
                    color: getColorFromId(
                        (vote.ct_app_id as number) + vote.point
                    ),
                });
            }
        });

        // Add player data if they have votes
        if (voteData.size > 1) {
            data.push(Object.fromEntries(voteData));
        }
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
