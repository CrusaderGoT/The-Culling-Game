// lib/contexts/socket-context.tsx
"use client";

import type { DefaultEventsMap } from "@socket.io/component-emitter";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
    socket: Socket<DefaultEventsMap, DefaultEventsMap> | null;
    isConnected: boolean;
    error: string | null;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    error: null,
});

interface SocketProviderProps {
    children: ReactNode;
    serverUrl: string;
    socketPath?: string;
}

export function SocketContextProvider({
    children,
    serverUrl,
    socketPath = "/ws/socket.io/",
}: SocketProviderProps) {
    const [socket, setSocket] = useState<Socket<
        DefaultEventsMap,
        DefaultEventsMap
    > | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Initialize Socket.IO client
        const socketInstance = io(serverUrl, {
            path: socketPath,
            transports: ["websocket", "polling"],
            upgrade: true,
            rememberUpgrade: true,
            autoConnect: true,
        });

        // Connection event handlers
        socketInstance.on("connect", () => {
            console.log("✅ Connected to server");
            setIsConnected(true);
            setError(null);
        });

        socketInstance.on("disconnect", (reason) => {
            console.log("❌ Disconnected from server:", reason);
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {
            console.error("🚫 Connection error:", error);
            setError(error.message);
            setIsConnected(false);
        });

        socketInstance.on("reconnect", (attemptNumber) => {
            console.log("🔄 Reconnected after", attemptNumber, "attempts");
            setError(null);
        });

        socketInstance.on("reconnect_error", (error) => {
            console.error("🚫 Reconnection error:", error);
            setError(error.message);
        });

        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
            console.log("🧹 Cleaning up socket connection");
            socketInstance.disconnect();
        };
    }, [serverUrl, socketPath]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, error }}>
            {children}
        </SocketContext.Provider>
    );
}

// Custom hook to use the socket context
export function useSocket() {
    const context = useContext(SocketContext);

    if (context === undefined) {
        throw new Error("useSocket must be used within a SocketProvider");
    }

    return context;
}

// Additional utility hooks for common socket operations

/**
 * Use useCallback pattern Socket Event
 * 
 * @param eventName
 * @param handler
 * ```
 * // Example: Using useCallback to stabilize the handler
    export function ChatComponentWithCallback() {
    const [messages, setMessages] = useState<string[]>([]);

    // Stabilize the handler with useCallback
    const handleMessage = useCallback((data: { msg: string }) => {
        setMessages(prev => [...prev, data.msg]);
    }, []); // Empty deps because setMessages is stable

    // Now this won't cause infinite re-renders
    useSocketEvent("message", handleMessage);

    return <div>...</div>;
    }
 * ```
 */
export function useSocketEvent<T = any>(
    eventName: string,
    handler: (data: T) => void
) {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on(eventName, handler);

        return () => {
            socket.off(eventName, handler);
        };
    }, [socket, eventName, handler]);
}

/**
 * Use ref to avoid dependency issues Socket Event
 * @param eventName 
 * @param handler 
 * ```
 * // Exampl: Using the stable version (no useCallback needed)
    export function ChatComponentWithStable() {
    const [messages, setMessages] = useState<string[]>([]);

    // No useCallback needed - the hook handles stability internally
    useSocketEventStable("message", (data: { msg: string }) => {
        setMessages(prev => [...prev, data.msg]);
    });

    return <div>...</div>;
    }
 * ```
 */
export function useSocketEventStable<T = any>(
    eventName: string,
    handler: (data: T) => void
) {
    const { socket } = useSocket();
    const handlerRef = useRef(handler);

    // Update ref when handler changes
    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!socket) return;

        const stableHandler = (data: T) => handlerRef.current(data);

        socket.on(eventName, stableHandler);

        return () => {
            socket.off(eventName, stableHandler);
        };
    }, [socket, eventName]); // No handler dependency needed
}

export function useSocketEmit() {
    const { socket, isConnected } = useSocket();

    const emit = (eventName: string, data?: any) => {
        if (socket && isConnected) {
            socket.emit(eventName, data);
            return true;
        } else {
            console.warn(`Cannot emit ${eventName}: socket not connected`);
            return false;
        }
    };

    return { emit, isConnected };
}
