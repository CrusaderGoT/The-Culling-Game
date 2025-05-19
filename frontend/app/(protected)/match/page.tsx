import { LiveMatch } from "@/components/match/live-match";

import { mockMatch, mockPlayers } from "@/lib/constants/mockData";

export default async function MatchPage() {
    return <LiveMatch players={mockPlayers} match={mockMatch} />;
}
