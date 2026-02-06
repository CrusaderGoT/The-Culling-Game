import styles from "@/styles/admin-access-denied.module.css";
import {
    Button,
    Center,
    Container,
    Image,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { IconHome, IconLock } from "@tabler/icons-react";
import Link from "next/link";

export function AdminAccessDenied() {
    return (
        <Container className={styles.container}>
            <Center className={styles.content}>
                <Stack align="center" gap="xl" className={styles.stack}>
                    <div className={styles.imageContainer}>
                        <Image
                            src="/images/HiromiKogane.png"
                            alt="Access Restricted"
                            className={styles.image}
                        />
                        <div className={styles.lockIcon}>
                            <IconLock size={40} />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className={styles.textContent}>
                        <Title order={1} className={styles.title}>
                            Oops! You seem lost
                        </Title>

                        <Title order={2} className={styles.subtitle}>
                            This area is restricted to administrators
                        </Title>

                        <Text size="lg" className={styles.description}>
                            You&apos;ve wandered into the admin section, but you
                            don&apos;t have the necessary permissions to access
                            this area. Don&apos;t worry, it happens to the best
                            of us!
                        </Text>

                        <Text size="md" className={styles.helpText}>
                            If you believe you should have access to this
                            section, please contact your administrator.
                        </Text>
                    </div>

                    {/* Action Button */}
                    <Button
                        component={Link}
                        href="/"
                        size="lg"
                        leftSection={<IconHome size={20} />}
                        className={styles.homeButton}
                    >
                        Take me home
                    </Button>
                </Stack>
            </Center>
        </Container>
    );
}
