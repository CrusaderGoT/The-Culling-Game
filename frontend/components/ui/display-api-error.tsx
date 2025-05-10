import { HttpValidationError } from "@/api/client";
import { Stack, Text } from "@mantine/core";

type DisplayAPIErrorProp = {
    error: HttpValidationError;
};
export function DisplayAPIError({ error }: DisplayAPIErrorProp) {
    if (typeof error.detail === "string") {
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
