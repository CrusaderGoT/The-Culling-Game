import { CreateUserPaper } from "@/components/user/forms/create-user-form";
import { Box, Title } from "@mantine/core";

export default async function SignupPage() {
    return (
        <Box>
            <Title ta={"center"} order={2}>
                Create a User Account
            </Title>
            <CreateUserPaper />
        </Box>
    );
}
