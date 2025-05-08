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
    Title,
} from "@mantine/core";

import { z } from "zod";

import Naluka from "@/fonts/NalukaFont";
import {
    IconAt,
    IconFishOff,
    IconLocationPin,
    IconLockPassword,
    IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function CreateUserForm() {
    const router = useRouter();

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

    const handleSubmit = (data: zCreateUserType) => {
        console.log(data);
    };

    return (
        <Box flex={1}>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        withAsterisk
                        label="Username"
                        placeholder="Not Your Player Name"
                        key={form.key("username")}
                        {...form.getInputProps("username")}
                        leftSection={<IconUser size={18} />}
                        rightSection={<IconFishOff size={18} />}
                    />
                    <TextInput
                        withAsterisk
                        label="Email"
                        placeholder="youremail@example.com"
                        key={form.key("email")}
                        {...form.getInputProps("email")}
                        leftSection={<IconAt size={18} />}
                    />

                    <Select
                        label={"Country"}
                        placeholder="Select Your Country"
                        data={COUNTRIES}
                        filter={searchOptionsFilter}
                        searchable
                        nothingFoundMessage="No country with that name..."
                        leftSection={<IconLocationPin size={18} />}
                    />

                    <PasswordInput
                        withAsterisk
                        label="Password"
                        placeholder="your deepest darkest secret"
                        key={form.key("password")}
                        {...form.getInputProps("password")}
                        required
                        leftSection={<IconLockPassword size={18} />}
                    />
                    <PasswordInput
                        withAsterisk
                        label="Confirm"
                        placeholder="repeat your deepest darkest secret"
                        key={form.key("confirm_password")}
                        {...form.getInputProps("confirm_password")}
                        required
                        leftSection={<IconLockPassword size={18} />}
                    />
                </Stack>

                <Stack my={"md"}>
                    <Button color="green" type="submit">
                        Create User
                    </Button>

                    <Divider label="or" />

                    <Button onClick={() => router.push("/login")}>
                        Log In
                    </Button>
                </Stack>
            </form>
        </Box>
    );
}

function SignUpCard() {
    return (
        <Card
            mah={500}
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
                gradient="linear-gradient(225deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, .65) 40%)"
                opacity={1}
                zIndex={0}
            />
            <Stack
                gap={"xs"}
                style={{
                    zIndex: 1,
                }}
            >
                <Title
                    ff={`${Naluka.style.fontFamily}`}
                    order={4}
                    c={"gold"}
                    ta={"center"}
                >
                    Welcome to the Culling Games
                </Title>

                <ScrollAreaAutosize mah={450}>
                    <Text fz={"sm"} ta={"justify"} c={"white"} lh={2} lts={2}>
                        {signupMessage}
                    </Text>
                </ScrollAreaAutosize>
            </Stack>
        </Card>
    );
}

const signupMessage = `
    A treacherous battleground where only the cunning 
    and the brave survive. By creating a player, you take 
    your first step into a world of peril and opportunity—a 
    realm carved from desperation and ambition. To join the 
    fray, you must forge your identity in blood and code: fill 
    out the form, choose your country's banner to bear, and set 
    your credentials that will define your honor and your fate. 
    Every choice you make now—from the language you speak to the 
    symbols you bear—will echo through the crucible of competition that awaits.
    
    As you set your hand to the pen, you feel the weight of 
    destiny settle upon your shoulders. Behind each dropdown 
    menu and text field lies a hidden gauntlet, where unseen 
    eyes measure your resolve. Once you submit, there is no 
    turning back. Prepare your mind for riddles of strategy, 
    your reflexes for split-second decisions, and your courage 
    for trials that will test the limits of human endurance. 
    The Culling Games are no mere contest of strength; they 
    are a labyrinth of alliances, betrayals, and narrow escapes 
    in which every decision could be your last.

    Beyond registration lies the arena's threshold: a shifting 
    landscape strewn with traps, treachery, and tantalizing 
    rewards. Ancient halls echo with the whispers of champions 
    long since fallen, their names etched in cracked stone as 
    warnings to the living. You will face opponents who wield 
    every advantage—stealth, sorcery, or sheer savagery—and you 
    will need every ounce of wit to outmaneuver them. 
    Will you strike swiftly from the shadows, trade blows in 
    open combat, or weave through the chaos unseen? The path 
    you choose will shape not only your destiny, but the very 
    legend you leave behind.

    As the final lines of your profile lock into place, feel 
    the surge of adrenaline that heralds your transformation 
    from hopeful novice to something more—perhaps a hero, 
    perhaps a footnote in someone else's story. Brace yourself 
    for the opening horn; the crowd's roar will rise like a 
    thunderclap, and the gates will grind open to reveal a 
    world where glory beckons as readily as oblivion. Will you 
    rise to the challenge and carve your name into legend, or 
    will you fall into the shadows of those who came before? 
    The choice is yours, but remember: in The Culling Games, 
    survival is a promise no one can make.

`;

export function CreateUserPaper() {
    return (
        <Paper radius="md" p="md" withBorder>
            <Flex gap={"md"} direction={{ base: "column-reverse", sm: "row" }}>
                <CreateUserForm />

                <SignUpCard />
            </Flex>
        </Paper>
    );
}
