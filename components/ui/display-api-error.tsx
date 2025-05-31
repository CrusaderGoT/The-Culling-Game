import { HttpValidationError } from "@/api/client";
import { Alert, Stack, Text } from "@mantine/core";
import { Icon, IconAlertCircle } from "@tabler/icons-react";

type DisplayAPIErrorProp = {
    error: HttpValidationError | Error;
    color?: string;
    title?: string;
    AlertIcon?: Icon;
};

function ErrorAlert({ error }: { error: HttpValidationError | Error }) {
    if (error instanceof Error) {
        return <Text>{error.message}</Text>;
    } else if (typeof error.detail === "string") {
        return <Text>{error.detail}</Text>;
    } else if (typeof error.detail === "object") {
        return (
            <Stack>
                {error.detail?.map((e, i) => (
                    <Text key={i}>{e.msg}</Text>
                ))}
            </Stack>
        );
    } else {
        return <Text>API Error Occured</Text>;
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
            <ErrorAlert error={error} />
        </Alert>
    );
}
