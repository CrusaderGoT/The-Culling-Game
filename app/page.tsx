import { LiveMatch } from "@/components/match/live-match";
import { Container } from "@mantine/core";

import { mockMatch, mockPlayers } from "@/constants/mockData";

export default async function HomePage() {
    return (
        <Container size={"xl"}>
            <LiveMatch players={mockPlayers} match={mockMatch} />
        </Container>
    );
}
