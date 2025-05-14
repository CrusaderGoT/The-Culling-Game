import { LiveMatch } from "@/components/match/live-match";
import { Container } from "@mantine/core";

import { mockMatch, mockPlayers } from "@/lib/constants/mockData";

// Remove verifySession import and call from here

export default function MatchPage() {
    // Session verification should be handled in middleware or a server action

    return (
        <Container size={"xl"}>
            <LiveMatch players={mockPlayers} match={mockMatch} />
        </Container>
    );
}
