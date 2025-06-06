"use client";

import type { DefaultEventsMap } from "@socket.io/component-emitter";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function ChatPage() {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [socket, setSocket] = useState<Socket<
        DefaultEventsMap,
        DefaultEventsMap
    > | null>(null);
    const messagesRef = useRef<HTMLUListElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        // Initialize Socket.IO client - Fixed configuration
        const socketInstance = io(
            process.env.NODE_ENV === "production"
                ? "https://the-culling-games.up.railway.app"
                : "http://localhost:8000",
            {
                path: "/ws", // This should match your FastAPI Socket.IO mount path
                transports: ["websocket", "polling"], // Specify transport methods
                upgrade: true,
                rememberUpgrade: true,
            }
        );

        setSocket(socketInstance);

        // Connection event handlers
        socketInstance.on("connect", () => {
            console.log("Connected to server");
        });

        socketInstance.on("disconnect", () => {
            console.log("Disconnected from server");
        });

        socketInstance.on("connect_error", (error) => {
            console.error("Connection error:", error);
        });

        // Listen for incoming messages from the server
        socketInstance.on("message", (data: { msg: string }) => {
            setMessages((prev) => [...prev, data.msg]);
        });

        // Auto-focus input on mount
        if (inputRef.current) {
            inputRef.current.focus();
        }

        // Cleanup on unmount
        return () => {
            socketInstance.disconnect();
        };
    }, []);

    useEffect(() => {
        // Scroll to the latest message
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        const message = inputValue.trim();
        if (!message || !socket) return;

        socket.emit("message", { msg: message });
        setInputValue("");
        if (inputRef.current) {
            inputRef.current.focus();
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
        <div className="chat-page">
            <header className="header">
                <h1 className="title">FastAPI Chat Application</h1>
                <p className="description">
                    Welcome to the real-time chat powered by FastAPI and
                    Socket.IO. Type your message below and hit{" "}
                    <strong>Send</strong> or press <strong>Enter</strong>.
                </p>
            </header>

            <section className="chat-container" aria-label="Chat message area">
                {/* Message list */}
                <ul ref={messagesRef} className="messages" aria-live="polite">
                    {messages.map((message, index) => (
                        <li key={index} className="message-item">
                            {message}
                        </li>
                    ))}
                </ul>

                {/* Input and send button */}
                <div className="input-area">
                    <label htmlFor="message-input" className="visually-hidden">
                        Your message:
                    </label>
                    <input
                        id="message-input"
                        ref={inputRef}
                        type="text"
                        autoComplete="off"
                        placeholder="Enter your message here..."
                        aria-label="Message input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="input"
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!hasText}
                        className="send-button"
                    >
                        Send
                    </button>
                </div>
            </section>

            <style jsx>{`
                .chat-page {
                    font-family: Arial, sans-serif;
                    margin: 2rem;
                    background-color: #f9f9f9;
                    color: #333;
                }

                .header {
                    margin-bottom: 1.5rem;
                }

                .title {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .chat-container {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 1rem;
                    background-color: #fff;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .messages {
                    list-style-type: none;
                    padding: 0;
                    max-height: 300px;
                    overflow-y: auto;
                    margin-bottom: 1rem;
                }

                .message-item {
                    padding: 0.5rem;
                    border-bottom: 1px solid #eee;
                }

                .input-area {
                    display: flex;
                    gap: 0.5rem;
                }

                .input {
                    flex: 1;
                    padding: 0.5rem;
                    font-size: 1rem;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }

                .send-button {
                    padding: 0.5rem 1rem;
                    font-size: 1rem;
                    border: none;
                    border-radius: 4px;
                    background-color: #007bff;
                    color: #fff;
                    cursor: pointer;
                }

                .send-button:disabled {
                    background-color: #aaa;
                    cursor: not-allowed;
                }

                .visually-hidden {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
            `}</style>
        </div>
    );
}
