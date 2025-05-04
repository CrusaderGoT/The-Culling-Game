"use client";

import circleClasses from "@/styles/colony-circle.module.css";
import { AspectRatio, Button, Flex, Stack, Text, Title } from "@mantine/core";

export function ColonyCircle() {
    return (
        <Flex className={`${circleClasses.colonyContainer}`}>
            <AspectRatio
                ratio={1}
                h={{ base: 300, md: 400, lg: 500 }}
                w={{ base: 300, md: 400, lg: 500 }}
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
