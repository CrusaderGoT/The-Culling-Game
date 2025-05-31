import type { CreateClientConfig } from "@/api/client/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
    ...config,
    baseUrl:
        process.env.NODE_ENV === "development"
            ? "http://localhost:8000"
            : "https://the-culling-games.up.railway.app",
});
