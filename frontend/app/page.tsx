import { LiveMatch } from "@/components/match/live-match";
import { Container } from "@mantine/core";

export default async function HomePage() {
    return (
        <Container size={"xl"}>
            <LiveMatch />
        </Container>
    );
}
