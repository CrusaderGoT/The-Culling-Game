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
    const [sendTokenSubmittedAt, setSendTokenSubmittedAt] =
        useState(submittedAt);
    const [sentTokenSubmit, setSentTokenSubmit] = useState(false);

    // effect for updating the submitted at to use for timer
    useEffect(() => {
        if (isEmailWaitingTime || sentTokenSubmit) return;
        setSendTokenSubmittedAt(submittedAt);
    }, [submittedAt, isEmailWaitingTime, sentTokenSubmit]);

    // Match countdown timer
    useEffect(() => {
        if (sendTokenSubmittedAt < 1) return;

        const updateTimer = () => {
            const now = dayjs();
            const endTime = dayjs(sendTokenSubmittedAt + 60 * 1000); // 1 minute

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
    }, [sendTokenSubmittedAt]);

    function maskEmail(email: string) {
        return email.replace(/^(.)(.*)(.{2}@)/, "$1*****$3");
    }

    return (
        <Paper withBorder p={"md"}>
            <Stack>
                <Text>
                    This user: {user.username} with email{" "}
                    {maskEmail(user.email)} is not yet verified.
                </Text>

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
                        try {
                            setSentTokenSubmit(!!verificationToken);

                            await mutateAsync({
                                query: {
                                    token: verificationToken,
                                },
                            });
                        } catch {}
                    }}
                    disabled={
                        (isEmailWaitingTime && !verificationToken) || isPending
                    }
                >
                    {verificationToken ? "Verify" : "Send Token"}
                </Button>
                {!verificationToken && isEmailWaitingTime && (
                    <Text fz={"xs"}>wait: {timeLeft}</Text>
                )}
            </Stack>
        </Paper>
    );
}
