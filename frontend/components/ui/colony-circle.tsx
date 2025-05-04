"use client";

import circleClasses from "@/styles/colony-circle.module.css";
import { AspectRatio, Button, Flex, Stack, Text, Title } from "@mantine/core";

export function ColonyCircle() {
    return (
        <Flex className={`${circleClasses.colonyContainer}`}>
            <AspectRatio
                ratio={1}
                h={{ base: 500, md: 600, lg: 700 }}
                w={{ base: 500, md: 600, lg: 700 }}
                className={`${circleClasses.colonyCircle}`}
            >
                <CircleContent />
            </AspectRatio>
        </Flex>
    );
}

function CircleContent() {
    return (
        <Stack justify="center" align="center">
            <Title order={2} className={`${circleClasses.colonyText}`}>
                COLONY
            </Title>

            <Text className={`${circleClasses.colonyWarning}`}>
                a dangerous game is going on inside &#x1F6C8;
            </Text>

            <Button className={`${circleClasses.colonyBtn}`}>enter</Button>
        </Stack>
    );
}
