"use client";

import { UserInfo } from "@/apis/client";
import { useAuth } from "@/lib/contexts/auth-context-provider";
import { useVerifyUser } from "@/lib/hooks/users";
import { Button, Paper, Stack, Text, TextInput } from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

export function VerifyUser({ user }: { user: UserInfo }) {
    const { token } = useAuth();

    const { mutateAsync, isPending, submittedAt } = useVerifyUser(token);

    const [verificationToken, setVerificationToken] = useState<string>("");

    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isEmailWaitingTime, setIsEmailWaitingTime] =
        useState<boolean>(false);

    // Match countdown timer
    useEffect(() => {
        if (submittedAt < 1) return;

        const updateTimer = () => {
            const now = dayjs();
            const endTime = dayjs(submittedAt + 10 * 1000); // 1 minute

            if (now.isAfter(endTime) || now.isSame(endTime)) {
                setIsEmailWaitingTime(false);
                setTimeLeft("");
                return;
            }

            const diff = endTime.diff(now);
            const duration = dayjs.duration(diff);

            const days = Math.floor(duration.asDays());
            const hours = duration.hours();
            const minutes = duration.minutes();
            const seconds = duration.seconds();

            let timeString = "";

            if (days > 0) {
                timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else if (hours > 0) {
                timeString = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                timeString = `${minutes}m ${seconds}s`;
            } else {
                timeString = `${seconds}s`;
            }

            setTimeLeft(timeString);
            setIsEmailWaitingTime(true);
        };

        // Initial update
        updateTimer();

        // Set up interval to update every second
        const interval = setInterval(updateTimer, 1000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [submittedAt]);

    return (
        <Paper withBorder p={"md"}>
            <Stack>
                <Text>This user: {user.username} is not yet verified.</Text>

                <Text>
                    Click the 'send token' button below to get verification
                    token. Then enter token and click 'verify'.
                </Text>

                <TextInput
                    value={verificationToken}
                    onChange={(e) => {
                        setVerificationToken(e.currentTarget.value);
                    }}
                    placeholder="enter verification token"
                    label="Verification Token"
                />

                <Button
                    onClick={async () => {
                        await mutateAsync({
                            query: {
                                token: verificationToken,
                            },
                        });
                    }}
                    disabled={
                        (isEmailWaitingTime && !verificationToken) || isPending
                    }
                >
                    {verificationToken ? "Verify" : "Send Token"}
                </Button>
                {!verificationToken && isEmailWaitingTime && (
                    <Text>wait: {timeLeft}</Text>
                )}
            </Stack>
        </Paper>
    );
}
