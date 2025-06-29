"use client";

import { BaseVoteInfo, PlayerInfo } from "@/api/client";
import { getColorFromId, getCtAppMap } from "@/lib/utils";
import { BarChart } from "@mantine/charts";
import { Tooltip } from "@mantine/core";

// Props
type MatchVoteChartProps = {
    players: PlayerInfo[];
    votes: BaseVoteInfo[];
};

export function MatchVoteChart({ players, votes }: MatchVoteChartProps) {
    // Derive CT apps from players
    const ctAppMap = getCtAppMap(players);

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
            const ctApp = ctAppMap.get(vote.ct_app_id);
            if (!ctApp) return;

            let ctAppName = ctApp.name;

            // Handle duplicate CT app names
            if (data.some((d) => d.hasOwnProperty(ctAppName))) {
                ctAppName = `${ctAppName} (${voteData.get("player")})`;
            }

            // Update vote points
            const currentPoints = Number(voteData.get(ctAppName)) || 0;
            voteData.set(ctAppName, (currentPoints + vote.point).toFixed(1));

            // Add series entry if not exists
            if (!series.some((s) => s.name === ctAppName)) {
                series.push({
                    name: ctAppName,
                    color: getColorFromId(vote.ct_app_id),
                });
            }
        });

        // Add player data if they have votes
        if (voteData.size > 1) {
            data.push(Object.fromEntries(voteData));
        }
    });

    // A helper function to truncate long strings
    const truncateLabel = (label: string, maxLength: number = 6): string => {
        return label.length > maxLength
            ? `${label.slice(0, maxLength)}...`
            : label;
    };

    // Custom Y-axis tick renderer using SVG <text>
    const renderCustomYAxisTick = ({
        x,
        y,
        payload,
        index,
    }: {
        x?: number;
        y?: number;
        payload: { value: string };
        index: number;
    }) => {
        return (
            <Tooltip label={payload.value}>
                <text
                    x={x}
                    y={y}
                    fontSize="12"
                    textAnchor="end"
                    fill={getColorFromId(index)}
                >
                    {truncateLabel(payload.value)}
                </text>
            </Tooltip>
        );
    };

    return (
        <BarChart
            type="stacked"
            orientation="vertical"
            h={300}
            data={data}
            dataKey="player"
            series={series}
            withLegend
            legendProps={{
                verticalAlign: "bottom",
                layout: "vertical",
            }}
            tickLine="x"
            gridAxis="y"
            xAxisLabel="Vote Points"
            tooltipAnimationDuration={200}
            barChartProps={{ maxBarSize: 50 }}
            xAxisProps={{
                domain([_, dataMax]) {
                    return [0, Number(dataMax.toFixed(1))];
                },
            }}
            yAxisProps={{
                type: "category",
                tick: renderCustomYAxisTick,
            }}
        />
    );
}
