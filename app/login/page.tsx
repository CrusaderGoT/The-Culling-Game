import { CreateUserForm } from "@/components/user/forms/create-user-form";
import { Group, Paper } from "@mantine/core";

export default async function LoginPage() {
    return (
        <Paper withBorder p={"md"}>
            <CreateUserForm />
        </Paper>
    
);
}
