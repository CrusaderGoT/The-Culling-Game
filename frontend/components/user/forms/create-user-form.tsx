"use client";

import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";

import { Country } from "@/api/client";
import { zCreateUser } from "@/api/client/zod.gen";

import { COUNTRIES } from "@/lib/constants/COUNTRIES";
import {
    Box,
    Button,
    Card,
    ComboboxItem,
    Divider,
    Flex,
    OptionsFilter,
    Overlay,
    Paper,
    PasswordInput,
    ScrollAreaAutosize,
    Select,
    Stack,
    Text,
    TextInput,
    Title
} from "@mantine/core";

import { z } from "zod";

export function CreateUserForm() {
    type zCreateUserType = z.infer<typeof zCreateUser>;

    const initialValues: zCreateUserType = {
        username: "",
        email: "",
        country: Country.AD,
        password: "",
        confirm_password: "",
    };

    const form = useForm<zCreateUserType>({
        mode: "uncontrolled",
        initialValues,
        validate: zodResolver(zCreateUser),
    });

    const searchOptionsFilter: OptionsFilter = ({ options, search }) => {
        const splittedSearch = search.toLowerCase().trim().split(" ");
        return (options as ComboboxItem[]).filter((option) => {
            const words = option.label.toLowerCase().trim().split(" ");
            return splittedSearch.every((searchWord) =>
                words.some((word) => word.includes(searchWord))
            );
        });
    };

    return (
        <Box flex={1}>
            <form onSubmit={form.onSubmit((values) => console.log(values))}>
                <Stack>
                    <TextInput
                        withAsterisk
                        label="Username"
                        placeholder="Not Your Player Name"
                        key={form.key("username")}
                        {...form.getInputProps("username")}
                    />
                    <TextInput
                        withAsterisk
                        label="Email"
                        placeholder="youremail@example.com"
                        key={form.key("email")}
                        {...form.getInputProps("email")}
                    />

                    <Select
                        label={"Country"}
                        placeholder="Select Your Country"
                        data={COUNTRIES}
                        filter={searchOptionsFilter}
                        searchable
                        nothingFoundMessage="No country with that name..."
                    />

                    <PasswordInput
                        withAsterisk
                        label="Password"
                        placeholder="your deepest darkest secret"
                        key={form.key("password")}
                        {...form.getInputProps("password")}
                        required
                    />
                    <PasswordInput
                        withAsterisk
                        label="Confirm"
                        placeholder="repeat your deepest darkest secret"
                        key={form.key("confirm_password")}
                        {...form.getInputProps("confirm_password")}
                        required
                    />
                </Stack>

                <Stack my={"md"}>
                    <Button color="green" type="submit">
                        Create User
                    </Button>

                    <Divider label="or" />

                    <Button onClick={() => window.location.href = "/login"}>Log In</Button>
                </Stack>
            </form>
        </Box>
    );
}

function SignUpMessage() {
    return (
        <Card
            mah={600}
            h={500}
            my={"auto"}
            style={{
                backgroundImage: "url(/images/Kogane_showing_player_data.png)",
                backgroundPosition: "center",
                backgroundSize: "cover",
                position: "relative",
                flex: 1,
            }}
        >
            <Overlay
                gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, .65) 40%)"
                opacity={1}
                zIndex={0}
            />
            <Stack
                gap={"xs"}
                style={{
                    zIndex: 1,
                }}
            >
                <Title order={4} c={"white"} ta={"center"}>
                    Welcome to the Culling Games
                </Title>

                <ScrollAreaAutosize mah={350}>
                    <Text fz={"sm"} ta={"justify"} c={"white"} lh={2} lts={2}>
                        A treacherous battleground where only the cunning and
                        the brave survive. By creating a player, you take your
                        first step into a world of peril and opportunity. To
                        participate, forge your identity by filling out the
                        form. Choose your country, set your credentials, and
                        prepare yourself for the challenges ahead. But
                        beware—this is no ordinary game. The Culling Games are
                        fraught with danger, where every decision could be your
                        last. Will you rise to the challenge and carve your name
                        into legend, or will you fall to the shadows of those
                        who came before? The choice is yours, but remember:
                        survival is not guaranteed.
                    </Text>
                </ScrollAreaAutosize>
            </Stack>
        </Card>
    );
}

export function CreateUserPaper() {
    return (
        <Paper radius="md" p="md" withBorder>
            <Flex gap={"md"} direction={{ base: "column-reverse", sm: "row" }}>
                <CreateUserForm />

                <SignUpMessage />
            </Flex>
        </Paper>
    );
}
