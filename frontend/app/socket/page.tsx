"use client";

import {
    useSocket,
    useSocketEmit,
    useSocketEventStable,
} from "@/lib/contexts/socket-context-provider";
import {
    Button,
    Group,
    Mark,
    Paper,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const messagesRef = useRef<HTMLUListElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Get socket connection status
    const { isConnected, error } = useSocket();

    // Get emit function
    const { emit } = useSocketEmit();

    useSocketEventStable("chat", (data: { message: string }) => {
        setMessages((prev) => [...prev, data.message]);
    });

    useEffect(() => {
        // Auto-focus input on mount
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        // Scroll to the latest message
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        const message = inputValue.trim();
        if (!message) return;

        const success = emit("chat", { message: message });
        if (success) {
            setInputValue("");
            if (inputRef.current) {
                inputRef.current.focus();
            }
            notifications.show({
                message: "success sent",
            });
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            if (inputValue.trim().length > 0) {
                handleSend();
            }
        }
    };

    const hasText = inputValue.trim().length > 0;

    return (
        <Paper mx={"auto"} p={"md"} my={50} withBorder>
            <Stack>
                <Title> FastAPI Chat Application</Title>
                <Text truncate>
                    Welcome to the real-time chat powered by FastAPI and
                    Socket.IO. Type your message below and hit <Mark>Send</Mark>{" "}
                    or press <Mark>Enter</Mark>.
                </Text>
                {/* Connection status indicator */}
                <Group>
                    <span>
                        {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
                    </span>
                    {error && <span>Error: {error}</span>}
                </Group>
            </Stack>

            <section aria-label="Chat message area">
                {/* Message list */}
                <ul ref={messagesRef} aria-live="polite">
                    {messages.map((message, index) => (
                        <li key={index}>{message}</li>
                    ))}
                </ul>

                {/* Input and send button */}
                <Group align="flex-end">
                    <TextInput
                        label="Your message:"
                        id="message-input"
                        ref={inputRef}
                        type="text"
                        autoComplete="off"
                        placeholder="Enter your message here..."
                        aria-label="Message input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!isConnected}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!hasText || !isConnected}
                        size="sm"
                    >
                        Send
                    </Button>
                </Group>
            </section>
        </Paper>
    );
}
