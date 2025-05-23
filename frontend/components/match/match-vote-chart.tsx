import { BarChart } from "@mantine/charts";

type MatchVoteChartProp = {};
export function MatchVoteChart() {
    const data = [
        { player: "Ethan", Smartphones: 1200, Laptops: 900, Tablets: 700 },
        { player: "Nahte", Dullphones: 1500, Mobile: 1200, Pills: 400 },
    ];

    return (
        <BarChart
            type="stacked"
            orientation="vertical"
            h={300}
            data={data}
            dataKey="player"
            series={[
                { name: "Smartphones", color: "violet.6" },
                { name: "Laptops", color: "blue.6" },
                { name: "Tablets", color: "teal.6" },

                { name: "Dullphones", color: "pink.6" },
                { name: "Mobile", color: "black" },
                { name: "Pills", color: "gray.6" },
            ]}
            withLegend
            legendProps={{ verticalAlign: "bottom" }}
            tickLine="x"
            gridAxis="y"
            xAxisLabel="Points"
            tooltipAnimationDuration={200}
            barChartProps={{ maxBarSize: 50 }}
        />
    );
}
