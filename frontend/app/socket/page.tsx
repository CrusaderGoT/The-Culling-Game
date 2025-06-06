"use client";

import {
    useSocket,
    useSocketEmit,
    useSocketEvent,
} from "@/lib/contexts/socket-context";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ChatPage() {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const messagesRef = useRef<HTMLUListElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Get socket connection status
    const { isConnected, error } = useSocket();

    // Get emit function
    const { emit } = useSocketEmit();

    // Listen for messages using the custom hook with stable handler
    const handleMessage = useCallback((data: { msg: string }) => {
        setMessages((prev) => [...prev, data.msg]);
    }, []);

    useSocketEvent("message", handleMessage);

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

        const success = emit("message", { msg: message });
        if (success) {
            setInputValue("");
            if (inputRef.current) {
                inputRef.current.focus();
            }
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

                {/* Connection status indicator */}
                <div className="connection-status">
                    <span
                        className={`status-indicator ${
                            isConnected ? "connected" : "disconnected"
                        }`}
                    >
                        {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
                    </span>
                    {error && (
                        <span className="error-message">Error: {error}</span>
                    )}
                </div>
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
                        disabled={!isConnected}
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!hasText || !isConnected}
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

                .connection-status {
                    margin-top: 1rem;
                    padding: 0.5rem;
                    border-radius: 4px;
                    background-color: #f8f9fa;
                }

                .status-indicator {
                    font-weight: bold;
                    margin-right: 1rem;
                }

                .status-indicator.connected {
                    color: #28a745;
                }

                .status-indicator.disconnected {
                    color: #dc3545;
                }

                .error-message {
                    color: #dc3545;
                    font-size: 0.9rem;
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

                .input:disabled {
                    background-color: #f5f5f5;
                    cursor: not-allowed;
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
