import { CreateUserPaper } from "@/components/user/forms/create-user-form";
import { Stack, Title } from "@mantine/core";

export default async function SignupPage() {
    return (
        <Stack>
            <Title ta={"center"} order={2}>
                Register to Play
            </Title>
            <CreateUserPaper />
        </Stack>
    );
}
