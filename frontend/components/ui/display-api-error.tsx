import { HttpValidationError } from "@/api/client";
import { Alert, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

type DisplayAPIErrorProp = {
    error: HttpValidationError | Error;
};
function ErrorAlert({ error }: DisplayAPIErrorProp) {
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

export function DisplayAPIError({ error }: DisplayAPIErrorProp) {
    return (
        <Alert
            title="An Error Occured"
            color="red"
            icon={<IconAlertCircle />}
            my={"xs"}
        >
            <ErrorAlert error={error} />
        </Alert>
    );
}
