import { LiveMatch } from "@/components/match/live-match";
import { Container } from "@mantine/core";

import { mockMatch, mockPlayers } from "@/lib/constants/mockData";

import { verifySession } from "@/lib/auth/dal";

export default async function MatchPage() {
    await verifySession();

    return (
        <Container size={"xl"}>
            <LiveMatch players={mockPlayers} match={mockMatch} />
        </Container>
    );
}
