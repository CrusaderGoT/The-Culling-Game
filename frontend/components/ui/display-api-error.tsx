"use client";

import { HttpValidationError } from "@/api/client";
import { Alert, Stack, Text } from "@mantine/core";
import { Icon, IconAlertCircle } from "@tabler/icons-react";

type DisplayAPIErrorProp = {
    error: HttpValidationError | Error;
    color?: string;
    title?: string;
    AlertIcon?: Icon;
};

function APIErrorAlertText({ error }: { error: HttpValidationError | Error }) {
    const errMsg = getAPIErrorMessage(error);

    if (typeof errMsg === "string") {
        return <Text>{errMsg}</Text>;
    } else {
        return (
            <Stack>
                {errMsg.map((e, i) => (
                    <Text key={i}>{e}</Text>
                ))}
            </Stack>
        );
    }
}

export function DisplayAPIError({
    error,
    title = "An Error Occured",
    color = "red",
    AlertIcon = IconAlertCircle,
}: DisplayAPIErrorProp) {
    return (
        <Alert title={title} color={color} icon={<AlertIcon />} my={"xs"}>
            <APIErrorAlertText error={error} />
        </Alert>
    );
}

export function getAPIErrorMessage(error: HttpValidationError | Error) {
    if (error instanceof Error) {
        return error.message;
    } else if (typeof error.detail === "string") {
        return error.detail;
    } else if (typeof error === "string") {
        return error;
    } else if (typeof error.detail === "object") {
        return error.detail?.map((e) => e.msg);
    } else {
        return "API Error Occured";
    }
}
